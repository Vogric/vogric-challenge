import { afterEach, describe, it, expect, vi } from 'vitest'
import { cn, formatRelativeTime, initials } from '@/lib/utils'

describe('cn', () => {
  it('should merge classes correctly', () => {
    expect(cn('px-2', 'py-4')).toBe('px-2 py-4')
  })

  it('should resolve conflicts using last class wins (twMerge)', () => {
    // px-4 overrides px-2 because tailwind-merge resolves conflicts
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('should handle undefined/null inputs gracefully', () => {
    expect(cn('px-2', undefined, null, 'py-4')).toBe('px-2 py-4')
  })

  it('should handle empty input', () => {
    expect(cn()).toBe('')
  })

  it('should merge conditional classes', () => {
    const isActive = true
    expect(cn('base', isActive && 'active')).toBe('base active')
  })

  it('should not include falsy conditional classes', () => {
    const isActive = false
    expect(cn('base', isActive && 'active')).toBe('base')
  })
})


describe('formatRelativeTime', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('formats a past timestamp relative to now', () => {
    vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-01-01T12:00:00.000Z').getTime())
    expect(formatRelativeTime('2026-01-01T10:00:00.000Z')).toBe('2 hours ago')
  })

  it('returns the original string for an invalid date', () => {
    expect(formatRelativeTime('not-a-date')).toBe('not-a-date')
  })
})

describe('initials', () => {
  it('prefers the name and falls back to the email', () => {
    expect(initials('Demo User', 'demo@example.com')).toBe('DE')
    expect(initials(null, 'viewer@example.com')).toBe('VI')
    expect(initials()).toBe('U')
  })
})
