import { Suspense } from 'react';
import { getCards, getCurrentCustomer, getRecentPurchases, listVendors } from '@/lib/bank';
import { makePurchase } from '../../actions';
import { Flash, Loading, Table, usd, when } from '../../ui';
import { CardsTables } from '../parts';

// Make a Purchase: [V] View Credit/Debit Info, [P] Make Purchase (App.java:733-844)
export default function PurchasesPage(props: PageProps<'/customer/purchases'>) {
  return (
    <>
      <h1>Purchases</h1>
      <Suspense fallback={null}>
        <Flash searchParams={props.searchParams} />
      </Suspense>
      <Suspense fallback={<Loading />}>
        <Purchases />
      </Suspense>
    </>
  );
}

async function Purchases() {
  const customer = await getCurrentCustomer();
  const [cards, vendors, purchases] = await Promise.all([
    getCards(customer.customer_id),
    listVendors(),
    getRecentPurchases(customer.customer_id),
  ]);
  const allCards = [...cards.debit, ...cards.credit];

  return (
    <>
      <form action={makePurchase} className="card">
        <h2>Make a purchase</h2>
        {allCards.length === 0 ? (
          <p className="muted">Open a debit or credit card first.</p>
        ) : (
          <>
            <label>
              Vendor
              <select name="vendor" required>
                {vendors.map((v) => <option key={v.vendor_id} value={v.vendor_id}>{v.vendor_name}</option>)}
              </select>
            </label>
            <label>
              Card
              <select name="card" required>
                {cards.debit.map((c) => <option key={c.card_id} value={c.card_id}>{c.card_id} · debit · {usd(c.balance)} in {c.account_id}</option>)}
                {cards.credit.map((c) => <option key={c.card_id} value={c.card_id}>{c.card_id} · credit · {usd(c.limit - c.running_balance)} available</option>)}
              </select>
            </label>
            <label>
              Amount
              <input name="amount" type="number" step="0.01" min="0.01" required />
            </label>
            <button type="submit">Buy</button>
          </>
        )}
      </form>

      <CardsTables debit={cards.debit} credit={cards.credit} />

      <h2>Recent purchases</h2>
      <Table
        rows={purchases}
        empty="No purchases yet."
        columns={[
          { label: 'Date', render: (p) => when(p.purchase_date) },
          { label: 'Vendor', render: (p) => p.vendor?.vendor_name ?? '—' },
          { label: 'Card', render: (p) => p.card_id },
          { label: 'Amount', render: (p) => usd(p.amount), numeric: true },
        ]}
      />
    </>
  );
}
