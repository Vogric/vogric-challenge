import { beforeEach, describe, expect, it } from 'vitest'
import { checkRateLimit } from '@/lib/rate-limit'

describe('checkRateLimit fallback', () => {
  beforeEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
  })

  it('blocks requests after the configured maximum', async () => {
    const key = `test:${crypto.randomUUID()}`

    for (let i = 0; i < 3; i++) {
      await expect(checkRateLimit(key, 3, 60_000)).resolves.toEqual({
        limited: false,
        remaining: 2 - i,
      })
    }

    await expect(checkRateLimit(key, 3, 60_000)).resolves.toEqual({
      limited: true,
      remaining: 0,
    })
  })
})
