// Checks that supabase/seed.sql is internally consistent and only contains
// data the original app's rules (App.java) could have produced. These checks
// are written independently of scripts/generate-seed.mjs on purpose.

import { beforeAll, describe, expect, it } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';
import { createDatabase, num } from './helpers';

let db: PGlite;
beforeAll(async () => {
  db = await createDatabase({ seed: true });
});

const rows = async <T = Record<string, unknown>>(sql: string) => (await db.query<T>(sql)).rows;
const count = async (sql: string) => num((await rows<{ n: unknown }>(sql))[0].n);

describe('volume', () => {
  it('has enough data to make a convincing demo', async () => {
    expect(await count('select count(*) n from customer')).toBeGreaterThanOrEqual(30);
    expect(await count('select count(*) n from account')).toBeGreaterThanOrEqual(45);
    expect(await count('select count(*) n from transaction')).toBeGreaterThanOrEqual(1000);
    expect(await count('select count(*) n from purchase')).toBeGreaterThanOrEqual(1000);
    expect(await count('select count(*) n from loan')).toBeGreaterThanOrEqual(5);
  });

  it('has one demo customer with extensive data (README: "a user with a lot of data")', async () => {
    const [demo] = await rows<{ accounts: unknown; cards: unknown; loans: unknown }>(`
      select (select count(*) from account_ownership where customer_id = 'C00001') accounts,
             (select count(*) from card where customer_id = 'C00001') cards,
             (select count(*) from loan where customer_id = 'C00001') loans`);
    expect(num(demo.accounts)).toBeGreaterThanOrEqual(4);
    expect(num(demo.cards)).toBeGreaterThanOrEqual(4);
    expect(num(demo.loans)).toBeGreaterThanOrEqual(2);
  });

  it('every branch has a display name and address (D6)', async () => {
    expect(await count('select count(*) n from branch where branch_name is null or address is null')).toBe(0);
  });

  it('customer names are unique (login is by exact name, App.java:916)', async () => {
    expect(await count('select count(*) - count(distinct customer_name) n from customer')).toBe(0);
  });
});

describe('accounts', () => {
  it('every account has at least one owner', async () => {
    expect(await count('select count(*) n from account a where not exists (select 1 from account_ownership o where o.account_id = a.account_id)')).toBe(0);
  });

  it('each account is in exactly the subtype table matching its account_type', async () => {
    expect(await count(`select count(*) n from account a where
      (a.account_type = 'checking') <> exists (select 1 from checking c where c.account_id = a.account_id) or
      (a.account_type = 'savings')  <> exists (select 1 from savings s where s.account_id = a.account_id) or
      a.account_type not in ('checking', 'savings')`)).toBe(0);
  });

  it('interest rates match account creation (savings 1.25, checking 0)', async () => {
    expect(await count(`select count(*) n from account where
      (account_type = 'savings' and interest_rate <> 1.25) or (account_type = 'checking' and interest_rate <> 0)`)).toBe(0);
  });

  it('savings minimum balance / penalty pairs are ones accountAction() assigns', async () => {
    const pairs = await rows<{ minimum_balance: string; penalty: string }>('select distinct minimum_balance, penalty from savings');
    const allowed = new Set(['1000.00/50.00', '500.00/50.00', '100.00/25.00']);
    for (const p of pairs) expect(allowed).toContain(`${p.minimum_balance}/${p.penalty}`);
  });

  it('checking balances are positive (withdrawals/debit purchases cannot reach zero)', async () => {
    expect(await count(`select count(*) n from account where account_type = 'checking' and balance <= 0`)).toBe(0);
  });

  it('savings balances respect the minimum balance', async () => {
    expect(await count(`select count(*) n from account a join savings s using (account_id) where a.balance < s.minimum_balance`)).toBe(0);
  });
});

