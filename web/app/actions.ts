'use server';

import { redirect } from 'next/navigation';
import { callOperation, getCustomer } from '@/lib/bank';
import { clearCustomerId, getCustomerId, lockGate, requireGate, setCustomerId, unlockGate } from '@/lib/session';

// Each action re-checks the session, parses the form, and hands the operation
// to its Postgres function. Business rules live only in the database; the
// result (or the rule's error message) is shown on the page it came from.

type Params = Record<string, string | number>;

function go(path: string, params: Params = {}): never {
  const query = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString();
  redirect(query ? `${path}?${query}` : path);
}

const field = (form: FormData, name: string) => String(form.get(name) ?? '').trim();

// Double.parseDouble equivalent: anything that isn't a number is rejected here,
// as in the original; sign and range rules are enforced by the database.
function parseAmount(form: FormData, name = 'amount'): number | null {
  const raw = field(form, name);
  const value = Number(raw);
  return raw !== '' && Number.isFinite(value) ? value : null;
}

async function requireCustomer(): Promise<string> {
  await requireGate();
  const customerId = await getCustomerId();
  if (!customerId) redirect('/');
  return customerId;
}

/** Runs an operation, then returns to `path` with ?ok=<message> or ?error=<reason>. */
async function perform(path: string, operation: () => Promise<string>): Promise<never> {
  let message: string;
  try {
    message = await operation();
  } catch (error) {
    go(path, { error: error instanceof Error ? error.message : 'Something went wrong.' });
  }
  go(path, { ok: message });
}

const usd = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

// ---------------------------------------------------------------------------
// Admin password gate
// ---------------------------------------------------------------------------

export async function unlock(form: FormData) {
  // Only return to a path on this site (no open redirect).
  const next = field(form, 'next');
  const destination = next.startsWith('/') && !next.startsWith('//') ? next : '/';
  if (!(await unlockGate(String(form.get('password') ?? '')))) {
    go('/login', { error: 'Password is incorrect, please try again.', ...(next ? { next } : {}) });
  }
  redirect(destination);
}

export async function lock() {
  await lockGate();
  redirect('/login');
}

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

export async function login(form: FormData) {
  await requireGate();
  const customer = await getCustomer(field(form, 'customer'));
  if (!customer) go('/', { error: 'Please choose a customer.' });
  await setCustomerId(customer.customer_id);
  redirect('/customer');
}

export async function logout() {
  await requireGate();
  await clearCustomerId();
  redirect('/');
}

// ---------------------------------------------------------------------------
// Deposit / withdrawal
// ---------------------------------------------------------------------------

export async function deposit(form: FormData) {
  const customerId = await requireCustomer();
  const amount = parseAmount(form);
  if (amount === null) go('/customer/banking', { error: 'Invalid balance amount. Please enter a valid number.' });
  await perform('/customer/banking', async () => {
    await callOperation<string>('deposit', {
      p_customer_id: customerId, p_account_id: field(form, 'account'), p_branch_id: field(form, 'branch'), p_amount: amount,
    });
    return 'Deposit made successfully!';
  });
}

type WithdrawResult = { status: 'ok' | 'penalty_required'; penalty: number; minimum_balance?: number };

export async function withdraw(form: FormData) {
  const customerId = await requireCustomer();
  const amount = parseAmount(form);
  if (amount === null) go('/customer/banking', { error: 'Invalid balance amount. Please enter a valid number.' });
  const request = { account: field(form, 'account'), branch: field(form, 'branch'), amount };

  let result: WithdrawResult;
  try {
    result = await callOperation<WithdrawResult>('withdraw', {
      p_customer_id: customerId, p_account_id: request.account, p_branch_id: request.branch, p_amount: amount,
      p_accept_penalty: field(form, 'accept_penalty') === 'yes',
    });
  } catch (error) {
    go('/customer/banking', { error: error instanceof Error ? error.message : 'Something went wrong.' });
  }

  // Savings withdrawal below the minimum balance: ask for confirmation, as the
  // original's "There will be a penalty. YES or NO" prompt did.
  if (result.status === 'penalty_required') {
    go('/customer/banking', { confirm: 1, ...request, penalty: result.penalty, minimum: result.minimum_balance ?? 0 });
  }
  go('/customer/banking', {
    ok: result.penalty > 0
      ? `Withdrawal made successfully! Penalty of ${usd(result.penalty)} applied to account.`
      : 'Withdrawal made successfully!',
  });
}

// ---------------------------------------------------------------------------
// Accounts, cards, loans, purchases
// ---------------------------------------------------------------------------

export async function openAccount(form: FormData) {
  const customerId = await requireCustomer();
  const balance = parseAmount(form, 'balance');
  if (balance === null) go('/customer', { error: 'Invalid balance amount. Please enter a valid number.' });
  await perform('/customer', async () => {
    const accountId = await callOperation<string>('open_account', {
      p_customer_id: customerId, p_account_type: field(form, 'type'), p_balance: balance,
    });
    return `Account successfully created with ID: ${accountId}`;
  });
}

export async function openCreditCard(form: FormData) {
  const customerId = await requireCustomer();
  const limit = parseAmount(form, 'limit');
  if (limit === null) go('/customer/cards', { error: 'Invalid amount. Please enter a valid number.' });
  await perform('/customer/cards', async () => {
    const cardId = await callOperation<string>('open_credit_card', { p_customer_id: customerId, p_limit: limit });
    return `Credit card ${cardId} opened.`;
  });
}

export async function openDebitCard(form: FormData) {
  const customerId = await requireCustomer();
  await perform('/customer/cards', async () => {
    const cardId = await callOperation<string>('open_debit_card', { p_customer_id: customerId, p_account_id: field(form, 'account') });
    return `Debit card ${cardId} opened.`;
  });
}

export async function takeLoan(form: FormData) {
  const customerId = await requireCustomer();
  const amount = parseAmount(form);
  if (amount === null) go('/customer/loans', { error: 'Invalid amount. Please enter a valid number.' });
  await perform('/customer/loans', async () => {
    const loanId = await callOperation<string>('take_loan', {
      p_customer_id: customerId, p_loan_type: field(form, 'type'), p_amount: amount,
    });
    return `Loan ${loanId} approved.`;
  });
}

export async function payLoan(form: FormData) {
  const customerId = await requireCustomer();
  const amount = parseAmount(form);
  if (amount === null) go('/customer/loans', { error: 'Invalid amount. Please enter a valid number.' });
  await perform('/customer/loans', async () => {
    const remaining = await callOperation<number>('pay_loan', {
      p_customer_id: customerId, p_loan_id: field(form, 'loan'), p_account_id: field(form, 'account'), p_amount: amount,
    });
    return `Loan payment successful. Remaining balance: ${usd(remaining)}`;
  });
}

export async function makePurchase(form: FormData) {
  const customerId = await requireCustomer();
  const amount = parseAmount(form);
  if (amount === null) go('/customer/purchases', { error: 'Invalid amount. Please enter a valid number.' });
  await perform('/customer/purchases', async () => {
    await callOperation<number>('purchase', {
      p_customer_id: customerId, p_card_id: field(form, 'card'), p_vendor_id: field(form, 'vendor'), p_amount: amount,
    });
    return 'Purchase made successfully!';
  });
}
