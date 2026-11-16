import type { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import type { TaskFilters, Task, TaskStatus, TasksResponse } from '@/types/tasks'

const TASK_COUNT_TTL_MS = 30_000
const taskCountCache = new Map<string, { count: number; expiresAt: number }>()

function filterKey(organizationId: string, filters: TaskFilters): string {
  return [organizationId, filters.q ?? '', filters.status ?? '', filters.projectId ?? ''].join('|')
}

function buildWhere(organizationId: string, filters: TaskFilters): Prisma.TaskWhereInput {
  return {
    project: {
      organizationId,
      ...(filters.projectId ? { id: filters.projectId } : {}),
    },
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.q ? { title: { contains: filters.q, mode: 'insensitive' } } : {}),
  }
}

async function getTaskCount(organizationId: string, filters: TaskFilters): Promise<number> {
  const key = filterKey(organizationId, filters)
  const now = Date.now()
  const cached = taskCountCache.get(key)
  if (cached && cached.expiresAt > now) return cached.count

  const count = await db.task.count({ where: buildWhere(organizationId, filters) })
  taskCountCache.set(key, { count, expiresAt: now + TASK_COUNT_TTL_MS })
  return count
}

export function clearTaskCountCache(): void {
  taskCountCache.clear()
}

export type TaskCursor = {
  updatedAt: Date
  id: string
}

type CursorTaskRow = {
  id: string
  title: string
  status: TaskStatus
  updatedAt: Date
  project: { id: string; name: string }
  assignee: { name: string | null; email: string } | null
}

function serializeTask(task: CursorTaskRow): Task {
  return {
    id: task.id,
    title: task.title,
    status: task.status,
    updatedAt: task.updatedAt.toISOString(),
    project: task.project,
    assignee: task.assignee,
  }
}

function encodeTaskCursor(task: CursorTaskRow): string {
  return Buffer.from(JSON.stringify({ updatedAt: task.updatedAt.toISOString(), id: task.id }))
    .toString('base64url')
}

export function decodeTaskCursor(value: string): TaskCursor | null {
  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString()) as {
      updatedAt?: unknown
      id?: unknown
    }
    if (typeof parsed.updatedAt !== 'string' || typeof parsed.id !== 'string') return null

    const updatedAt = new Date(parsed.updatedAt)
    if (Number.isNaN(updatedAt.getTime()) || !parsed.id) return null

    return { updatedAt, id: parsed.id }
  } catch {
    return null
  }
}

export async function getTasksPage(
  organizationId: string,
  cursor: TaskCursor | null,
  pageSize: number,
  filters: TaskFilters = {}
): Promise<TasksResponse> {
  const baseWhere = buildWhere(organizationId, filters)
  const where: Prisma.TaskWhereInput = {
    ...baseWhere,
    ...(cursor
      ? {
          OR: [
            { updatedAt: { lt: cursor.updatedAt } },
            { updatedAt: cursor.updatedAt, id: { lt: cursor.id } },
          ],
        }
      : {}),
  }

  const [rows, totalCount] = await Promise.all([
    db.task.findMany({
      where,
      select: {
        id: true,
        title: true,
        status: true,
        updatedAt: true,
        project: { select: { id: true, name: true } },
        assignee: { select: { name: true, email: true } },
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: pageSize + 1,
    }),
    getTaskCount(organizationId, filters),
  ])

  const hasNextPage = rows.length > pageSize
  const pageRows = hasNextPage ? rows.slice(0, pageSize) : rows
  const lastRow = pageRows[pageRows.length - 1]

  return {
    tasks: pageRows.map(serializeTask),
    pagination: {
      pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      nextCursor: hasNextPage && lastRow ? encodeTaskCursor(lastRow) : null,
      hasNextPage,
    },
  }
}
