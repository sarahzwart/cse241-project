import { Suspense } from 'react';
import { getAccounts, getCards, getCurrentCustomer } from '@/lib/bank';
import { openCreditCard, openDebitCard } from '../../actions';
import { Flash, Loading, usd } from '../../ui';
import { CardsTables } from '../parts';

// Open a Credit or Debit Card: [V] View, [C] Credit, [D] Debit (App.java:669-731)
export default function CardsPage(props: PageProps<'/customer/cards'>) {
  return (
    <>
      <h1>Cards</h1>
      <Suspense fallback={null}>
        <Flash searchParams={props.searchParams} />
      </Suspense>
      <Suspense fallback={<Loading />}>
        <Cards />
      </Suspense>
    </>
  );
}

async function Cards() {
  const customer = await getCurrentCustomer();
  const [cards, accounts] = await Promise.all([getCards(customer.customer_id), getAccounts(customer.customer_id)]);
  const checking = accounts.filter((a) => a.account_type === 'checking');

  return (
    <>
      <CardsTables debit={cards.debit} credit={cards.credit} />
      <div className="forms">
        <form action={openCreditCard} className="card">
          <h2>Open a credit card</h2>
          <label>
            Credit limit
            <input name="limit" type="number" step="0.01" min="0.01" required />
          </label>
          <p className="muted">All credit cards carry an 18.00% interest rate.</p>
          <button type="submit">Open credit card</button>
        </form>

        <form action={openDebitCard} className="card">
          <h2>Open a debit card</h2>
          {checking.length === 0 ? (
            <p className="muted">You need a checking account to open a debit card.</p>
          ) : (
            <>
              <label>
                Checking account to connect
                <select name="account" required>
                  {checking.map((a) => <option key={a.account_id} value={a.account_id}>{a.account_id} · {usd(a.balance)}</option>)}
                </select>
              </label>
              <button type="submit">Open debit card</button>
            </>
          )}
        </form>
      </div>
    </>
  );
}
