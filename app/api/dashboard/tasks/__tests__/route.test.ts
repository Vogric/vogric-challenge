import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/auth', () => ({
  getCurrentUserFromRequest: vi.fn(),
}))

vi.mock('@/lib/db', () => {
  type MockDb = {
    membership: { findFirst: ReturnType<typeof vi.fn> }
    task: { findUnique: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> }
    auditEvent: { create: ReturnType<typeof vi.fn> }
    $transaction: (operation: (tx: MockDb) => unknown) => Promise<unknown>
  }
  const db: MockDb = {
    membership: { findFirst: vi.fn() },
    task: { findUnique: vi.fn(), update: vi.fn() },
    auditEvent: { create: vi.fn() },
    $transaction: vi.fn(async (operation: (tx: MockDb) => unknown) => operation(db)),
  }
  return { db }
})

vi.mock('@/lib/tasks/get-tasks-page', () => ({
  getTasksPage: vi.fn(),
}))

vi.mock('@/lib/tasks/task-cursor', () => ({
  decodeTaskCursor: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
}))

import { revalidateTag } from 'next/cache'
import { getCurrentUserFromRequest } from '@/lib/auth'
import { db } from '@/lib/db'
import { decodeTaskCursor } from '@/lib/tasks/task-cursor'
import { getTasksPage } from '@/lib/tasks/get-tasks-page'
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

  it('passes validated search, status, and project filters to the data layer', async () => {
    vi.mocked(db.membership.findFirst).mockResolvedValue({ id: 'm1' } as never)
    vi.mocked(decodeTaskCursor).mockReturnValue(null as never)
    vi.mocked(getTasksPage).mockResolvedValue({
      tasks: [],
      pagination: { pageSize: 50, totalCount: 0, totalPages: 0, nextCursor: null, hasNextPage: false },
    })

    const response = await GET(
      listRequest('orgId=org-1&q=api&status=done&projectId=project-1')
    )

    expect(response.status).toBe(200)
    expect(getTasksPage).toHaveBeenCalledWith('org-1', null, 50, {
      q: 'api',
      status: 'done',
      projectId: 'project-1',
    })
  })

  it('rejects an unknown task status before touching the data layer', async () => {
    vi.mocked(db.membership.findFirst).mockResolvedValue({ id: 'm1' } as never)

    const response = await GET(listRequest('orgId=org-1&status=blocked'))

    expect(response.status).toBe(400)
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
    expect(getTasksPage).toHaveBeenCalledWith('org-1', null, 50, {
      q: undefined,
      status: undefined,
      projectId: undefined,
    })
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

  it('does not write an audit event when the status is unchanged', async () => {
    vi.mocked(db.task.findUnique).mockResolvedValue(existingTask as never)
    vi.mocked(db.membership.findFirst).mockResolvedValue({ role: 'ADMIN' } as never)

    const response = await PATCH(patchRequest({ status: 'todo' }), params('task-1'))

    expect(response.status).toBe(200)
    expect(db.task.update).not.toHaveBeenCalled()
    expect(db.auditEvent.create).not.toHaveBeenCalled()
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
    expect(db.$transaction).toHaveBeenCalledTimes(1)
    expect(db.task.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'done' } })
    )
    expect(db.auditEvent.create).toHaveBeenCalledTimes(1)
    expect(revalidateTag).toHaveBeenCalledWith('org-stats')
  })
})
