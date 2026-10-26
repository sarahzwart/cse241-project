-- Business operations from App.java as PostgreSQL functions (decision D2).
--
-- Each function is one atomic database transaction (BUG-09 fix): if any step
-- fails, nothing is written. Rules reproduce App.java, with only the fixes
-- approved under D4 (2026-10-26):
--   BUG-02 savings penalty withdrawal charges amount + savings.penalty, is
--          recorded as a transaction, and may not take the balance below $0
--   BUG-04 loan tiers use inclusive lower bounds
--   BUG-05 savings tiers use inclusive lower bounds
--   BUG-06 all amounts must be greater than zero
--   BUG-07 loan payments may not exceed the remaining loan or overdraw the account
--   BUG-08 debit cards can only be linked to a checking account
-- BUG-03 (unreachable "below $50" savings check) is kept as-is.
--
-- Error messages reuse the original console messages where one existed.
-- Only the service role (the Next.js server) may execute these (decision D3).

-- Helpers -------------------------------------------------------------------

-- The original stored the JVM's local time; the bank is in Bethlehem, PA.
create or replace function _bank_now() returns timestamp
language sql stable as $$
    select (now() at time zone 'America/New_York')::timestamp
$$;

-- BUG-06: amounts are rounded to cents (column precision) and must be positive.
create or replace function _money(p_amount numeric) returns numeric
language plpgsql immutable as $$
begin
    if p_amount is null or round(p_amount, 2) <= 0 then
        raise exception 'Invalid amount. Please enter an amount greater than zero.';
    end if;
    return round(p_amount, 2);
end $$;

create or replace function _require_customer(p_customer_id text) returns customer
language plpgsql stable as $$
declare
    c customer;
begin
    select * into c from customer where customer_id = p_customer_id;
    if not found then
        raise exception 'Error: User ''%'' not found.', p_customer_id;
    end if;
    return c;
end $$;

