import { describe, expect, it } from 'vitest'
import { parseAuditMetadata } from '@/lib/audit-metadata'
import { isNoOpAuditEvent } from '@/lib/audit-is-no-op'

describe('audit metadata', () => {
  it('parses known transition fields and preserves unknown keys', () => {
    expect(parseAuditMetadata({ from: 'todo', to: 'done', title: 'Task', extra: 1 })).toEqual({
      from: 'todo',
      to: 'done',
      title: 'Task',
      extra: 1,
    })
  })

  it('returns null for non-objects and marks no-op transitions', () => {
    expect(parseAuditMetadata(null)).toBeNull()
    expect(parseAuditMetadata('invalid')).toBeNull()
    expect(isNoOpAuditEvent({ from: 'done', to: 'done' })).toBe(true)
    expect(isNoOpAuditEvent({ from: 'todo', to: 'done' })).toBe(false)
  })
})
