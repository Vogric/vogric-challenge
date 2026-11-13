import { describe, expect, it } from 'vitest'
import { authKeys, taskKeys } from '@/lib/query-keys'

describe('query keys', () => {
  it('exposes a stable current-user key', () => {
    expect(authKeys.currentUser).toEqual(['currentUser'])
  })

  it('builds organization and cursor task keys', () => {
    expect(taskKeys.byOrg('org-1')).toEqual(['tasks', 'org-1'])
    expect(taskKeys.cursor('org-1', null)).toEqual(['tasks', 'org-1', 'cursor', null])
    expect(taskKeys.cursor('org-1', 'abc')).toEqual(['tasks', 'org-1', 'cursor', 'abc'])
    expect(taskKeys.all).toEqual(['tasks'])
  })

  it('keeps every page of an organization under the same prefix', () => {
    const first = taskKeys.cursor('org-1', null)
    const second = taskKeys.cursor('org-1', 'abc')
    const prefix = taskKeys.byOrg('org-1')

    expect(first.slice(0, prefix.length)).toEqual([...prefix])
    expect(second.slice(0, prefix.length)).toEqual([...prefix])
  })
})
