import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('jose', () => ({
  SignJWT: vi.fn(() => ({
    setProtectedHeader: vi.fn().mockReturnThis(),
    setIssuer: vi.fn().mockReturnThis(),
    setAudience: vi.fn().mockReturnThis(),
    setJti: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    sign: vi.fn().mockResolvedValue('mock-jwt-token'),
  })),
  jwtVerify: vi.fn().mockResolvedValue({
    payload: { userId: 'user-123', email: 'test@example.com', name: 'Test User', jti: 'session-1' },
    protectedHeader: { alg: 'HS256' },
    signature: 'mock-signature',
  } as unknown as Awaited<ReturnType<typeof jwtVerify>>),
}))

vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
    },
    session: {
      findUnique: vi.fn(),
      deleteMany: vi.fn(),
      create: vi.fn(),
    },
  },
}))

import {
  clearSessionCookie,
  createJWT,
  getCurrentUserFromRequest,
  getCurrentUserFromToken,
  getSessionFromCookie,
  revokeSessionFromCookie,
  setSessionCookie,
  verifyJWT,
} from '@/lib/auth'
import { db } from '@/lib/db'
import { jwtVerify } from 'jose'

describe('Auth', () => {
  beforeEach(() => {
    // Reset jwtVerify mock to default resolved value for each test
    vi.mocked(jwtVerify).mockResolvedValue({
      payload: { userId: 'user-123', email: 'test@example.com', name: 'Test User', jti: 'session-1' },
      protectedHeader: { alg: 'HS256' },
      signature: 'mock-signature',
    } as unknown as Awaited<ReturnType<typeof jwtVerify>>)
    vi.mocked(db.user.findUnique).mockResolvedValue(null)
    vi.mocked(db.session.findUnique).mockResolvedValue({
      id: 'session-1',
      userId: 'user-123',
      sessionToken: 'session-1',
      expires: new Date(Date.now() + 60_000),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('createJWT', () => {
    it('should return a valid JWT string', async () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        image: null,
        emailVerified: null,
        password: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const token = await createJWT(user)

      expect(typeof token).toBe('string')
      expect(token).toBe('mock-jwt-token')
    })
  })

  describe('verifyJWT', () => {
    it('should return payload for valid token', async () => {
      const payload = await verifyJWT('any-token')

      expect(payload).not.toBeNull()
      expect(payload?.userId).toBe('user-123')
      expect(payload?.email).toBe('test@example.com')
    })

    it('should return null for invalid token', async () => {
      vi.mocked(jwtVerify).mockRejectedValueOnce(new Error('Invalid token'))

      const payload = await verifyJWT('bad-token')
      expect(payload).toBeNull()
    })
  })

  describe('getCurrentUserFromToken', () => {
    it('should return user if token is valid and user exists in DB', async () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        image: null,
        emailVerified: null,
        password: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(db.user.findUnique).mockResolvedValue(user)

      const token = await createJWT(user)
      const result = await getCurrentUserFromToken(token)

      expect(result).not.toBeNull()
      expect(result?.id).toBe('user-123')
      expect(result?.email).toBe('test@example.com')
    })

    it('should return null if token is invalid', async () => {
      vi.mocked(jwtVerify).mockRejectedValueOnce(new Error('Invalid token'))

      const result = await getCurrentUserFromToken('invalid-token')
      expect(result).toBeNull()
      expect(db.user.findUnique).not.toHaveBeenCalled()
    })

    it('should return null if user does not exist in DB', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(null)

      const token = await createJWT({ id: 'user-999', email: 'x@y.com', name: 'X' })
      const result = await getCurrentUserFromToken(token)

      expect(result).toBeNull()
    })
  })

  describe('session cookies', () => {
    it('writes an HttpOnly session cookie', () => {
      const response = new Response()
      setSessionCookie(response, 'token-123')
      const cookie = response.headers.get('set-cookie') ?? ''
      expect(cookie).toContain('session=token-123')
      expect(cookie).toContain('HttpOnly')
      expect(cookie).toContain('SameSite=Lax')
      expect(cookie).toContain('Max-Age=604800')
    })

    it('clears the session cookie', () => {
      const response = new Response()
      clearSessionCookie(response)
      const cookie = response.headers.get('set-cookie') ?? ''
      expect(cookie).toContain('session=')
      expect(cookie).toContain('Max-Age=0')
    })

    it('parses the session payload from a cookie header', async () => {
      const payload = await getSessionFromCookie('other=value; session=token-123')
      expect(payload?.userId).toBe('user-123')
      expect(payload?.jti).toBe('session-1')
    })

    it('returns null without a cookie header', async () => {
      expect(await getSessionFromCookie(undefined)).toBeNull()
    })
  })

  describe('request authentication', () => {
    it('returns the user for an active session', async () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        image: null,
        emailVerified: null,
        password: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      vi.mocked(db.user.findUnique).mockResolvedValue(user)

      const request = new Request('http://localhost/api/test', {
        headers: { cookie: 'session=token-123' },
      })
      const result = await getCurrentUserFromRequest(request)
      expect(result?.id).toBe('user-123')
    })

    it('returns null when the session is expired', async () => {
      vi.mocked(db.session.findUnique).mockResolvedValueOnce({
        id: 'session-1',
        userId: 'user-123',
        sessionToken: 'session-1',
        expires: new Date(Date.now() - 1000),
      })

      const request = new Request('http://localhost/api/test', {
        headers: { cookie: 'session=token-123' },
      })
      expect(await getCurrentUserFromRequest(request)).toBeNull()
      expect(db.user.findUnique).not.toHaveBeenCalled()
    })

    it('revokes the current session', async () => {
      vi.mocked(db.session.deleteMany).mockResolvedValue({ count: 1 })
      await revokeSessionFromCookie('session=token-123')
      expect(db.session.deleteMany).toHaveBeenCalledWith({
        where: { sessionToken: 'session-1' },
      })
    })
  })
})
