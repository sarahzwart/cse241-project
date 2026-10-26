// Runs every prepared statement from scz225zwart/scz225/Database.java against
// the reconstructed schema. SQL strings are copied verbatim (including the
// original identifier casing); the only translation applied is toPostgres().
// If any of these fail, the new schema has drifted from what the app expects.

import { beforeAll, describe, expect, it } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';
import { createDatabase, num, rollback } from './helpers';

/**
 * The complete set of Oracle -> PostgreSQL translations needed:
 *  1. JDBC `?` placeholders become `$1, $2, ...`
 *  2. the Credit column `limit` (reserved in PostgreSQL) is double-quoted
 */
function toPostgres(sql: string): string {
  let n = 0;
  return sql.replace(/\?/g, () => `$${++n}`).replace(/\blimit\b/g, '"limit"');
}

let db: PGlite;
beforeAll(async () => {
  db = await createDatabase({ seed: true });
});

const run = (sql: string, params: unknown[] = []) => db.query<Record<string, unknown>>(toPostgres(sql), params);

// Seed fixtures (deterministic - see scripts/generate-seed.mjs): C00001 is the
// demo customer, owning checking A00001 with debit card D00001, credit card
// D00003 and mortgage L00001. B00001 is a Full Service branch.
const CUSTOMER = 'C00001';
const CHECKING = 'A00001';
const SAVINGS = 'A00003';
const DEBIT_CARD = 'D00001';
const CREDIT_CARD = 'D00003';
const LOAN = 'L00001';

describe('read queries return the columns the Java code reads', () => {
  const cases: [name: string, sql: string, params: unknown[], columns: string[]][] = [
    ['showDebitInfo', 'SELECT card.customer_name, card.card_id, account.balance FROM account, card WHERE account.account_id = ? AND card.account_id = ? AND card.customer_id = ?', [CHECKING, CHECKING, CUSTOMER], ['customer_name', 'card_id', 'balance']],
    ['selectAllLoanByCustomer', 'SELECT * FROM Loan WHERE customer_id = ?', [CUSTOMER], ['loan_id', 'loan_type', 'amount', 'interest_rate', 'monthly_payment', 'customer_id']],
    ['selectAllAccount', 'SELECT * FROM Account', [], ['account_id', 'account_type', 'balance', 'interest_rate']],
    ['selectAllLoan', 'SELECT * FROM Loan', [], ['loan_id', 'loan_type', 'amount', 'interest_rate', 'monthly_payment', 'customer_id']],
    ['selectAllTransaction', 'SELECT * FROM Transaction', [], ['transaction_id', 'transaction_type', 'transaction_date', 'amount', 'customer_id', 'account_id', 'branch_id']],
    ['selectAllCard', 'SELECT * FROM Card', [], ['card_id', 'card_type', 'account_id', 'customer_id', 'customer_name']],
    ['selectOneVendorId', 'SELECT * FROM Vendor WHERE vendor_name = ?', ['Wegmans'], ['vendor_id']],
    ['selectAllVendor', 'SELECT * FROM Vendor', [], ['vendor_id', 'vendor_name']],
    ['getMinimumBalance', 'SELECT minimum_balance FROM Savings WHERE account_id = ?', [SAVINGS], ['minimum_balance']],
    ['getAccountByCustomer', 'SELECT account_id FROM Account_Ownership where customer_id = ?', [CUSTOMER], ['account_id']],
    ['selectOneAccount', 'SELECT * FROM Account WHERE account_id = ?', [CHECKING], ['account_id', 'account_type', 'balance', 'interest_rate']],
    ['selectAllBranch', 'SELECT * FROM Branch', [], ['branch_id', 'branch_type']],
    ['selectOneBranch', 'SELECT * FROM Branch WHERE branch_id = ?', ['B00001'], ['branch_id', 'branch_type']],
    ['selectAllBranchByType', "SELECT * FROM Branch WHERE branch_type = 'Full Service'", [], ['branch_id', 'branch_type']],
    ['selectOneCard', 'SELECT * FROM Card WHERE card_id = ?', [DEBIT_CARD], ['card_id', 'card_type', 'account_id', 'customer_id', 'customer_name']],
    ['selectAllCardByCustomerId', 'SELECT * FROM Card WHERE customer_id = ?', [CUSTOMER], ['card_id', 'card_type', 'account_id', 'customer_id', 'customer_name']],
    ['selectAllCredit', 'SELECT * FROM Credit', [], ['card_id', 'interest_rate', 'limit', 'running_balance', 'balance_due']],
    ['selectOneCredit', 'SELECT * FROM Credit WHERE card_id = ?', [CREDIT_CARD], ['card_id', 'interest_rate', 'limit', 'running_balance', 'balance_due']],
    ['selectAllCustomer', 'SELECT * FROM Customer', [], ['customer_id', 'customer_name', 'birthday', 'address']],
    ['selectOneCustomer', 'SELECT * FROM Customer WHERE customer_id = ?', [CUSTOMER], ['customer_id', 'customer_name', 'birthday', 'address']],
    ['selectOneLoan', 'SELECT * FROM Loan WHERE loan_id = ?', [LOAN], ['loan_id', 'loan_type', 'amount', 'interest_rate', 'monthly_payment', 'customer_id']],
    ['selectAllSavings', 'SELECT * FROM Savings', [], ['account_id', 'minimum_balance', 'penalty']],
    ['selectOneSavings', 'SELECT * FROM Savings WHERE account_id = ?', [SAVINGS], ['account_id', 'minimum_balance', 'penalty']],
    ['selectOneTransaction', 'SELECT * FROM Transaction where transaction_id = ?', ['T00001'], ['transaction_id', 'transaction_type', 'transaction_date', 'amount', 'customer_id', 'account_id', 'branch_id']],
    ['selectAllTransactionByCustomer', 'SELECT * FROM Transaction where customer_id = ?', [CUSTOMER], ['transaction_id', 'transaction_type', 'transaction_date', 'amount', 'customer_id', 'account_id', 'branch_id']],
  ];

  it.each(cases)('%s', async (_name, sql, params, columns) => {
    const result = await run(sql, params);
    expect(result.rows.length).toBeGreaterThan(0);
    const returned = result.fields.map((f) => f.name);
    for (const col of columns) expect(returned).toContain(col);
  });

  it('selectOneCustomerByName finds the customer used to log in', async () => {
    const { rows: [demo] } = await run('SELECT * FROM Customer WHERE customer_id = ?', [CUSTOMER]);
    const { rows } = await run('SELECT * FROM Customer WHERE customer_name = ?', [demo.customer_name]);
    expect(rows.map((r) => r.customer_id)).toEqual([CUSTOMER]);
  });
});

