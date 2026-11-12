import { describe, expect, it } from 'vitest'
import { authKeys, taskKeys } from '@/lib/query-keys'

describe('query keys', () => {
  it('exposes a stable current-user key', () => {
    expect(authKeys.currentUser).toEqual(['currentUser'])
  })

  it('builds organization and paginated task keys', () => {
    expect(taskKeys.byOrg('org-1')).toEqual(['tasks', 'org-1'])
    expect(taskKeys.list('org-1', 2, 50)).toEqual(['tasks', 'org-1', 2, 50])
    expect(taskKeys.all).toEqual(['tasks'])
  })
})
