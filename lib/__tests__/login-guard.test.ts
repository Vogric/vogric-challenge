import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn(),
}))

import { checkRateLimit } from '@/lib/rate-limit'
import { enforceLoginRateLimit } from '@/lib/login-guard'
import { clientIp } from '@/lib/request-ip'

function loginRequest(headers: Record<string, string> = {}) {
  return new Request('http://localhost/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
  })
}

describe('enforceLoginRateLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lets the request through when under the limit', async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ limited: false, remaining: 4 })

    const response = await enforceLoginRateLimit(loginRequest())

    expect(response).toBeNull()
  })

  it('returns a non-cacheable 429 when the limit is exceeded', async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ limited: true, remaining: 0 })

    const response = await enforceLoginRateLimit(loginRequest())

    expect(response?.status).toBe(429)
    expect(response?.headers.get('Cache-Control')).toBe('no-store')
    await expect(response?.json()).resolves.toEqual({
      error: 'Too many requests. Please try again later.',
    })
  })

  it('keys the counter by client ip, not by the whole proxy chain', async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ limited: false, remaining: 4 })

    await enforceLoginRateLimit(
      loginRequest({ 'x-forwarded-for': '203.0.113.7, 70.41.3.18, 150.172.238.178' })
    )

    expect(checkRateLimit).toHaveBeenCalledWith('rate-limit:login:203.0.113.7', 50, 60_000)
  })

  it('falls back to x-real-ip and then to a shared bucket', async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ limited: false, remaining: 4 })

    await enforceLoginRateLimit(loginRequest({ 'x-real-ip': '198.51.100.4' }))
    expect(checkRateLimit).toHaveBeenLastCalledWith('rate-limit:login:198.51.100.4', 50, 60_000)

    await enforceLoginRateLimit(loginRequest())
    expect(checkRateLimit).toHaveBeenLastCalledWith('rate-limit:login:anonymous', 50, 60_000)
  })
})

describe('clientIp', () => {
  it('takes the left-most forwarded entry and trims it', () => {
    const request = loginRequest({ 'x-forwarded-for': '  203.0.113.7 , 10.0.0.1' })

    expect(clientIp(request)).toBe('203.0.113.7')
  })

  it('prefers x-forwarded-for over x-real-ip', () => {
    const request = loginRequest({
      'x-forwarded-for': '203.0.113.7',
      'x-real-ip': '198.51.100.4',
    })

    expect(clientIp(request)).toBe('203.0.113.7')
  })
})
