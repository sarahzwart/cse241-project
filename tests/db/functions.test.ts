// Tests for the business operation functions (migration 20261026000004).
// Each test runs inside a rolled-back transaction against the seeded database.
// "orig" = behavior reproduced from App.java; "BUG-xx" = approved fix (D4).

import { beforeAll, describe, expect, it } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';
import { createDatabase, num, rollback } from './helpers';

let db: PGlite;
beforeAll(async () => {
  db = await createDatabase({ seed: true });
});

// Seed fixtures: C00001 owns checking A00001/A00002, savings A00003 (opened at
// $18,500 -> min $1,000 / penalty $50) and A00004, debit card D00001 on A00001,
// credit card D00003, and loan L00001. A00005 belongs to C00002/C00003 (joint).
// B00001 is Full Service, B00003 is an ATM.
const ME = 'C00001';
const CHECKING = 'A00001';
const SAVINGS = 'A00003';
const OTHERS_ACCOUNT = 'A00005';
const FULL_SERVICE = 'B00001';
const ATM = 'B00003';

const one = async <T = Record<string, unknown>>(sql: string, params: unknown[] = []) =>
  (await db.query<T>(sql, params)).rows[0];
// Each call gets its own savepoint, like a separate RPC request: a failing
// operation is undone without aborting the surrounding test transaction.
const call = async (fn: string, ...args: unknown[]) => {
  const placeholders = args.map((_, i) => `$${i + 1}`).join(', ');
  await db.exec('savepoint op');
  try {
    const result = (await one<{ r: unknown }>(`select ${fn}(${placeholders}) as r`, args)).r;
    await db.exec('release savepoint op');
    return result;
  } catch (error) {
    await db.exec('rollback to savepoint op');
    throw error;
  }
};
const balance = async (id: string) => num((await one<{ balance: string }>('select balance from account where account_id = $1', [id])).balance);
const count = async (sql: string, params: unknown[] = []) => num((await one<{ n: unknown }>(sql, params)).n);

const t = (name: string, fn: () => Promise<void>) => it(name, () => rollback(db, fn));

describe('deposit', () => {
  t('orig: adds to the balance and records a deposit transaction', async () => {
    const before = await balance(CHECKING);
    const id = (await call('deposit', ME, CHECKING, FULL_SERVICE, 250.25)) as string;
    expect(await balance(CHECKING)).toBeCloseTo(before + 250.25, 2);
    expect(await one('select transaction_type, amount, customer_id, account_id, branch_id from transaction where transaction_id = $1', [id]))
      .toEqual({ transaction_type: 'deposit', amount: '250.25', customer_id: ME, account_id: CHECKING, branch_id: FULL_SERVICE });
  });

  t('orig: only at Full Service branches', async () => {
    await expect(call('deposit', ME, CHECKING, ATM, 10)).rejects.toThrow(/Branch 'B00003' not found/);
  });

  t('orig: only into an account the customer owns', async () => {
    await expect(call('deposit', ME, OTHERS_ACCOUNT, FULL_SERVICE, 10)).rejects.toThrow(/Account 'A00005' not found/);
  });

  t('orig: either owner of a joint account can deposit', async () => {
    await expect(call('deposit', 'C00003', OTHERS_ACCOUNT, FULL_SERVICE, 10)).resolves.toMatch(/^T\d{5}$/);
  });

  t('BUG-06: rejects zero and negative amounts', async () => {
    await expect(call('deposit', ME, CHECKING, FULL_SERVICE, 0)).rejects.toThrow(/greater than zero/);
    await expect(call('deposit', ME, CHECKING, FULL_SERVICE, -5)).rejects.toThrow(/greater than zero/);
  });
});

describe('withdraw - checking', () => {
  t('orig: subtracts and records a withdrawal, at any branch type', async () => {
    const before = await balance(CHECKING);
    const r = (await call('withdraw', ME, CHECKING, ATM, 40)) as { status: string; transaction_id: string };
    expect(r.status).toBe('ok');
    expect(await balance(CHECKING)).toBeCloseTo(before - 40, 2);
    expect(await count(`select count(*) n from transaction where transaction_id = $1 and transaction_type = 'withdrawal' and branch_id = $2`, [r.transaction_id, ATM])).toBe(1);
  });

  t('orig: cannot bring the balance to exactly zero', async () => {
    const all = await balance(CHECKING);
    await expect(call('withdraw', ME, CHECKING, ATM, all)).rejects.toThrow(/below zero/);
    expect(await balance(CHECKING)).toBe(all);
  });

  t('orig: can leave one cent', async () => {
    const all = await balance(CHECKING);
    await call('withdraw', ME, CHECKING, ATM, all - 0.01);
    expect(await balance(CHECKING)).toBeCloseTo(0.01, 2);
  });
});

