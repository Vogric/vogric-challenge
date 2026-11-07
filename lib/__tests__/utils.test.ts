import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn', () => {
  it('should merge classes correctly', () => {
    expect(cn('px-2', 'py-4')).toBe('px-2 py-4')
  })

  it('should resolve conflicts using last class wins (twMerge)', () => {
    // px-4 overrides px-2 because tailwind-merge resolves conflicts
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('should handle undefined/null inputs gracefully', () => {
    expect(cn('px-2', undefined as unknown as string, null as unknown as string, 'py-4')).toBe('px-2 py-4')
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
