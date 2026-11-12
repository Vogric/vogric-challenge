import { describe, expect, it } from 'vitest'
import { loginSchema } from '@/lib/validations/auth'

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    expect(loginSchema.safeParse({ email: 'demo@example.com', password: 'password123' }).success).toBe(true)
  })

  it('rejects invalid email and short password', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: 'short' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email).toBeDefined()
      expect(result.error.flatten().fieldErrors.password).toBeDefined()
    }
  })
})