describe('withdraw - savings', () => {
  const setSavings = (bal: number) => db.query('update account set balance = $1 where account_id = $2', [bal, SAVINGS]);

  t('orig: normal withdrawal above the minimum balance', async () => {
    await setSavings(5000);
    const r = (await call('withdraw', ME, SAVINGS, FULL_SERVICE, 1000)) as { status: string };
    expect(r.status).toBe('ok');
    expect(await balance(SAVINGS)).toBe(4000);
  });

  t('orig: below the minimum asks for penalty confirmation and changes nothing', async () => {
    await setSavings(1200);
    const txBefore = await count('select count(*) n from transaction');
    const r = await call('withdraw', ME, SAVINGS, FULL_SERVICE, 500);
    expect(r).toEqual({ status: 'penalty_required', penalty: 50, minimum_balance: 1000 });
    expect(await balance(SAVINGS)).toBe(1200);
    expect(await count('select count(*) n from transaction')).toBe(txBefore);
  });

  t('BUG-02: accepted penalty charges amount + penalty and records the withdrawal', async () => {
    await setSavings(1200);
    const r = (await call('withdraw', ME, SAVINGS, FULL_SERVICE, 500, true)) as { status: string; transaction_id: string; penalty: number };
    expect(r.status).toBe('ok');
    expect(r.penalty).toBe(50);
    expect(await balance(SAVINGS)).toBe(650); // original would have left 750
    expect((await one<{ amount: string }>('select amount from transaction where transaction_id = $1', [r.transaction_id])).amount).toBe('500.00');
  });

  t('BUG-02: penalty withdrawal may not take the balance below zero', async () => {
    await setSavings(1200);
    await expect(call('withdraw', ME, SAVINGS, FULL_SERVICE, 1180, true)).rejects.toThrow(/penalty your balance would be below zero/);
    expect(await balance(SAVINGS)).toBe(1200);
  });

  t('BUG-02: withdrawing to exactly $0 including the penalty is allowed', async () => {
    await setSavings(1200);
    await call('withdraw', ME, SAVINGS, FULL_SERVICE, 1150, true);
    expect(await balance(SAVINGS)).toBe(0);
  });
});

describe('open_account', () => {
  const tier = async (accountId: string) =>
    one<{ minimum_balance: string; penalty: string }>('select minimum_balance, penalty from savings where account_id = $1', [accountId]);

  for (const [opening, minimum, penalty] of [
    [5000, '1000.00', '50.00'],
    [2000, '1000.00', '50.00'], // BUG-05: original gave 100/25
    [1999.99, '500.00', '50.00'],
    [1000, '500.00', '50.00'], // BUG-05: original gave 100/25
    [999.99, '100.00', '25.00'],
    [50, '100.00', '25.00'],
  ] as const) {
    t(`savings opened with $${opening} gets min ${minimum} / penalty ${penalty}`, async () => {
      const id = (await call('open_account', ME, 'savings', opening)) as string;
      expect(await tier(id)).toEqual({ minimum_balance: minimum, penalty });
    });
  }

  t('orig: savings earns 1.25%, is owned by the customer', async () => {
    const id = (await call('open_account', ME, ' Savings ', 300)) as string;
    expect(await one('select account_type, balance, interest_rate from account where account_id = $1', [id]))
      .toEqual({ account_type: 'savings', balance: '300.00', interest_rate: '1.25' });
    expect(await count('select count(*) n from account_ownership where account_id = $1 and customer_id = $2', [id, ME])).toBe(1);
  });

  t('orig: checking earns 0% and gets a checking row; no transaction is recorded', async () => {
    const txBefore = await count('select count(*) n from transaction');
    const id = (await call('open_account', ME, 'checking', 300)) as string;
    expect(await one('select account_type, interest_rate from account where account_id = $1', [id])).toEqual({ account_type: 'checking', interest_rate: '0.00' });
    expect(await count('select count(*) n from checking where account_id = $1', [id])).toBe(1);
    expect(await count('select count(*) n from transaction')).toBe(txBefore);
  });

  t('orig: rejects other account types', async () => {
    await expect(call('open_account', ME, 'brokerage', 100)).rejects.toThrow(/Invalid account type/);
  });

  t('BUG-06: rejects a zero opening balance', async () => {
    await expect(call('open_account', ME, 'checking', 0)).rejects.toThrow(/greater than zero/);
  });
});

