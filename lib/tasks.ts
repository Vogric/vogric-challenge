import { db } from '@/lib/db'
import type { Task, TaskStatus, TasksResponse } from '@/types/tasks'

const TASK_COUNT_TTL_MS = 30_000
const taskCountCache = new Map<string, { count: number; expiresAt: number }>()

async function getTaskCount(organizationId: string): Promise<number> {
  const now = Date.now()
  const cached = taskCountCache.get(organizationId)
  if (cached && cached.expiresAt > now) return cached.count

  const count = await db.task.count({ where: { project: { organizationId } } })
  taskCountCache.set(organizationId, { count, expiresAt: now + TASK_COUNT_TTL_MS })
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
}

function serializeTask(task: CursorTaskRow): Task {
  return {
    id: task.id,
    title: task.title,
    // `status` is a Prisma enum, so this is a real assignment check and not a
    // cast: if the schema enum and the client union drift apart, `tsc` fails.
    status: task.status,
    updatedAt: task.updatedAt.toISOString(),
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

/**
 * Keyset (cursor) pagination — the only pagination path.
 *
 * There used to be a second offset-based implementation behind `?page=`, kept
 * "for API compatibility". It was never called by the client, it forced the
 * route handler to branch on which parameters arrived, and it made the response
 * shape ambiguous (`pagination.page` meant different things per branch). It is
 * gone: one algorithm, one contract.
 *
 * Ordering is `updatedAt DESC, id DESC` so the cursor is stable when several
 * tasks share the same `updatedAt` millisecond.
 */
export async function getTasksPage(
  organizationId: string,
  cursor: TaskCursor | null,
  pageSize: number
): Promise<TasksResponse> {
  const where = {
    project: { organizationId },
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
      select: { id: true, title: true, status: true, updatedAt: true },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: pageSize + 1,
    }),
    getTaskCount(organizationId),
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
