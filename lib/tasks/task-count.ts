import { db } from '@/lib/db'
import type { TaskFilters } from '@/types/tasks'
import { buildTaskWhere, taskFilterKey } from './task-filters'

const TASK_COUNT_TTL_MS = 30_000
const MAX_TASK_COUNT_ENTRIES = 500
const taskCountCache = new Map<string, { count: number; expiresAt: number }>()

function pruneTaskCountCache(now: number): void {
  if (taskCountCache.size <= MAX_TASK_COUNT_ENTRIES) return

  taskCountCache.forEach((value, key) => {
    if (now >= value.expiresAt) taskCountCache.delete(key)
  })

  while (taskCountCache.size > MAX_TASK_COUNT_ENTRIES) {
    const oldestKey = taskCountCache.keys().next().value
    if (oldestKey === undefined) break
    taskCountCache.delete(oldestKey)
  }
}

export async function getTaskCount(
  organizationId: string,
  filters: TaskFilters
): Promise<number> {
  const key = taskFilterKey(organizationId, filters)
  const now = Date.now()
  pruneTaskCountCache(now)
  const cached = taskCountCache.get(key)
  if (cached && cached.expiresAt > now) return cached.count

  const count = await db.task.count({ where: buildTaskWhere(organizationId, filters) })
  taskCountCache.set(key, { count, expiresAt: now + TASK_COUNT_TTL_MS })
  return count
}

export function clearTaskCountCache(): void {
  taskCountCache.clear()
}