describe('cards', () => {
  t('orig: credit card at 18% with the chosen limit and nothing owed', async () => {
    const id = (await call('open_credit_card', ME, 3000)) as string;
    expect(await one('select k.card_type, k.account_id, c.interest_rate, c."limit", c.running_balance, c.balance_due from card k join credit c using (card_id) where card_id = $1', [id]))
      .toEqual({ card_type: 'credit', account_id: null, interest_rate: '18.00', limit: '3000.00', running_balance: '0.00', balance_due: '0.00' });
  });

  t('orig: card stores the customer name', async () => {
    const id = (await call('open_credit_card', ME, 3000)) as string;
    expect(await count('select count(*) n from card k join customer c using (customer_id) where card_id = $1 and k.customer_name = c.customer_name', [id])).toBe(1);
  });

  t('BUG-06: rejects a zero credit limit', async () => {
    await expect(call('open_credit_card', ME, 0)).rejects.toThrow(/greater than zero/);
  });

  t('orig: debit card linked to an owned checking account', async () => {
    const id = (await call('open_debit_card', ME, CHECKING)) as string;
    expect(await count(`select count(*) n from card join debit using (card_id) where card_id = $1 and card_type = 'debit' and account_id = $2`, [id, CHECKING])).toBe(1);
  });

  t('BUG-08: debit card cannot be linked to a savings account', async () => {
    await expect(call('open_debit_card', ME, SAVINGS)).rejects.toThrow(/valid checking account/);
  });

  t('orig: debit card cannot be linked to someone else\'s account', async () => {
    await expect(call('open_debit_card', ME, OTHERS_ACCOUNT)).rejects.toThrow(/not found/);
  });
});

describe('take_loan', () => {
  for (const [amount, rate, monthly] of [
    [250000, '5.00', '500.00'],
    [100000, '5.00', '500.00'], // BUG-04: original gave 6.00 / 50.00
    [99999.99, '4.00', '400.00'],
    [50000, '4.00', '400.00'], // BUG-04
    [30000, '3.75', '350.00'],
    [25000, '3.75', '350.00'], // BUG-04
    [15000, '5.00', '250.00'],
    [10000, '5.00', '250.00'], // BUG-04
    [5000, '5.00', '100.00'],
    [1000, '5.00', '100.00'], // BUG-04
    [999.99, '6.00', '50.00'],
  ] as const) {
    t(`$${amount} loan is priced at ${rate}% / $${monthly} per month`, async () => {
      const id = (await call('take_loan', ME, 'unsecured', amount)) as string;
      expect(await one('select interest_rate, monthly_payment from loan where loan_id = $1', [id])).toEqual({ interest_rate: rate, monthly_payment: monthly });
    });
  }

  t('orig: loan type is case-insensitive and stored as typed', async () => {
    const id = (await call('take_loan', ME, 'MorTgage', 200000)) as string;
    expect((await one<{ loan_type: string }>('select loan_type from loan where loan_id = $1', [id])).loan_type).toBe('MorTgage');
  });

  t('orig: rejects other loan types', async () => {
    await expect(call('take_loan', ME, 'auto', 5000)).rejects.toThrow(/Invalid loan type/);
  });

  t('BUG-06: rejects a zero loan', async () => {
    await expect(call('take_loan', ME, 'unsecured', 0)).rejects.toThrow(/greater than zero/);
  });
});

