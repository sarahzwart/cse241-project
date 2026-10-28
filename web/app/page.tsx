import Link from 'next/link';
import { Suspense } from 'react';
import { connection } from 'next/server';
import { listCustomers } from '@/lib/bank';
import { login } from './actions';
import { Flash, Loading } from './ui';

// Mirrors the original entry menu: [E] Employee Login / [U] User Login.
export default function Home(props: PageProps<'/'>) {
  return (
    <>
      <h1>Welcome to Bank Demo</h1>
      <p className="muted">
        A demo of my CSE241 database project: the original Oracle schema and Java business rules,
        rebuilt on Supabase (PostgreSQL) with a Next.js frontend. All data is fictional.
      </p>
      <Suspense fallback={null}>
        <Flash searchParams={props.searchParams} />
      </Suspense>

      <div className="forms">
        <section>
          <h2>Customer login</h2>
          <Suspense fallback={<Loading />}>
            <LoginForm />
          </Suspense>
        </section>
        <section>
          <h2>Employee login</h2>
          <p>View all customers, cards, accounts, transactions and loans.</p>
          <Link href="/employee">Open employee view →</Link>
        </section>
      </div>
    </>
  );
}

async function LoginForm() {
  await connection();
  const customers = await listCustomers();
  return (
    <form action={login} className="card">
      <label>
        Log in as
        <select name="customer" required defaultValue="C00001">
          {customers.map((c) => (
            <option key={c.customer_id} value={c.customer_id}>
              {c.customer_name}{c.customer_id === 'C00001' ? ' (most activity)' : ''}
            </option>
          ))}
        </select>
      </label>
      <button type="submit">Log in</button>
    </form>
  );
}
