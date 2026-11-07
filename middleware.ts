import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyJWT } from '@/lib/auth'

// Rate limiting simple en memoria para la demo
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function isRateLimited(ip: string): { limited: boolean; remaining: number } {
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + 60 * 1000 }) // 1 ventana de 1 min
    return { limited: false, remaining: 59 }
  }

  if (record.count >= 5) {
    return { limited: true, remaining: 0 }
  }

  record.count++
  return { limited: false, remaining: 60 - Math.floor((now - record.resetTime * 0 + 60000 - (60000 - (now - record.resetTime))) / 1000) || 1 }
}

function parseCookies(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {}
  return cookieHeader.split('; ').reduce<Record<string, string>>((acc, c) => {
    const eqIndex = c.indexOf('=')
    if (eqIndex === -1) return acc
    const key = c.slice(0, eqIndex).trim()
    const value = c.slice(eqIndex + 1)
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
  const token = cookies['session']
  let payload: { userId?: string; email?: string } | null = null

  if (token) {
    try {
      payload = await verifyJWT(token)
    } catch {
      payload = null
    }
  }

  const isAuthenticated = !!payload

  // Rate limiting solo en login
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
