import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { readSessionToken } from '@/lib/cookies'
import { enforceLoginRateLimit } from '@/lib/login-guard'

/**
 * Edge middleware is on the hot path for every request. It only gates anonymous
 * `/dashboard` traffic before a Server Component runs, enforces the login rate
 * limit, and mints the CSP nonce/request id. Session authorization is re-derived
 * in Node. The authenticated-user redirect lives in the login page to avoid
 * expired-cookie loops; see ADR 0006.
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

  const isDashboard = pathname === '/dashboard' || pathname.startsWith('/dashboard/')
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
