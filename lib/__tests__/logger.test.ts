import { afterEach, describe, expect, it, vi } from 'vitest'
import { getRequestId, logError, logInfo } from '@/lib/logger'

describe('logger', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('writes structured error logs', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    logError('test.failed', { requestId: 'req-1' })

    const payload = JSON.parse(String(spy.mock.calls[0][0]))
    expect(payload).toMatchObject({ level: 'error', event: 'test.failed', requestId: 'req-1' })
    expect(typeof payload.timestamp).toBe('string')
  })

  it('writes structured info logs', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {})
    logInfo('test.info', { value: 1 })

    const payload = JSON.parse(String(spy.mock.calls[0][0]))
    expect(payload).toMatchObject({ level: 'info', event: 'test.info', value: 1 })
  })

  it('reads request ids', () => {
    expect(getRequestId(new Request('http://localhost', { headers: { 'x-request-id': 'abc' } }))).toBe('abc')
    expect(getRequestId(new Request('http://localhost'))).toBe('unknown')
  })
})
