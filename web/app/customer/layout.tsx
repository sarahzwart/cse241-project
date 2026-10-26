import Link from 'next/link';
import { Suspense } from 'react';
import { getCurrentCustomer } from '@/lib/bank';
import { logout } from '../actions';

// The original user Main Menu: [D] Deposit/Withdrawal, [A] Accounts,
// [C] Cards, [L] Loans, [P] Purchases.
const MENU = [
  ['/customer', 'Accounts'],
  ['/customer/banking', 'Deposit / Withdraw'],
  ['/customer/cards', 'Cards'],
  ['/customer/loans', 'Loans'],
  ['/customer/purchases', 'Purchases'],
] as const;

export default function CustomerLayout({ children }: LayoutProps<'/customer'>) {
  return (
    <>
      <Suspense fallback={<div className="who muted">…</div>}>
        <WhoAmI />
      </Suspense>
      <nav className="tabs" aria-label="Customer menu">
        {MENU.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}
      </nav>
      {children}
    </>
  );
}

async function WhoAmI() {
  const customer = await getCurrentCustomer();
  return (
    <div className="who">
      <span>Logged in as <strong>{customer.customer_name}</strong> <span className="muted">({customer.customer_id})</span></span>
      <form action={logout}><button type="submit" className="secondary">Log out</button></form>
    </div>
  );
}
