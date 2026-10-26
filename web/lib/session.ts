import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { GATE_COOKIE, gateToken, isValidGateToken } from './gate-token';

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
} as const;

// ---------------------------------------------------------------------------
// Admin password gate
// ---------------------------------------------------------------------------

/** Redirects to /login unless the admin password has been entered. */
export async function requireGate() {
  if (!(await isValidGateToken((await cookies()).get(GATE_COOKIE)?.value))) redirect('/login');
}

/** Checks the password and, if correct, remembers it for 7 days. */
export async function unlockGate(password: string): Promise<boolean> {
  const expected = process.env.DEMO_PASSWORD;
  if (!expected || password !== expected) return false;
  (await cookies()).set(GATE_COOKIE, await gateToken(expected), { ...cookieOptions, maxAge: 60 * 60 * 24 * 7 });
  return true;
}

export async function lockGate() {
  const store = await cookies();
  store.delete(GATE_COOKIE);
  store.delete(COOKIE);
}

// ---------------------------------------------------------------------------
// Demo customer
// ---------------------------------------------------------------------------

// Demo mode (decision D3): like the original app, a visitor picks which
// customer to act as. The choice is remembered in an httpOnly cookie.
const COOKIE = 'nsl_customer';

export async function getCustomerId(): Promise<string | null> {
  return (await cookies()).get(COOKIE)?.value ?? null;
}

export async function setCustomerId(customerId: string) {
  (await cookies()).set(COOKIE, customerId, cookieOptions);
}

export async function clearCustomerId() {
  (await cookies()).delete(COOKIE);
}
