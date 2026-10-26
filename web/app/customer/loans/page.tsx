import { Suspense } from 'react';
import { getAccounts, getCurrentCustomer, getLoans } from '@/lib/bank';
import { payLoan, takeLoan } from '../../actions';
import { Flash, Loading, Table, rate, usd } from '../../ui';

// Loan Menu: [V] View, [T] Take out, [P] Pay (App.java:254-393)
export default function LoansPage(props: PageProps<'/customer/loans'>) {
  return (
    <>
      <h1>Loans</h1>
      <Suspense fallback={null}>
        <Flash searchParams={props.searchParams} />
      </Suspense>
      <Suspense fallback={<Loading />}>
        <Loans />
      </Suspense>
    </>
  );
}

async function Loans() {
  const customer = await getCurrentCustomer();
  const [loans, accounts] = await Promise.all([getLoans(customer.customer_id), getAccounts(customer.customer_id)]);

  return (
    <>
      <Table
        rows={loans}
        empty="You do not have any loans out."
        columns={[
          { label: 'Loan ID', render: (l) => l.loan_id },
          { label: 'Type', render: (l) => l.loan_type },
          { label: 'Remaining', render: (l) => usd(l.amount), numeric: true },
          { label: 'Interest', render: (l) => rate(l.interest_rate), numeric: true },
          { label: 'Monthly payment', render: (l) => usd(l.monthly_payment), numeric: true },
        ]}
      />

      <div className="forms">
        <form action={takeLoan} className="card">
          <h2>Take out a loan</h2>
          <p className="muted">Mortgages are secured by your home address automatically. Unsecured loans are not.</p>
          <label>
            Loan type
            <select name="type" required>
              <option value="mortgage">Mortgage</option>
              <option value="unsecured">Unsecured</option>
            </select>
          </label>
          <label>
            Amount
            <input name="amount" type="number" step="0.01" min="0.01" required />
          </label>
          <button type="submit">Apply</button>
        </form>

        <form action={payLoan} className="card">
          <h2>Pay a loan</h2>
          {loans.length === 0 ? (
            <p className="muted">You do not have any loans out to pay.</p>
          ) : (
            <>
              <label>
                Loan
                <select name="loan" required>
                  {loans.map((l) => <option key={l.loan_id} value={l.loan_id}>{l.loan_id} · {l.loan_type} · {usd(l.amount)} left</option>)}
                </select>
              </label>
              <label>
                Pay from account
                <select name="account" required>
                  {accounts.map((a) => <option key={a.account_id} value={a.account_id}>{a.account_id} · {a.account_type} · {usd(a.balance)}</option>)}
                </select>
              </label>
              <label>
                Amount
                <input name="amount" type="number" step="0.01" min="0.01" required />
              </label>
              <button type="submit">Pay</button>
            </>
          )}
        </form>
      </div>
    </>
  );
}
