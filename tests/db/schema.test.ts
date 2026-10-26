// Verifies the reconstructed schema exposes every table and column the
// original Java app reads (via ResultSet.getX calls in Database.java and
// App.java), with the relationships implied by its queries.

import { beforeAll, describe, expect, it } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';
import { createDatabase, rollback } from './helpers';

let db: PGlite;
beforeAll(async () => {
  db = await createDatabase();
});

// Columns read by the Java Row classes, in the order positional INSERTs need.
const EXPECTED_COLUMNS: Record<string, string[]> = {
  customer: ['customer_id', 'customer_name', 'birthday', 'address'],
  branch: ['branch_id', 'branch_type'],
  account: ['account_id', 'account_type', 'balance', 'interest_rate'],
  checking: ['account_id'],
  savings: ['account_id', 'minimum_balance', 'penalty'],
  account_ownership: ['account_id', 'customer_id'],
  card: ['card_id', 'card_type', 'account_id', 'customer_id', 'customer_name'],
  credit: ['card_id', 'interest_rate', 'limit', 'running_balance', 'balance_due'],
  debit: ['card_id'],
  vendor: ['vendor_id', 'vendor_name'],
  purchase: ['purchase_id', 'card_id', 'vendor_id', 'amount', 'purchase_date'],
  loan: ['loan_id', 'loan_type', 'amount', 'interest_rate', 'monthly_payment', 'customer_id'],
  transaction: ['transaction_id', 'transaction_type', 'transaction_date', 'amount', 'customer_id', 'account_id', 'branch_id'],
};

describe('tables and columns', () => {
  it('has exactly the 13 tables used by the original app', async () => {
    const { rows } = await db.query<{ table_name: string }>(
      `select table_name from information_schema.tables where table_schema = 'public' order by table_name`,
    );
    expect(rows.map((r) => r.table_name)).toEqual(Object.keys(EXPECTED_COLUMNS).sort());
  });

  it.each(Object.entries(EXPECTED_COLUMNS))('%s has the expected columns in order', async (table, columns) => {
    const { rows } = await db.query<{ column_name: string }>(
      `select column_name from information_schema.columns
       where table_schema = 'public' and table_name = $1 order by ordinal_position`,
      [table],
    );
    expect(rows.map((r) => r.column_name)).toEqual(columns);
  });
});

describe('relationships', () => {
  const FOREIGN_KEYS = [
    'checking.account_id -> account.account_id',
    'savings.account_id -> account.account_id',
    'account_ownership.account_id -> account.account_id',
    'account_ownership.customer_id -> customer.customer_id',
    'card.account_id -> account.account_id',
    'card.customer_id -> customer.customer_id',
    'credit.card_id -> card.card_id',
    'debit.card_id -> card.card_id',
    'purchase.card_id -> card.card_id',
    'purchase.vendor_id -> vendor.vendor_id',
    'loan.customer_id -> customer.customer_id',
    'transaction.customer_id -> customer.customer_id',
    'transaction.account_id -> account.account_id',
    'transaction.branch_id -> branch.branch_id',
  ];

  it('defines the foreign keys implied by the original queries', async () => {
    const { rows } = await db.query<{ fk: string }>(`
      select kcu.table_name || '.' || kcu.column_name || ' -> ' || ccu.table_name || '.' || ccu.column_name as fk
      from information_schema.table_constraints tc
      join information_schema.key_column_usage kcu on tc.constraint_name = kcu.constraint_name
      join information_schema.constraint_column_usage ccu on tc.constraint_name = ccu.constraint_name
      where tc.constraint_type = 'FOREIGN KEY' and tc.table_schema = 'public'`);
    expect(rows.map((r) => r.fk).sort()).toEqual([...FOREIGN_KEYS].sort());
  });

  it('rejects a transaction for an account that does not exist', async () => {
    await rollback(db, async () => {
      await db.exec(`insert into customer (customer_id, customer_name) values ('C99999', 'Test')`);
      await expect(
        db.query(`insert into transaction (transaction_type, amount, customer_id, account_id) values ('deposit', 1, 'C99999', 'A99999')`),
      ).rejects.toThrow(/foreign key/);
    });
  });

  it('allows credit cards with no account (account_id is nullable)', async () => {
    await rollback(db, async () => {
      await db.exec(`insert into customer (customer_id, customer_name) values ('C99999', 'Test')`);
      const { rows } = await db.query<{ card_id: string }>(
        `insert into card (card_type, customer_id, customer_name) values ('credit', 'C99999', 'Test') returning card_id`,
      );
      expect(rows[0].card_id).toMatch(/^D\d{5}$/);
    });
  });
});

describe('generated IDs', () => {
  it.each([
    ['customer', `insert into customer (customer_name) values ('X') returning customer_id as id`, /^C\d{5}$/],
    ['account', `insert into account (account_type, balance, interest_rate) values ('checking', 1, 0) returning account_id as id`, /^A\d{5}$/],
    ['branch', `insert into branch (branch_type) values ('ATM') returning branch_id as id`, /^B\d{5}$/],
    ['vendor', `insert into vendor (vendor_name) values ('X') returning vendor_id as id`, /^V\d{5}$/],
  ])('%s IDs are generated by the database', async (_name, sql, pattern) => {
    await rollback(db, async () => {
      const { rows } = await db.query<{ id: string }>(sql);
      expect(rows[0].id).toMatch(pattern);
    });
  });
});

describe('row level security', () => {
  it('is enabled on every table (deny-by-default until policies are approved)', async () => {
    const { rows } = await db.query<{ relname: string; relrowsecurity: boolean }>(`
      select c.relname, c.relrowsecurity from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r'`);
    expect(rows).toHaveLength(13);
    expect(rows.filter((r) => !r.relrowsecurity).map((r) => r.relname)).toEqual([]);
  });
});
