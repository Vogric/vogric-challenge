import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyJWT } from '@/lib/auth'

const WINDOW_MS = 60 * 1000
const MAX_ATTEMPTS = 5
const MAX_RATE_LIMIT_ENTRIES = 5000

// Simple in-memory rate limit for the demo. A production deployment should use
// a shared store (Redis/Upstash) so limits survive cold starts and instances.
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function isRateLimited(ip: string): { limited: boolean; remaining: number } {
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  if (!record || now >= record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW_MS })
    return { limited: false, remaining: MAX_ATTEMPTS - 1 }
  }

  if (record.count >= MAX_ATTEMPTS) {
    return { limited: true, remaining: 0 }
  }

  record.count += 1

  if (rateLimitMap.size > MAX_RATE_LIMIT_ENTRIES) {
    rateLimitMap.forEach((value, key) => {
      if (now >= value.resetTime) rateLimitMap.delete(key)
    })
  }

  return { limited: false, remaining: MAX_ATTEMPTS - record.count }
}

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

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isAuthPage = pathname === '/auth/login'
  const isAuthRoute = pathname.startsWith('/api/auth/login')
  const isDashboard = pathname.startsWith('/dashboard')

  const cookies = parseCookies(req.headers.get('cookie'))
  const token = cookies.session
  let payload: { userId?: string; email?: string } | null = null

  if (token) {
    try {
      payload = await verifyJWT(token)
    } catch {
      payload = null
    }
  }

  const isAuthenticated = Boolean(payload)

  // Rate limit only the login endpoint.
  if (isAuthRoute && req.method === 'POST') {
    const ip = req.ip ?? req.headers.get('x-forwarded-for') ?? 'anonymous'
    const rateLimit = isRateLimited(ip)

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

  return NextResponse.next()
}

export const config = {
  matcher: ['/auth/login', '/api/auth/login', '/dashboard/:path*'],
}
