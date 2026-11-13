import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/db', () => ({
  db: {
    task: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}))

import { db } from '@/lib/db'
import { clearTaskCountCache, decodeTaskCursor, getTasksPage } from '@/lib/tasks'

function buildRow(index: number, minutesPast = 0) {
  return {
    id: `task-${index}`,
    title: `Task ${index}`,
    status: 'todo' as const,
    projectId: 'project-1',
    assigneeId: null,
    createdAt: new Date(Date.UTC(2026, 0, 1, 0, 0, 0)),
    updatedAt: new Date(Date.UTC(2026, 0, 1, 0, minutesPast, 0)),
  }
}

describe('getTasksPage (keyset pagination)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearTaskCountCache()
    vi.mocked(db.task.count).mockResolvedValue(120)
    vi.mocked(db.task.findMany).mockResolvedValue([
      {
        id: 'task-1',
        title: 'Task 1',
        status: 'todo',
        updatedAt: new Date('2026-01-01T00:00:00Z'),
      },
    ] as never)
  })

  it('serializes tasks and derives pagination from the row count', async () => {
    const result = await getTasksPage('org-1', null, 50)

    expect(result.tasks).toEqual([
      { id: 'task-1', title: 'Task 1', status: 'todo', updatedAt: '2026-01-01T00:00:00.000Z' },
    ])
    expect(result.pagination).toEqual({
      pageSize: 50,
      totalCount: 120,
      totalPages: 3,
      nextCursor: null,
      hasNextPage: false,
    })
    expect(db.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 51,
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      })
    )
  })

  it('does not apply a keyset filter on the first page', async () => {
    await getTasksPage('org-1', null, 50)

    const call = vi.mocked(db.task.findMany).mock.calls[0][0]
    expect(call?.where).toEqual({ project: { organizationId: 'org-1' } })
  })

  it('applies the (updatedAt, id) keyset condition when a cursor is present', async () => {
    const cursor = { updatedAt: new Date('2026-01-01T01:00:00Z'), id: 'task-42' }

    await getTasksPage('org-1', cursor, 50)

    const call = vi.mocked(db.task.findMany).mock.calls[0][0]
    expect(call?.where).toEqual({
      project: { organizationId: 'org-1' },
      OR: [
        { updatedAt: { lt: cursor.updatedAt } },
        { updatedAt: cursor.updatedAt, id: { lt: cursor.id } },
      ],
    })
  })

  it('returns a next cursor when there are more rows', async () => {
    const rows = Array.from({ length: 51 }, (_, index) => buildRow(index, 51 - index))
    vi.mocked(db.task.findMany).mockResolvedValue(rows as never)

    const result = await getTasksPage('org-1', null, 50)

    expect(result.tasks).toHaveLength(50)
    expect(result.pagination.hasNextPage).toBe(true)
    expect(result.pagination.nextCursor).toBeTruthy()

    const decoded = decodeTaskCursor(result.pagination.nextCursor ?? '')
    expect(decoded?.id).toBe('task-49')
  })

  it('handles an empty organization', async () => {
    vi.mocked(db.task.count).mockResolvedValue(0)
    vi.mocked(db.task.findMany).mockResolvedValue([] as never)

    const result = await getTasksPage('org-1', null, 50)

    expect(result.tasks).toEqual([])
    expect(result.pagination.totalPages).toBe(0)
    expect(result.pagination.hasNextPage).toBe(false)
  })

  it('rejects malformed cursors', () => {
    expect(decodeTaskCursor('not-a-cursor')).toBeNull()
    expect(decodeTaskCursor(Buffer.from('{"id":"missing-date"}').toString('base64url'))).toBeNull()
    expect(
      decodeTaskCursor(Buffer.from('{"id":"x","updatedAt":"not-a-date"}').toString('base64url'))
    ).toBeNull()
  })
})
