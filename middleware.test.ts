import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

// Mock jose
vi.mock('@/lib/jwt', () => ({
  verifyJWT: vi.fn(),
}))

import { verifyJWT } from '@/lib/jwt'
import { middleware } from './middleware'

function createMockRequest(url: string, cookieHeader?: string): NextRequest {
  return {
    nextUrl: new URL(url),
    url,
    headers: new Headers(cookieHeader ? { cookie: cookieHeader } : {}),
  } as unknown as NextRequest
}

describe('Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Authenticated user', () => {
    it('should redirect to /dashboard if already authenticated and visiting /auth/login', async () => {
      vi.mocked(verifyJWT).mockResolvedValue({ userId: 'user-123', email: 'test@example.com' })

      const req = createMockRequest('http://localhost:3000/auth/login', 'session=valid-token')
      const res = await middleware(req)

      expect(res).toBeInstanceOf(NextResponse)
      expect((res as NextResponse).headers.get('location')).toContain('/dashboard')
    })

    it('should allow access to /dashboard if authenticated', async () => {
      vi.mocked(verifyJWT).mockResolvedValue({ userId: 'user-123', email: 'test@example.com' })

      const req = createMockRequest('http://localhost:3000/dashboard', 'session=valid-token')
      const res = await middleware(req)

      expect(res).toBeInstanceOf(NextResponse)
      expect((res as NextResponse).status).toBe(200)
    })
  })

  describe('Unauthenticated user', () => {
    it('should redirect to /auth/login if accessing /dashboard without session', async () => {
      vi.mocked(verifyJWT).mockResolvedValue(null)

      const req = createMockRequest('http://localhost:3000/dashboard', undefined)
      const res = await middleware(req)

      expect((res as NextResponse).headers.get('location')).toContain('/auth/login')
    })

    it('should redirect to /auth/login if accessing /dashboard with invalid token', async () => {
      vi.mocked(verifyJWT).mockResolvedValue(null)

      const req = createMockRequest('http://localhost:3000/dashboard', 'session=invalid-token')
      const res = await middleware(req)

      expect((res as NextResponse).headers.get('location')).toContain('/auth/login')
    })

    it('should allow access to /auth/login if not authenticated', async () => {
      vi.mocked(verifyJWT).mockResolvedValue(null)

      const req = createMockRequest('http://localhost:3000/auth/login', undefined)
      const res = await middleware(req)

      expect((res as NextResponse).status).toBe(200)
    })

    it('should handle missing cookie header gracefully', async () => {
      vi.mocked(verifyJWT).mockResolvedValue(null)

      const req = createMockRequest('http://localhost:3000/dashboard')
      const res = await middleware(req)

      expect((res as NextResponse).headers.get('location')).toContain('/auth/login')
    })
  })
})
