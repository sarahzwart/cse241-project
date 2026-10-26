// Site-wide admin password gate (decision D3, amended 2026-10-26): like the
// original app's "Please enter password" prompt, nothing is reachable until
// the demo password is entered. Shared by proxy.ts and the server code.

export const GATE_COOKIE = 'nsl_gate';

/** Cookie value proving the password was entered. Changes if the password changes. */
export async function gateToken(password: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`nsl-gate:${password}`));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** True if the cookie value matches the configured password. Fails closed when unset. */
export async function isValidGateToken(token: string | undefined): Promise<boolean> {
  const password = process.env.DEMO_PASSWORD;
  if (!password || !token) return false;
  return token === (await gateToken(password));
}
