import { describe, expect, it } from 'vitest'
import { parseAuditMetadata } from '@/lib/audit-metadata'
import { isNoOpAuditEvent } from '@/lib/audit-is-no-op'

describe('audit metadata', () => {
  it('parses task transitions with their action-specific type', () => {
    expect(
      parseAuditMetadata('task.status_changed', {
        from: 'todo',
        to: 'done',
        title: 'Task',
      })
    ).toEqual({ kind: 'task.status_changed', from: 'todo', to: 'done', title: 'Task' })
  })

  it('parses membership roles and keeps unknown events raw', () => {
    expect(
      parseAuditMetadata('membership.role_changed', {
        targetUserId: 'user-1',
        from: 'ADMIN',
        to: 'MANAGER',
      })
    ).toEqual({
      kind: 'membership.role_changed',
      targetUserId: 'user-1',
      from: 'ADMIN',
      to: 'MANAGER',
    })

    expect(parseAuditMetadata('future.event', { arbitrary: true })).toEqual({
      kind: 'unknown',
      raw: { arbitrary: true },
    })
  })

  it('detects no-op transitions only for known actions', () => {
    expect(isNoOpAuditEvent('task.status_changed', { from: 'done', to: 'done', title: 'Task' })).toBe(true)
    expect(isNoOpAuditEvent('task.status_changed', { from: 'todo', to: 'done', title: 'Task' })).toBe(false)
    expect(isNoOpAuditEvent('future.event', { from: 'x', to: 'x' })).toBe(false)
  })
})
