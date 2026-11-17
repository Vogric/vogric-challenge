import type { Task, TaskStatus } from '@/types/tasks'

export type TaskCursor = {
  updatedAt: Date
  id: string
}

export type CursorTaskRow = {
  id: string
  title: string
  status: TaskStatus
  updatedAt: Date
  project: { id: string; name: string }
  assignee: { name: string | null; email: string } | null
}

export function serializeTask(task: CursorTaskRow): Task {
  return {
    id: task.id,
    title: task.title,
    status: task.status,
    updatedAt: task.updatedAt.toISOString(),
    project: task.project,
    assignee: task.assignee,
  }
}

export function encodeTaskCursor(task: CursorTaskRow): string {
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