describe('cards', () => {
  it('each card is in exactly the subtype table matching its card_type', async () => {
    expect(await count(`select count(*) n from card k where
      (k.card_type = 'credit') <> exists (select 1 from credit c where c.card_id = k.card_id) or
      (k.card_type = 'debit')  <> exists (select 1 from debit d where d.card_id = k.card_id) or
      k.card_type not in ('credit', 'debit')`)).toBe(0);
  });

  it('debit cards are linked to a checking account their holder owns; credit cards have no account', async () => {
    expect(await count(`select count(*) n from card k where k.card_type = 'debit' and not exists (
      select 1 from account_ownership o join checking c using (account_id)
      where o.account_id = k.account_id and o.customer_id = k.customer_id)`)).toBe(0);
    expect(await count(`select count(*) n from card where card_type = 'credit' and account_id is not null`)).toBe(0);
  });

  it('card.customer_name matches the customer record', async () => {
    expect(await count('select count(*) n from card k join customer c using (customer_id) where k.customer_name <> c.customer_name')).toBe(0);
  });

  it('credit cards are created at 18% with nothing due, and stay within their limit', async () => {
    expect(await count(`select count(*) n from credit where interest_rate <> 18 or balance_due <> 0
      or running_balance < 0 or running_balance > "limit"`)).toBe(0);
  });

  it('credit running balance equals the sum of that card\'s purchases', async () => {
    expect(await count(`select count(*) n from credit c where c.running_balance <>
      coalesce((select sum(amount) from purchase p where p.card_id = c.card_id), 0)`)).toBe(0);
  });
});

describe('transactions and purchases', () => {
  it('only deposits and withdrawals are recorded as transactions', async () => {
    const types = await rows<{ transaction_type: string }>('select distinct transaction_type from transaction order by 1');
    expect(types.map((t) => t.transaction_type)).toEqual(['deposit', 'withdrawal']);
  });

  it('deposits only happen at Full Service branches (App.java:453)', async () => {
    expect(await count(`select count(*) n from transaction t join branch b using (branch_id)
      where t.transaction_type = 'deposit' and b.branch_type <> 'Full Service'`)).toBe(0);
  });

  it('transactions are made by an owner of the account', async () => {
    expect(await count(`select count(*) n from transaction t where not exists (
      select 1 from account_ownership o where o.account_id = t.account_id and o.customer_id = t.customer_id)`)).toBe(0);
  });

  it('amounts are positive and dates fall in the seeded year', async () => {
    expect(await count(`select count(*) n from transaction where amount <= 0
      or transaction_date not between '2025-11-01' and '2026-10-25'`)).toBe(0);
    expect(await count(`select count(*) n from purchase where amount <= 0
      or purchase_date not between '2025-11-01' and '2026-10-25'`)).toBe(0);
  });
});

describe('loans', () => {
  it('interest rate / monthly payment pairs are ones getLoan() assigns', async () => {
    const pairs = await rows<{ interest_rate: string; monthly_payment: string }>('select distinct interest_rate, monthly_payment from loan');
    const allowed = new Set(['5.00/500.00', '4.00/400.00', '3.75/350.00', '5.00/250.00', '5.00/100.00', '6.00/50.00']);
    for (const p of pairs) expect(allowed).toContain(`${p.interest_rate}/${p.monthly_payment}`);
  });

  it('outstanding amounts are never negative', async () => {
    expect(await count('select count(*) n from loan where amount < 0')).toBe(0);
  });
});

describe('ID generators continue after the seeded rows', () => {
  it('the next account id does not collide with seeded data', async () => {
    await db.exec('begin');
    try {
      const [{ account_id }] = await rows<{ account_id: string }>(
        `insert into account (account_type, balance, interest_rate) values ('checking', 1, 0) returning account_id`);
      const [{ max }] = await rows<{ max: string }>(`select max(account_id) max from account where account_id <> '${account_id}'`);
      expect(account_id > max).toBe(true);
    } finally {
      await db.exec('rollback');
    }
  });
});
