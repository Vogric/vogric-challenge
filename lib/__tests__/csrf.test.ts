import { describe, expect, it } from 'vitest'
import { rejectCrossOrigin } from '@/lib/csrf'

function request(headers: Record<string, string> = {}) {
  return new Request('http://localhost/api/test', { method: 'POST', headers })
}

describe('rejectCrossOrigin', () => {
  it('allows requests without origin headers (server-to-server)', () => {
    expect(rejectCrossOrigin(request())).toBeNull()
  })

  it('allows same-origin requests', () => {
    expect(
      rejectCrossOrigin(
        request({ host: 'localhost', origin: 'http://localhost', 'sec-fetch-site': 'same-origin' })
      )
    ).toBeNull()
  })

  it('blocks cross-site fetch metadata', () => {
    const response = rejectCrossOrigin(request({ 'sec-fetch-site': 'cross-site' }))
    expect(response?.status).toBe(403)
  })

  it('blocks a mismatched origin', () => {
    const response = rejectCrossOrigin(
      request({ host: 'localhost', origin: 'https://evil.example' })
    )
    expect(response?.status).toBe(403)
  })

  it('blocks invalid origins', () => {
    const response = rejectCrossOrigin(request({ host: 'localhost', origin: 'not-a-url' }))
    expect(response?.status).toBe(403)
  })

  it('blocks when host is missing', () => {
    const response = rejectCrossOrigin(request({ origin: 'http://localhost' }))
    expect(response?.status).toBe(403)
  })
})