-- Account must be owned by the customer (the original only offers the
-- customer's own accounts). Locks the row for the rest of the transaction.
create or replace function _owned_account(p_customer_id text, p_account_id text) returns account
language plpgsql as $$
declare
    a account;
begin
    select acc.* into a from account acc
    join account_ownership o on o.account_id = acc.account_id
    where acc.account_id = p_account_id and o.customer_id = p_customer_id
    for update of acc;
    if not found then
        raise exception 'Error: Account ''%'' not found. Please enter a valid Account ID', p_account_id;
    end if;
    return a;
end $$;

-- Deposit (App.java:452-503) --------------------------------------------------
-- Only at Full Service branches; recorded as a 'deposit' transaction.
create or replace function deposit(p_customer_id text, p_account_id text, p_branch_id text, p_amount numeric)
returns text
language plpgsql as $$
declare
    v_amount numeric := _money(p_amount);
    v_transaction_id text;
begin
    if not exists (select 1 from branch where branch_id = p_branch_id and branch_type = 'Full Service') then
        raise exception 'Error: Branch ''%'' not found. Please enter a valid branch ID', p_branch_id;
    end if;
    perform _owned_account(p_customer_id, p_account_id);

    update account set balance = balance + v_amount where account_id = p_account_id;
    insert into transaction (transaction_type, transaction_date, amount, customer_id, account_id, branch_id)
    values ('deposit', _bank_now(), v_amount, p_customer_id, p_account_id, p_branch_id)
    returning transaction_id into v_transaction_id;
    return v_transaction_id;
end $$;

-- Withdrawal (App.java:505-598) -----------------------------------------------
-- Any branch. Returns {"status": "ok", "transaction_id": ...}, or for a savings
-- withdrawal below the minimum balance without p_accept_penalty,
-- {"status": "penalty_required", "penalty": ..., "minimum_balance": ...} and
-- changes nothing (the original's "Are you sure? YES or NO" prompt).
create or replace function withdraw(
    p_customer_id text, p_account_id text, p_branch_id text, p_amount numeric,
    p_accept_penalty boolean default false)
returns jsonb
language plpgsql as $$
declare
    v_amount numeric := _money(p_amount);
    a account;
    v_minimum numeric;
    v_penalty numeric;
    v_charge numeric;
    v_transaction_id text;
begin
    if not exists (select 1 from branch where branch_id = p_branch_id) then
        raise exception 'Error: Branch ''%'' not found. Please enter a valid branch ID', p_branch_id;
    end if;
    a := _owned_account(p_customer_id, p_account_id);
    v_charge := v_amount;

    if a.account_type = 'savings' then
        -- getMinimumBalance() returns 0.0 when there is no savings row.
        select coalesce(minimum_balance, 0), coalesce(penalty, 0) into v_minimum, v_penalty
        from savings where account_id = p_account_id;
        v_minimum := coalesce(v_minimum, 0);
        v_penalty := coalesce(v_penalty, 0);

        if a.balance - v_amount < v_minimum then
            if not p_accept_penalty then
                return jsonb_build_object('status', 'penalty_required',
                    'penalty', v_penalty, 'minimum_balance', v_minimum);
            end if;
            v_charge := v_amount + v_penalty;   -- BUG-02 fix
            if a.balance - v_charge < 0 then
                raise exception 'You cannot withdraw that amount. With the $% penalty your balance would be below zero.', v_penalty;
            end if;
        elsif a.balance - v_amount < 50.00 then
            -- BUG-03: unreachable while minimum balances are >= $100; kept as-is.
            raise exception 'You cannot withdraw that amount. Your account balance will be less that 0';
        end if;
    elsif a.balance - v_amount <= 0 then
        raise exception 'You cannot withdraw that amount. It will set your account below zero.';
    end if;

    update account set balance = balance - v_charge where account_id = p_account_id;
    insert into transaction (transaction_type, transaction_date, amount, customer_id, account_id, branch_id)
    values ('withdrawal', _bank_now(), v_amount, p_customer_id, p_account_id, p_branch_id)
    returning transaction_id into v_transaction_id;
    return jsonb_build_object('status', 'ok', 'transaction_id', v_transaction_id,
        'penalty', case when v_charge > v_amount then v_penalty else 0 end);
end $$;

-- Open account (App.java:611-661) ---------------------------------------------
create or replace function open_account(p_customer_id text, p_account_type text, p_balance numeric)
returns text
language plpgsql as $$
declare
    v_type text := lower(trim(p_account_type));
    v_balance numeric;
    v_account_id text;
begin
    if v_type is null or v_type not in ('savings', 'checking') then
        raise exception 'Invalid account type. Please enter either ''savings'' or ''checking''.';
    end if;
    v_balance := _money(p_balance);
    perform _require_customer(p_customer_id);

    if v_type = 'savings' then
        insert into account (account_type, balance, interest_rate) values ('savings', v_balance, 1.25)
        returning account_id into v_account_id;
        -- BUG-05 fix: inclusive lower bounds.
        insert into savings values (v_account_id,
            case when v_balance >= 2000 then 1000.00 when v_balance >= 1000 then 500.00 else 100.00 end,
            case when v_balance >= 1000 then 50.00 else 25.00 end);
    else
        insert into account (account_type, balance, interest_rate) values ('checking', v_balance, 0)
        returning account_id into v_account_id;
        insert into checking values (v_account_id);
    end if;

    insert into account_ownership (account_id, customer_id) values (v_account_id, p_customer_id);
    return v_account_id;
end $$;

-- Open credit card (App.java:718-731, Database.java:456-477) ------------------
create or replace function open_credit_card(p_customer_id text, p_limit numeric)
returns text
language plpgsql as $$
declare
    v_limit numeric := _money(p_limit);
    c customer := _require_customer(p_customer_id);
    v_card_id text;
begin
    insert into card (card_type, customer_id, customer_name) values ('credit', c.customer_id, c.customer_name)
    returning card_id into v_card_id;
    insert into credit (card_id, interest_rate, "limit", running_balance, balance_due)
    values (v_card_id, 18.0, v_limit, 0, 0);
    return v_card_id;
end $$;

-- Open debit card (App.java:690-716, Database.java:478-501) -------------------
create or replace function open_debit_card(p_customer_id text, p_account_id text)
returns text
language plpgsql as $$
declare
    c customer := _require_customer(p_customer_id);
    a account;
    v_card_id text;
begin
    a := _owned_account(p_customer_id, p_account_id);
    if lower(a.account_type) <> 'checking' then   -- BUG-08 fix
        raise exception 'Invalid account ID. Please choose a valid checking account.';
    end if;
    insert into card (card_type, account_id, customer_id, customer_name)
    values ('debit', p_account_id, c.customer_id, c.customer_name)
    returning card_id into v_card_id;
    insert into debit (card_id) values (v_card_id);
    return v_card_id;
end $$;

-- Take loan (App.java:287-339) ------------------------------------------------
-- loan_type is accepted case-insensitively and stored as typed, as before.
create or replace function take_loan(p_customer_id text, p_loan_type text, p_amount numeric)
returns text
language plpgsql as $$
declare
    v_amount numeric;
    v_rate numeric;
    v_monthly numeric;
    v_loan_id text;
begin
    if p_loan_type is null or lower(p_loan_type) not in ('unsecured', 'mortgage') then
        raise exception 'Invalid loan type. Please try again.';
    end if;
    v_amount := _money(p_amount);
    perform _require_customer(p_customer_id);

    -- BUG-04 fix: inclusive lower bounds.
    select rate, monthly into v_rate, v_monthly from (values
        (100000, 5.00, 500.00), (50000, 4.00, 400.00), (25000, 3.75, 350.00),
        (10000, 5.00, 250.00), (1000, 5.00, 100.00), (0, 6.00, 50.00)
    ) as tiers(lower_bound, rate, monthly)
    where v_amount >= lower_bound
    order by lower_bound desc limit 1;

    insert into loan (loan_type, amount, interest_rate, monthly_payment, customer_id)
    values (p_loan_type, v_amount, v_rate, v_monthly, p_customer_id)
    returning loan_id into v_loan_id;
    return v_loan_id;
end $$;

-- Pay loan (App.java:341-393) -------------------------------------------------
-- As in the original, no transaction row is recorded. Returns the amount
-- still owed.
create or replace function pay_loan(p_customer_id text, p_loan_id text, p_account_id text, p_amount numeric)
returns numeric
language plpgsql as $$
declare
    v_amount numeric := _money(p_amount);
    l loan;
    a account;
begin
    select * into l from loan where loan_id = p_loan_id and customer_id = p_customer_id for update;
    if not found then
        raise exception 'Error: Loan''%'' not found. Please enter a valid loan ID', p_loan_id;
    end if;
    a := _owned_account(p_customer_id, p_account_id);

    -- BUG-07 fix: no overpaying, no overdrawing (same rule as a checking withdrawal).
    if v_amount > l.amount then
        raise exception 'Payment is larger than the remaining loan balance of $%.', l.amount;
    end if;
    if a.balance - v_amount <= 0 then
        raise exception 'You cannot pay that amount. It will set your account below zero.';
    end if;

    update loan set amount = amount - v_amount where loan_id = p_loan_id;
    update account set balance = balance - v_amount where account_id = p_account_id;
    return l.amount - v_amount;
end $$;

-- Purchase (App.java:752-844) -------------------------------------------------
-- Debit: charged to the linked account. Credit: added to the running balance.
-- Recorded in purchase only (not transaction), as before.
create or replace function purchase(p_customer_id text, p_card_id text, p_vendor_id text, p_amount numeric)
returns integer
language plpgsql as $$
declare
    v_amount numeric := _money(p_amount);
    k card;
    v_balance numeric;
    v_available numeric;
    v_purchase_id integer;
begin
    select * into k from card where card_id = p_card_id and customer_id = p_customer_id;
    if not found then
        raise exception 'Invalid card ID. Please choose a valid card.';
    end if;
    if not exists (select 1 from vendor where vendor_id = p_vendor_id) then
        raise exception 'Error: Vendor ''%'' not found. Please enter a valid vendor name.', p_vendor_id;
    end if;

    if lower(k.card_type) = 'credit' then
        select "limit" - running_balance into v_available from credit where card_id = p_card_id for update;
        if v_amount > v_available then
            raise exception 'The expense is too high for this account.';
        end if;
        update credit set running_balance = running_balance + v_amount where card_id = p_card_id;
    elsif lower(k.card_type) = 'debit' then
        select balance into v_balance from account where account_id = k.account_id for update;
        if v_balance - v_amount <= 0 then
            raise exception 'The expense is too high for this account';
        end if;
        update account set balance = balance - v_amount where account_id = k.account_id;
    else
        raise exception 'Please enter a valid ID.';
    end if;

    insert into purchase (card_id, vendor_id, amount, purchase_date)
    values (p_card_id, p_vendor_id, v_amount, _bank_now())
    returning purchase_id into v_purchase_id;
    return v_purchase_id;
end $$;

-- Permissions (decision D3) ---------------------------------------------------
-- Supabase grants EXECUTE on new functions to anon/authenticated by default;
-- revoke that so only the server-side service role can run operations.
do $$
declare
    f text;
begin
    foreach f in array array[
        '_bank_now()', '_money(numeric)', '_require_customer(text)', '_owned_account(text, text)',
        'deposit(text, text, text, numeric)', 'withdraw(text, text, text, numeric, boolean)',
        'open_account(text, text, numeric)', 'open_credit_card(text, numeric)',
        'open_debit_card(text, text)', 'take_loan(text, text, numeric)',
        'pay_loan(text, text, text, numeric)', 'purchase(text, text, text, numeric)'
    ] loop
        execute format('revoke all on function %s from public', f);
        if exists (select 1 from pg_roles where rolname = 'anon') then
            execute format('revoke all on function %s from anon, authenticated', f);
        end if;
        if exists (select 1 from pg_roles where rolname = 'service_role') then
            execute format('grant execute on function %s to service_role', f);
        end if;
    end loop;
end $$;
