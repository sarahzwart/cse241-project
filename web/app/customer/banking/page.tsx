import Link from 'next/link';
import { Suspense } from 'react';
import { getAccounts, getCurrentCustomer, listBranches, type Branch } from '@/lib/bank';
import { deposit, withdraw } from '../../actions';
import { Flash, Loading, param, usd } from '../../ui';
import { AccountsTable } from '../parts';

// Make a Deposit or Withdrawal: [V] View, [D] Deposit, [W] Withdraw (App.java:395-598)
export default function BankingPage(props: PageProps<'/customer/banking'>) {
  return (
    <>
      <h1>Deposit / Withdraw</h1>
      <Suspense fallback={null}>
        <Flash searchParams={props.searchParams} />
      </Suspense>
      <Suspense fallback={<Loading />}>
        <Banking searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

const branchLabel = (b: Branch) => `${b.branch_name ?? b.branch_id} (${b.branch_type})`;

async function Banking({ searchParams }: { searchParams: PageProps<'/customer/banking'>['searchParams'] }) {
  const query = await searchParams;
  const customer = await getCurrentCustomer();
  const [accounts, branches] = await Promise.all([getAccounts(customer.customer_id), listBranches()]);
  const fullService = branches.filter((b) => b.branch_type === 'Full Service');

  // Savings withdrawal below the minimum balance needs confirmation first.
  if (param(query.confirm)) {
    const penalty = Number(param(query.penalty));
    return (
      <form action={withdraw} className="card">
        <h2>Are you sure?</h2>
        <p>
          Withdrawing {usd(Number(param(query.amount)))} will take account {param(query.account)} below its
          minimum balance of {usd(Number(param(query.minimum)))}. There will be a penalty of {usd(penalty)}.
        </p>
        <input type="hidden" name="account" value={param(query.account)} />
        <input type="hidden" name="branch" value={param(query.branch)} />
        <input type="hidden" name="amount" value={param(query.amount)} />
        <input type="hidden" name="accept_penalty" value="yes" />
        <button type="submit">Yes, withdraw and pay the penalty</button>
        <Link href="/customer/banking">No, go back</Link>
      </form>
    );
  }

  return (
    <>
      <AccountsTable accounts={accounts} />
      <div className="forms">
        <form action={deposit} className="card">
          <h2>Make a deposit</h2>
          <label>
            Branch (Full Service only)
            <select name="branch" required>
              {fullService.map((b) => <option key={b.branch_id} value={b.branch_id}>{branchLabel(b)}</option>)}
            </select>
          </label>
          <AccountSelect accounts={accounts} />
          <label>
            Amount
            <input name="amount" type="number" step="0.01" min="0.01" required />
          </label>
          <button type="submit">Deposit</button>
        </form>

        <form action={withdraw} className="card">
          <h2>Make a withdrawal</h2>
          <label>
            Branch
            <select name="branch" required>
              {branches.map((b) => <option key={b.branch_id} value={b.branch_id}>{branchLabel(b)}</option>)}
            </select>
          </label>
          <AccountSelect accounts={accounts} />
          <label>
            Amount
            <input name="amount" type="number" step="0.01" min="0.01" required />
          </label>
          <button type="submit">Withdraw</button>
        </form>
      </div>
    </>
  );
}

function AccountSelect({ accounts }: { accounts: { account_id: string; account_type: string; balance: number }[] }) {
  return (
    <label>
      Account
      <select name="account" required>
        {accounts.map((a) => (
          <option key={a.account_id} value={a.account_id}>{a.account_id} · {a.account_type} · {usd(a.balance)}</option>
        ))}
      </select>
    </label>
  );
}
