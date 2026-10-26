import { NextResponse, type NextRequest } from 'next/server';
import { GATE_COOKIE, isValidGateToken } from './lib/gate-token';

// Optimistic check: send anyone who hasn't entered the admin password to
// /login. The authoritative check is requireGate() in the data layer.
export async function proxy(request: NextRequest) {
  if (await isValidGateToken(request.cookies.get(GATE_COOKIE)?.value)) return NextResponse.next();
  const login = new URL('/login', request.url);
  const next = request.nextUrl.pathname + request.nextUrl.search;
  if (next !== '/') login.searchParams.set('next', next);
  return NextResponse.redirect(login);
}

export const config = {
  // Everything except the login page itself and static assets.
  matcher: ['/((?!login|_next/static|_next/image|favicon.ico).*)'],
};