describe('balance updates', () => {
  const balanceOf = async (id: string) => num((await run('SELECT * FROM Account WHERE account_id = ?', [id])).rows[0].balance);

  it('addToAccountAmount adds to the balance', () => rollback(db, async () => {
    const before = await balanceOf(CHECKING);
    await run('UPDATE Account SET balance = balance + ? WHERE account_id = ?', [125.5, CHECKING]);
    expect(await balanceOf(CHECKING)).toBeCloseTo(before + 125.5, 2);
  }));

  it('subtractFromAccountAmount subtracts from the balance', () => rollback(db, async () => {
    const before = await balanceOf(CHECKING);
    await run('UPDATE Account SET balance = balance - ? WHERE account_id = ?', [40, CHECKING]);
    expect(await balanceOf(CHECKING)).toBeCloseTo(before - 40, 2);
  }));

  it('addToCreditBalance increases the running balance', () => rollback(db, async () => {
    const get = async () => num((await run('SELECT * FROM Credit WHERE card_id = ?', [CREDIT_CARD])).rows[0].running_balance);
    const before = await get();
    await run('UPDATE Credit SET running_balance = running_balance + ? WHERE card_id = ?', [19.99, CREDIT_CARD]);
    expect(await get()).toBeCloseTo(before + 19.99, 2);
  }));

  it('subtractFromLoan reduces the outstanding amount', () => rollback(db, async () => {
    const get = async () => num((await run('SELECT * FROM Loan WHERE loan_id = ?', [LOAN])).rows[0].amount);
    const before = await get();
    await run('UPDATE Loan SET amount = amount - ? WHERE loan_id = ?', [500, LOAN]);
    expect(await get()).toBeCloseTo(before - 500, 2);
  }));
});

