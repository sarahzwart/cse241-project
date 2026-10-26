import 'server-only';
import { redirect } from 'next/navigation';
import { supabase } from './supabase';
import { getCustomerId, requireGate } from './session';

// Data access layer. Reads mirror the original Database.java queries; every
// write goes through a Postgres function (see callOperation), which is the
// authoritative implementation of the business rules.

export type Customer = { customer_id: string; customer_name: string; birthday: string; address: string };
export type Account = {
  account_id: string; account_type: string; balance: number; interest_rate: number;
  minimum_balance?: number; penalty?: number;
};
export type Branch = { branch_id: string; branch_type: string; branch_name: string | null; address: string | null };
export type Vendor = { vendor_id: string; vendor_name: string };
export type Card = { card_id: string; card_type: string; account_id: string | null; customer_id: string; customer_name: string };
export type DebitCard = Card & { balance: number };
export type CreditCard = Card & { interest_rate: number; limit: number; running_balance: number; balance_due: number };
export type Loan = { loan_id: string; loan_type: string; amount: number; interest_rate: number; monthly_payment: number; customer_id: string };
export type Transaction = {
  transaction_id: string; transaction_type: string; transaction_date: string; amount: number;
  customer_id: string; account_id: string; branch_id: string;
};
export type Purchase = { purchase_id: number; card_id: string; amount: number; purchase_date: string; vendor: { vendor_name: string } | null };

function check<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return data as T;
}

// Every database access goes through here, so nothing is read or written
// before the admin password has been entered.
async function db() {
  await requireGate();
  return supabase;
}

// PostgREST returns at most 1,000 rows per request; page through the rest.
async function selectAll<T>(table: string, orderBy: string, ascending = true): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += 1000) {
    const page = check(await (await db()).from(table).select('*').order(orderBy, { ascending }).range(from, from + 999)) as T[];
    rows.push(...page);
    if (page.length < 1000) return rows;
  }
}

// ---------------------------------------------------------------------------
// Current customer
// ---------------------------------------------------------------------------

/** The logged-in demo customer, or a redirect to the login page. */
export async function getCurrentCustomer(): Promise<Customer> {
  const customerId = await getCustomerId();
  if (!customerId) redirect('/');
  const customer = await getCustomer(customerId);
  if (!customer) redirect('/');
  return customer;
}

export async function getCustomer(customerId: string): Promise<Customer | null> {
  return check(await (await db()).from('customer').select('*').eq('customer_id', customerId).maybeSingle());
}

// selectAllCustomer, used for the login list (App.java:904-924)
export async function listCustomers(): Promise<Customer[]> {
  return check(await (await db()).from('customer').select('*').order('customer_id'));
}

// ---------------------------------------------------------------------------
// Customer-scoped reads
// ---------------------------------------------------------------------------

// getAccountByCustomer (Database.java:648), plus savings terms for display.
export async function getAccounts(customerId: string): Promise<Account[]> {
  const owned = check(await (await db()).from('account_ownership').select('account_id').eq('customer_id', customerId));
  const ids = owned.map((o) => o.account_id);
  if (ids.length === 0) return [];
  const [accounts, savings] = await Promise.all([
    (await db()).from('account').select('*').in('account_id', ids).order('account_id').then(check),
    (await db()).from('savings').select('*').in('account_id', ids).then(check),
  ]);
  return (accounts as Account[]).map((a) => {
    const s = savings.find((row) => row.account_id === a.account_id);
    return s ? { ...a, minimum_balance: s.minimum_balance, penalty: s.penalty } : a;
  });
}

// showCardInformation (App.java:846-875): debit cards with their account's
// balance (showDebitInfo), credit cards with their Credit row.
export async function getCards(customerId: string): Promise<{ debit: DebitCard[]; credit: CreditCard[] }> {
  const cards = check(await (await db()).from('card').select('*').eq('customer_id', customerId).order('card_id')) as Card[];
  const debitCards = cards.filter((c) => c.card_type.toLowerCase() === 'debit');
  const creditCards = cards.filter((c) => c.card_type.toLowerCase() === 'credit');
  const [accounts, credits] = await Promise.all([
    (await db()).from('account').select('account_id, balance').in('account_id', debitCards.map((c) => c.account_id!)).then(check),
    (await db()).from('credit').select('*').in('card_id', creditCards.map((c) => c.card_id)).then(check),
  ]);
  return {
    debit: debitCards.map((c) => ({ ...c, balance: accounts.find((a) => a.account_id === c.account_id)?.balance ?? 0 })),
    credit: creditCards.flatMap((c) => {
      const credit = credits.find((r) => r.card_id === c.card_id);
      return credit ? [{ ...c, ...credit }] : [];
    }),
  };
}

// selectAllLoanByCustomer (Database.java:342)
export async function getLoans(customerId: string): Promise<Loan[]> {
  return check(await (await db()).from('loan').select('*').eq('customer_id', customerId).order('loan_id'));
}

// selectAllTransactionByCustomer (Database.java:250), most recent first.
export async function getRecentTransactions(customerId: string, limit = 10): Promise<Transaction[]> {
  return check(await (await db()).from('transaction').select('*').eq('customer_id', customerId)
    .order('transaction_date', { ascending: false }).limit(limit));
}

// Purchase history across the customer's cards (enabled by the BUG-01 fix).
export async function getRecentPurchases(customerId: string, limit = 10): Promise<Purchase[]> {
  const cards = check(await (await db()).from('card').select('card_id').eq('customer_id', customerId));
  if (cards.length === 0) return [];
  return check(await (await db()).from('purchase').select('purchase_id, card_id, amount, purchase_date, vendor(vendor_name)')
    .in('card_id', cards.map((c) => c.card_id)).order('purchase_date', { ascending: false }).limit(limit)) as unknown as Purchase[];
}

// ---------------------------------------------------------------------------
// Reference data
// ---------------------------------------------------------------------------

// selectAllBranch / selectAllBranchByType (deposits are Full Service only)
export async function listBranches({ fullServiceOnly = false } = {}): Promise<Branch[]> {
  let query = (await db()).from('branch').select('*').order('branch_id');
  if (fullServiceOnly) query = query.eq('branch_type', 'Full Service');
  return check(await query);
}

export async function listVendors(): Promise<Vendor[]> {
  return check(await (await db()).from('vendor').select('*').order('vendor_name'));
}

// ---------------------------------------------------------------------------
// Employee views (App.java:418-450) - SELECT * FROM <table>
// ---------------------------------------------------------------------------

export const EMPLOYEE_VIEWS = {
  customers: { title: 'Customers', table: 'customer', orderBy: 'customer_id' },
  cards: { title: 'Cards', table: 'card', orderBy: 'card_id' },
  accounts: { title: 'Accounts', table: 'account', orderBy: 'account_id' },
  transactions: { title: 'Transactions', table: 'transaction', orderBy: 'transaction_id' },
  loans: { title: 'Loans', table: 'loan', orderBy: 'loan_id' },
} as const;
export type EmployeeView = keyof typeof EMPLOYEE_VIEWS;

export async function listForEmployee(view: EmployeeView): Promise<Record<string, unknown>[]> {
  const { table, orderBy } = EMPLOYEE_VIEWS[view];
  return selectAll(table, orderBy);
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

/** Runs a business operation (Postgres function). Throws with the rule's message on rejection. */
export async function callOperation<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await (await db()).rpc(fn, args);
  if (error) throw new Error(error.message);
  return data as T;
}
