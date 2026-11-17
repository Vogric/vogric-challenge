import { describe, expect, it } from 'vitest'
import { validateEnv } from '@/lib/env'

const valid = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
  JWT_SECRET: '0123456789abcdef0123456789abcdef',
}

describe('validateEnv', () => {
  it('accepts the required runtime contract', () => {
    expect(validateEnv(valid)).toMatchObject(valid)
  })

  it('rejects a missing database URL and a short JWT secret', () => {
    expect(() =>
      validateEnv({ DATABASE_URL: '', JWT_SECRET: 'short' })
    ).toThrow(/DATABASE_URL.*JWT_SECRET/)
  })

  it('rejects a malformed Upstash URL', () => {
    expect(() =>
      validateEnv({ ...valid, UPSTASH_REDIS_REST_URL: 'not-a-url' })
    ).toThrow(/UPSTASH_REDIS_REST_URL/)
  })
})