describe('pay_loan', () => {
  const loanAmount = async (id: string) => num((await one<{ amount: string }>('select amount from loan where loan_id = $1', [id])).amount);

  t('orig: reduces the loan and the paying account; no transaction recorded', async () => {
    const loan = (await call('take_loan', ME, 'unsecured', 5000)) as string;
    await db.query('update account set balance = 2000 where account_id = $1', [CHECKING]);
    const txBefore = await count('select count(*) n from transaction');
    expect(num(await call('pay_loan', ME, loan, CHECKING, 300))).toBe(4700);
    expect(await loanAmount(loan)).toBe(4700);
    expect(await balance(CHECKING)).toBe(1700);
    expect(await count('select count(*) n from transaction')).toBe(txBefore);
  });

  t('BUG-07: cannot pay more than is owed', async () => {
    const loan = (await call('take_loan', ME, 'unsecured', 500)) as string;
    await expect(call('pay_loan', ME, loan, CHECKING, 500.01)).rejects.toThrow(/larger than the remaining loan/);
  });

  t('BUG-07: can pay the loan off exactly', async () => {
    const loan = (await call('take_loan', ME, 'unsecured', 500)) as string;
    await db.query('update account set balance = 2000 where account_id = $1', [CHECKING]);
    expect(num(await call('pay_loan', ME, loan, CHECKING, 500))).toBe(0);
  });

  t('BUG-07: cannot overdraw the paying account', async () => {
    const loan = (await call('take_loan', ME, 'unsecured', 5000)) as string;
    await db.query('update account set balance = 100 where account_id = $1', [CHECKING]);
    await expect(call('pay_loan', ME, loan, CHECKING, 100)).rejects.toThrow(/below zero/);
    expect(await loanAmount(loan)).toBe(5000);
  });

  t('orig: cannot pay someone else\'s loan', async () => {
    const theirs = (await one<{ loan_id: string }>(`select loan_id from loan where customer_id <> $1 limit 1`, [ME])).loan_id;
    await expect(call('pay_loan', ME, theirs, CHECKING, 10)).rejects.toThrow(/not found/);
  });
});

describe('purchase', () => {
  const credit = async (id: string) => one<{ limit: string; running_balance: string }>('select "limit", running_balance from credit where card_id = $1', [id]);

  t('orig: debit purchase charges the linked account; recorded as a purchase, not a transaction', async () => {
    await db.query('update account set balance = 500 where account_id = $1', [CHECKING]);
    const txBefore = await count('select count(*) n from transaction');
    const id = await call('purchase', ME, 'D00001', 'V00001', 75.5);
    expect(await balance(CHECKING)).toBe(424.5);
    expect(await one('select card_id, vendor_id, amount from purchase where purchase_id = $1', [id]))
      .toEqual({ card_id: 'D00001', vendor_id: 'V00001', amount: '75.50' });
    expect(await count('select count(*) n from transaction')).toBe(txBefore);
  });

  t('orig: debit purchase cannot bring the balance to zero', async () => {
    await db.query('update account set balance = 500 where account_id = $1', [CHECKING]);
    await expect(call('purchase', ME, 'D00001', 'V00001', 500)).rejects.toThrow(/expense is too high/);
  });

  t('orig: credit purchase adds to the running balance, up to the limit exactly', async () => {
    const card = (await call('open_credit_card', ME, 1000)) as string;
    await call('purchase', ME, card, 'V00001', 600);
    await call('purchase', ME, card, 'V00002', 400); // exactly the remaining available credit
    expect(await credit(card)).toEqual({ limit: '1000.00', running_balance: '1000.00' });
    await expect(call('purchase', ME, card, 'V00001', 0.01)).rejects.toThrow(/expense is too high/);
  });

  t('orig: cannot use someone else\'s card', async () => {
    const theirs = (await one<{ card_id: string }>(`select card_id from card where customer_id <> $1 limit 1`, [ME])).card_id;
    await expect(call('purchase', ME, theirs, 'V00001', 5)).rejects.toThrow(/valid card/);
  });

  t('BUG-06: rejects a zero purchase', async () => {
    await expect(call('purchase', ME, 'D00001', 'V00001', 0)).rejects.toThrow(/greater than zero/);
  });
});

describe('atomicity (BUG-09)', () => {
  t('a failed operation leaves no partial writes', async () => {
    const before = await balance(CHECKING);
    const purchasesBefore = await count('select count(*) n from purchase');
    await expect(call('purchase', ME, 'D00001', 'V99999', 10)).rejects.toThrow();
    expect(await balance(CHECKING)).toBe(before);
    expect(await count('select count(*) n from purchase')).toBe(purchasesBefore);
  });
});
