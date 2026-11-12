import { describe, expect, it } from 'vitest'
import { canManageTasks } from '@/lib/authz'

describe('canManageTasks', () => {
  it('allows ADMIN', () => {
    expect(canManageTasks('ADMIN')).toBe(true)
  })

  it('allows MANAGER', () => {
    expect(canManageTasks('MANAGER')).toBe(true)
  })

  it('denies VIEWER', () => {
    expect(canManageTasks('VIEWER')).toBe(false)
  })

  it('denies missing role', () => {
    expect(canManageTasks(null)).toBe(false)
    expect(canManageTasks(undefined)).toBe(false)
  })
})
