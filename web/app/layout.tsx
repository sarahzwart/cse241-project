import type { Metadata } from 'next';
import Link from 'next/link';
import { lock } from './actions';
import './globals.css';

export const metadata: Metadata = {
  title: 'NSL Bank',
  description: 'A demo bank: a CSE241 database project with a Next.js + Supabase frontend.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <Link href="/" className="brand">NSL Bank</Link>
          <span className="muted">Demo bank, not real money</span>
          <form action={lock} className="lock">
            <button type="submit" className="secondary">Lock</button>
          </form>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
