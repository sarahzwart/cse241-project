import { Suspense } from 'react';
import { getAccounts, getCurrentCustomer, getRecentTransactions, listBranches } from '@/lib/bank';
import { openAccount } from '../actions';
import { Flash, Loading, Table, usd, when } from '../ui';
import { AccountsTable } from './parts';

// Account Menu: [V] View my Account(s), [C] Create new Account (App.java:602-667)
export default function AccountsPage(props: PageProps<'/customer'>) {
  return (
    <>
      <h1>Accounts</h1>
      <Suspense fallback={null}>
        <Flash searchParams={props.searchParams} />
      </Suspense>
      <Suspense fallback={<Loading />}>
        <Accounts />
      </Suspense>

      <h2>Open a new account</h2>
      <form action={openAccount} className="card">
        <label>
          Account type
          <select name="type" required>
            <option value="checking">Checking (0.00%)</option>
            <option value="savings">Savings (1.25%)</option>
          </select>
        </label>
        <label>
          Opening balance
          <input name="balance" type="number" step="0.01" min="0.01" required />
        </label>
        <p className="muted">
          Savings minimums are set by the opening balance: $2,000+ → $1,000 min / $50 penalty;
          $1,000+ → $500 / $50; otherwise $100 / $25.
        </p>
        <button type="submit">Open account</button>
      </form>
    </>
  );
}

async function Accounts() {
  const customer = await getCurrentCustomer();
  const [accounts, transactions, branches] = await Promise.all([
    getAccounts(customer.customer_id),
    getRecentTransactions(customer.customer_id),
    listBranches(),
  ]);
  const branchName = (id: string) => branches.find((b) => b.branch_id === id)?.branch_name ?? id;

  return (
    <>
      <AccountsTable accounts={accounts} />
      <h2>Recent transactions</h2>
      <Table
        rows={transactions}
        empty="No transactions yet."
        columns={[
          { label: 'Date', render: (t) => when(t.transaction_date) },
          { label: 'Type', render: (t) => t.transaction_type },
          { label: 'Account', render: (t) => t.account_id },
          { label: 'Branch', render: (t) => branchName(t.branch_id) },
          { label: 'Amount', render: (t) => usd(t.amount), numeric: true },
        ]}
      />
    </>
  );
}
