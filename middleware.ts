import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { readSessionToken } from '@/lib/cookies'
import { enforceLoginRateLimit } from '@/lib/login-guard'

/**
 * Edge middleware runs before every matched request and before the cache, so
 * everything here is a cost paid by the whole product. It used to import `jose`
 * and verify the JWT, which pushed the bundle past 40 kB and made every request
 * pay for a signature check whose result was then thrown away: pages and route
 * handlers verify the session again against the database before they read or
 * write anything.
 *
 * It is now limited to what only the middleware can do:
 *   1. bounce anonymous traffic away from /dashboard before it reaches a Server
 *      Component (a UX shortcut, not a security boundary),
 *   2. enforce the login rate limit,
 *   3. mint the CSP nonce and propagate a request id.
 *
 * The "already signed in, go to /dashboard" redirect moved into the login page
 * itself. Doing it here with a cookie-presence check creates a loop for expired
 * sessions (login -> dashboard -> login); doing it here with a real verification
 * is exactly the cost this file exists to avoid. See ADR 0006.
 */
function buildCsp(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ].join('; ')
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname === '/api/auth/login' && req.method === 'POST') {
    const limited = await enforceLoginRateLimit(req)
    if (limited) return limited
  }

  const isDashboard = pathname.startsWith('/dashboard')
  const hasSessionCookie = Boolean(readSessionToken(req.headers.get('cookie')))

  if (isDashboard && !hasSessionCookie) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  const isProduction = process.env.NODE_ENV === 'production'
  const nonce = crypto.randomUUID()
  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID()
  const csp = isProduction ? buildCsp(nonce) : null

  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-request-id', requestId)
  if (csp) {
    requestHeaders.set('x-nonce', nonce)
    requestHeaders.set('Content-Security-Policy', csp)
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set('x-request-id', requestId)
  if (csp) response.headers.set('Content-Security-Policy', csp)
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
