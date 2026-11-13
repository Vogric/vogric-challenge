import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/auth', () => ({
  getCurrentUserFromRequest: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  db: {
    membership: { findFirst: vi.fn() },
    task: { findUnique: vi.fn(), update: vi.fn() },
  },
}))

vi.mock('@/lib/tasks', () => ({
  getTasksPage: vi.fn(),
  decodeTaskCursor: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
}))

import { revalidateTag } from 'next/cache'
import { getCurrentUserFromRequest } from '@/lib/auth'
import { db } from '@/lib/db'
import { decodeTaskCursor, getTasksPage } from '@/lib/tasks'
import { GET } from '@/app/api/dashboard/tasks/route'
import { PATCH } from '@/app/api/dashboard/tasks/[id]/route'

const user = { id: 'user-1', email: 'demo@example.com', name: 'Demo' }

function listRequest(query: string) {
  return new Request(`http://localhost/api/dashboard/tasks?${query}`)
}

function patchRequest(body: unknown) {
  return new Request('http://localhost/api/dashboard/tasks/task-1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function params(id: string) {
  return { params: Promise.resolve({ id }) }
}

describe('GET /api/dashboard/tasks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getCurrentUserFromRequest).mockResolvedValue(user as never)
  })

  it('rejects an anonymous request', async () => {
    vi.mocked(getCurrentUserFromRequest).mockResolvedValue(null as never)

    const response = await GET(listRequest('orgId=org-1'))

    expect(response.status).toBe(401)
    expect(getTasksPage).not.toHaveBeenCalled()
  })

  it('rejects a request without orgId', async () => {
    const response = await GET(listRequest(''))

    expect(response.status).toBe(400)
    expect(getTasksPage).not.toHaveBeenCalled()
  })

  it('rejects a membership the user does not have', async () => {
    vi.mocked(db.membership.findFirst).mockResolvedValue(null as never)

    const response = await GET(listRequest('orgId=org-1'))

    expect(response.status).toBe(403)
    expect(getTasksPage).not.toHaveBeenCalled()
  })

  it('rejects a malformed cursor before touching the data layer', async () => {
    vi.mocked(db.membership.findFirst).mockResolvedValue({ id: 'm1' } as never)
    vi.mocked(decodeTaskCursor).mockReturnValue(null as never)

    const response = await GET(listRequest('orgId=org-1&cursor=broken'))

    expect(response.status).toBe(400)
    expect(getTasksPage).not.toHaveBeenCalled()
  })

  it('returns the page for a member and never caches tenant data', async () => {
    vi.mocked(db.membership.findFirst).mockResolvedValue({ id: 'm1' } as never)
    vi.mocked(decodeTaskCursor).mockReturnValue(null as never)
    vi.mocked(getTasksPage).mockResolvedValue({
      tasks: [],
      pagination: { pageSize: 50, totalCount: 0, totalPages: 0, nextCursor: null, hasNextPage: false },
    })

    const response = await GET(listRequest('orgId=org-1'))

    expect(response.status).toBe(200)
    expect(getTasksPage).toHaveBeenCalledWith('org-1', null, 50)
    expect(response.headers.get('Cache-Control')).toContain('no-store')
  })
})

describe('PATCH /api/dashboard/tasks/[id]', () => {
  const existingTask = {
    id: 'task-1',
    status: 'todo',
    title: 'Task 1',
    updatedAt: new Date(),
    project: { organizationId: 'org-1' },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getCurrentUserFromRequest).mockResolvedValue(user as never)
  })

  it('rejects an anonymous request', async () => {
    vi.mocked(getCurrentUserFromRequest).mockResolvedValue(null as never)

    const response = await PATCH(patchRequest({ status: 'done' }), params('task-1'))

    expect(response.status).toBe(401)
    expect(db.task.update).not.toHaveBeenCalled()
  })

  it('rejects an unknown status value', async () => {
    const response = await PATCH(patchRequest({ status: 'archived' }), params('task-1'))

    expect(response.status).toBe(400)
    expect(db.task.update).not.toHaveBeenCalled()
  })

  it('returns 404 for a task from another organization', async () => {
    vi.mocked(db.task.findUnique).mockResolvedValue(null as never)

    const response = await PATCH(patchRequest({ status: 'done' }), params('task-1'))

    expect(response.status).toBe(404)
    expect(db.task.update).not.toHaveBeenCalled()
  })

  it('rejects a VIEWER of the owning organization', async () => {
    vi.mocked(db.task.findUnique).mockResolvedValue(existingTask as never)
    vi.mocked(db.membership.findFirst).mockResolvedValue({ role: 'VIEWER' } as never)

    const response = await PATCH(patchRequest({ status: 'done' }), params('task-1'))

    expect(response.status).toBe(403)
    expect(db.task.update).not.toHaveBeenCalled()
  })

  it('allows a MANAGER and invalidates the KPI cache', async () => {
    vi.mocked(db.task.findUnique).mockResolvedValue(existingTask as never)
    vi.mocked(db.membership.findFirst).mockResolvedValue({ role: 'MANAGER' } as never)
    vi.mocked(db.task.update).mockResolvedValue({
      id: 'task-1',
      status: 'done',
      title: 'Task 1',
      updatedAt: new Date(),
    } as never)

    const response = await PATCH(patchRequest({ status: 'done' }), params('task-1'))

    expect(response.status).toBe(200)
    expect(db.task.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'done' } })
    )
    expect(revalidateTag).toHaveBeenCalledWith('org-stats')
  })
})
