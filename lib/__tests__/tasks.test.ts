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
import {
  clearTaskCountCache,
  decodeTaskCursor,
  getTasksCursorPage,
  getTasksPage,
} from '@/lib/tasks'

describe('getTasksPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearTaskCountCache()
    vi.mocked(db.task.count).mockResolvedValue(120)
    vi.mocked(db.task.findMany).mockResolvedValue([
      {
        id: 'task-1',
        title: 'Task 1',
        status: 'todo',
        projectId: 'project-1',
        assigneeId: null,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z'),
      },
    ])
  })

  it('returns serialized tasks and pagination', async () => {
    const result = await getTasksPage('org-1', 2, 50)

    expect(result.tasks).toEqual([
      { id: 'task-1', title: 'Task 1', status: 'todo', updatedAt: '2026-01-01T00:00:00.000Z' },
    ])
    expect(result.pagination).toEqual({
      page: 2,
      pageSize: 50,
      totalCount: 120,
      totalPages: 3,
    })
    expect(db.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 50, take: 50 })
    )
  })

  it('handles an empty page', async () => {
    vi.mocked(db.task.count).mockResolvedValue(0)
    vi.mocked(db.task.findMany).mockResolvedValue([])

    const result = await getTasksPage('org-1', 1, 50)
    expect(result.tasks).toEqual([])
    expect(result.pagination.totalPages).toBe(0)
  })

  it('returns a next cursor when there are more rows', async () => {
    const rows = Array.from({ length: 51 }, (_, index) => ({
      id: `task-${index}`,
      title: `Task ${index}`,
      status: 'todo' as const,
      projectId: 'project-1',
      assigneeId: null,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date(Date.UTC(2026, 0, 1, 0, 51 - index, 0)),
    }))
    vi.mocked(db.task.findMany).mockResolvedValue(rows)

    const result = await getTasksCursorPage('org-1', null, 1, 50)
    expect(result.tasks).toHaveLength(50)
    expect(result.pagination.hasNextPage).toBe(true)
    expect(result.pagination.nextCursor).toBeTruthy()

    const decoded = decodeTaskCursor(result.pagination.nextCursor ?? '')
    expect(decoded?.id).toBe('task-49')
  })

  it('rejects malformed cursors', () => {
    expect(decodeTaskCursor('not-a-cursor')).toBeNull()
    expect(decodeTaskCursor(Buffer.from('{"id":"missing-date"}').toString('base64url'))).toBeNull()
  })
})
