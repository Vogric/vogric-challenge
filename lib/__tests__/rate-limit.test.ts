import { beforeEach, describe, expect, it } from 'vitest'
import { checkRateLimit } from '@/lib/rate-limit'

describe('checkRateLimit fallback', () => {
  beforeEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
  })

  it('evicts the oldest local counters instead of growing without bound', async () => {
    for (let i = 0; i < 5_002; i++) {
      await checkRateLimit(`eviction:${i}`, 1, 60_000)
    }

    // The first key was inserted before the cap and should have been evicted.
    await expect(checkRateLimit('eviction:0', 1, 60_000)).resolves.toEqual({
      limited: false,
      remaining: 0,
    })
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
