import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

vi.mock('@/lib/login-guard', () => ({
  enforceLoginRateLimit: vi.fn(),
}))

import { enforceLoginRateLimit } from '@/lib/login-guard'
import { middleware } from './middleware'

function createMockRequest(
  url: string,
  options: { cookie?: string; method?: string; requestId?: string } = {}
): NextRequest {
  const headers = new Headers()
  if (options.cookie) headers.set('cookie', options.cookie)
  if (options.requestId) headers.set('x-request-id', options.requestId)

  return {
    nextUrl: new URL(url),
    url,
    method: options.method ?? 'GET',
    headers,
  } as unknown as NextRequest
}

describe('Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(enforceLoginRateLimit).mockResolvedValue(null)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  describe('Dashboard gate', () => {
    it('redirects to /auth/login when there is no session cookie', async () => {
      const res = (await middleware(createMockRequest('http://localhost:3000/dashboard'))) as NextResponse

      expect(res.status).toBe(307)
      expect(res.headers.get('location')).toContain('/auth/login')
    })

    it('redirects for nested dashboard routes', async () => {
      const res = (await middleware(
        createMockRequest('http://localhost:3000/dashboard/projects')
      )) as NextResponse

      expect(res.headers.get('location')).toContain('/auth/login')
    })

    it('lets any session cookie through — the edge is not the authority', async () => {
      // Expired or forged cookies reach the page, which resolves the session
      // against the database and redirects if it is not valid. Verifying here
      // is the cost this middleware no longer pays.
      const res = (await middleware(
        createMockRequest('http://localhost:3000/dashboard', { cookie: 'session=garbage' })
      )) as NextResponse

      expect(res.status).toBe(200)
    })
  })

  describe('Login page', () => {
    it('does not redirect an authenticated visitor — the page resolves the session', async () => {
      const res = (await middleware(
        createMockRequest('http://localhost:3000/auth/login', { cookie: 'session=valid' })
      )) as NextResponse

      expect(res.status).toBe(200)
      expect(res.headers.get('location')).toBeNull()
    })
  })

  describe('Login rate limit', () => {
    it('returns the 429 from the guard and stops', async () => {
      vi.mocked(enforceLoginRateLimit).mockResolvedValue(
        Response.json({ error: 'Too many requests' }, { status: 429 })
      )

      const res = (await middleware(
        createMockRequest('http://localhost:3000/api/auth/login', { method: 'POST' })
      )) as Response

      expect(res.status).toBe(429)
    })

    it('only guards POST on the login endpoint', async () => {
      await middleware(createMockRequest('http://localhost:3000/auth/login', { method: 'GET' }))
      await middleware(createMockRequest('http://localhost:3000/api/health', { method: 'GET' }))

      expect(enforceLoginRateLimit).not.toHaveBeenCalled()
    })
  })

  describe('Request id and CSP', () => {
    it('propagates a request id downstream and back', async () => {
      const res = (await middleware(
        createMockRequest('http://localhost:3000/dashboard', {
          cookie: 'session=valid',
          requestId: 'req-123',
        })
      )) as NextResponse

      expect(res.headers.get('x-request-id')).toBe('req-123')
    })

    it('mints a request id when the caller does not send one', async () => {
      const res = (await middleware(
        createMockRequest('http://localhost:3000/dashboard', { cookie: 'session=valid' })
      )) as NextResponse

      expect(res.headers.get('x-request-id')).toMatch(/[0-9a-f-]{36}/)
    })

    it('sets a nonce-based CSP in production', async () => {
      vi.stubEnv('NODE_ENV', 'production')

      const res = (await middleware(
        createMockRequest('http://localhost:3000/dashboard', { cookie: 'session=valid' })
      )) as NextResponse

      const csp = res.headers.get('Content-Security-Policy') ?? ''
      expect(csp).toContain("script-src 'self' 'nonce-")
      expect(csp).toContain("frame-ancestors 'none'")
    })

    it('omits the CSP outside production', async () => {
      vi.stubEnv('NODE_ENV', 'development')

      const res = (await middleware(
        createMockRequest('http://localhost:3000/dashboard', { cookie: 'session=valid' })
      )) as NextResponse

      expect(res.headers.get('Content-Security-Policy')).toBeNull()
    })
  })
})
