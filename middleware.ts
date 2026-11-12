import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyJWT } from '@/lib/jwt'
import { checkRateLimit } from '@/lib/rate-limit'

const WINDOW_MS = 60 * 1000
// Keep production strict without making local/E2E login flows trip the limit.
const MAX_ATTEMPTS = process.env.NODE_ENV === 'production' ? 5 : 50

function parseCookies(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {}
  return cookieHeader.split('; ').reduce<Record<string, string>>((acc, cookie) => {
    const equalsIndex = cookie.indexOf('=')
    if (equalsIndex === -1) return acc
    const key = cookie.slice(0, equalsIndex).trim()
    const value = cookie.slice(equalsIndex + 1)
    acc[key] = value
    return acc
  }, {})
}

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
  const isAuthPage = pathname === '/auth/login'
  const isAuthRoute = pathname.startsWith('/api/auth/login')
  const isDashboard = pathname.startsWith('/dashboard')
  const requiresAuth = isAuthPage || isDashboard

  const cookies = parseCookies(req.headers.get('cookie'))
  const token = cookies.session
  let payload: { userId?: string; email?: string } | null = null

  if (requiresAuth && token) {
    try {
      payload = await verifyJWT(token)
    } catch {
      payload = null
    }
  }

  const isAuthenticated = Boolean(payload)

  // Rate limit only the login endpoint.
  if (isAuthRoute && req.method === 'POST') {
    const forwardedFor = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    const ip = forwardedFor || req.headers.get('x-real-ip') || 'anonymous'
    const rateLimit = await checkRateLimit(`rate-limit:login:${ip}`, MAX_ATTEMPTS, WINDOW_MS)

    if (rateLimit.limited) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }
  }

  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  if (isDashboard && !isAuthenticated) {
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
