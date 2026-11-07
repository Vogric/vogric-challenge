import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock jose module entirely
vi.mock('jose', () => ({
  SignJWT: vi.fn(() => ({
    setProtectedHeader: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    sign: vi.fn().mockResolvedValue('mock-jwt-token'),
  })),
  jwtVerify: vi.fn().mockResolvedValue({
    payload: { userId: 'user-123', email: 'test@example.com', name: 'Test User' },
    protectedHeader: { alg: 'HS256' },
    signature: 'mock-signature',
  } as any),
}))

// Mock Prisma db
vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
    },
  },
}))

import { createJWT, verifyJWT, getCurrentUserFromToken } from '@/lib/auth'
import { db } from '@/lib/db'
import { jwtVerify } from 'jose'

describe('Auth', () => {
  beforeEach(() => {
    // Reset jwtVerify mock to default resolved value for each test
    vi.mocked(jwtVerify).mockResolvedValue({
      payload: { userId: 'user-123', email: 'test@example.com', name: 'Test User' },
      protectedHeader: { alg: 'HS256' },
      signature: 'mock-signature',
    } as any)
    vi.mocked(db.user.findUnique).mockResolvedValue(null)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('createJWT', () => {
    it('should return a valid JWT string', async () => {
      const user = { id: 'user-123', email: 'test@example.com', name: 'Test User' } as any

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
      const user = { id: 'user-123', email: 'test@example.com', name: 'Test User' } as any

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

      const token = await createJWT({ id: 'user-999', email: 'x@y.com', name: 'X' } as any)
      const result = await getCurrentUserFromToken(token)

      expect(result).toBeNull()
    })
  })
})