describe('inserts (generated keys via RETURNING, as getGeneratedKeys did in Oracle)', () => {
  it('creates a savings account the way accountAction() does', () => rollback(db, async () => {
    const { rows: [{ account_id }] } = await run(
      'INSERT INTO Account(account_type, balance, interest_rate) VALUES (?, ?, ?) RETURNING account_id', ['savings', 2500, 1.25]);
    expect(account_id).toMatch(/^A\d{5}$/);
    await run('INSERT INTO Savings VALUES (?, ?, ?)', [account_id, 1000, 50]);
    await run('INSERT INTO Account_Ownership (account_id, customer_id) VALUES (?, ?)', [account_id, CUSTOMER]);
    const { rows } = await run('SELECT minimum_balance FROM Savings WHERE account_id = ?', [account_id]);
    expect(num(rows[0].minimum_balance)).toBe(1000);
  }));

  it('creates a checking account the way accountAction() does', () => rollback(db, async () => {
    const { rows: [{ account_id }] } = await run(
      'INSERT INTO Account(account_type, balance, interest_rate) VALUES (?, ?, ?) RETURNING account_id', ['checking', 300, 0]);
    await run('INSERT INTO Checking VALUES (?)', [account_id]);
    const { rows } = await run('SELECT * FROM Checking WHERE account_id = ?', [account_id]);
    expect(rows).toHaveLength(1);
  }));

  it('creates a credit card the way insertNewCreditCard() does', () => rollback(db, async () => {
    const { rows: [{ card_id }] } = await run(
      "INSERT INTO Card(card_type, customer_id, customer_name) VALUES ('credit', ?, ?) RETURNING card_id", [CUSTOMER, 'Test Name']);
    await run('INSERT INTO Credit(card_id, interest_rate, limit, running_balance, balance_due) VALUES (?, 18.0, ?, 0, 0)', [card_id, 5000]);
    const { rows } = await run('SELECT * FROM Credit WHERE card_id = ?', [card_id]);
    expect(rows[0]).toMatchObject({ interest_rate: '18.00', limit: '5000.00', running_balance: '0.00', balance_due: '0.00' });
  }));

  it('creates a debit card the way insertNewDebitCard() does', () => rollback(db, async () => {
    const { rows: [{ card_id }] } = await run(
      "INSERT INTO Card(card_type, account_id, customer_id, customer_name) VALUES ('debit', ?, ?, ?) RETURNING card_id", [CHECKING, CUSTOMER, 'Test Name']);
    await run('INSERT INTO Debit(card_id) VALUES (?)', [card_id]);
    const { rows } = await run('SELECT * FROM Card WHERE card_id = ?', [card_id]);
    expect(rows[0]).toMatchObject({ card_type: 'debit', account_id: CHECKING });
  }));

  it('insertLoan stores the loan', () => rollback(db, async () => {
    const { rows: [{ loan_id }] } = await run(
      'INSERT INTO Loan (loan_type, amount, interest_rate, monthly_payment, customer_id) VALUES (?, ?, ?, ?, ?) RETURNING loan_id',
      ['Mortgage', 150000, 5, 500, CUSTOMER]);
    expect(loan_id).toMatch(/^L\d{5}$/);
  }));

  it('insertTransaction stores a timestamped transaction', () => rollback(db, async () => {
    const { rows: [{ transaction_id }] } = await run(
      'INSERT INTO Transaction (transaction_type, transaction_date, amount, customer_id, account_id, branch_id) VALUES (?,?,?,?,?,?) RETURNING transaction_id',
      ['deposit', '2026-10-25 10:30:00', 200, CUSTOMER, CHECKING, 'B00001']);
    expect(transaction_id).toMatch(/^T\d{5}$/);
  }));

  it('insertPurchase stores a purchase with a generated integer id', () => rollback(db, async () => {
    await run('INSERT INTO Purchase (card_id, vendor_id, amount, purchase_date) VALUES (?, ?, ?, ?)',
      [DEBIT_CARD, 'V00001', 54.12, '2026-10-25 12:00:00']);
    const { rows } = await db.query<{ purchase_id: number }>('select max(purchase_id) as purchase_id from purchase');
    expect(Number.isInteger(rows[0].purchase_id)).toBe(true);
  }));

  it('insertCustomer stores a customer', () => rollback(db, async () => {
    const { rows } = await run(
      'INSERT INTO Customer (customer_name, birthday, address) VALUES (?, ?, ?) RETURNING customer_id',
      ['New Person', '1990-01-01', '1 Main St, Bethlehem, PA 18015']);
    expect(rows[0].customer_id).toMatch(/^C\d{5}$/);
  }));
});

describe('documented incompatibilities and existing bugs (characterisation)', () => {
  it('the original Credit insert needs "limit" quoted in PostgreSQL (reserved word)', async () => {
    const original = 'INSERT INTO Credit(card_id, interest_rate, limit, running_balance, balance_due) VALUES ($1, 18.0, $2, 0, 0)';
    await expect(db.query(original, ['D99999', 100])).rejects.toThrow(/syntax error/);
  });

  it('BUG-01: showPastPurchasesByCardId queries "Purchases" but the table is "Purchase"', async () => {
    // Fails in the original Oracle database too. The method is never called by App.java.
    await expect(run('SELECT * FROM Purchases WHERE card_id = ?', [DEBIT_CARD])).rejects.toThrow(/relation "purchases" does not exist/);
  });
});
