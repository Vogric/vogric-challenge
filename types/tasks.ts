/**
 * Kept as a stable import path for components. The actual contract lives in
 * `lib/validations/tasks.ts` so the runtime schema and the static type cannot
 * drift apart.
 */
export const TASK_PAGE_SIZE = 50

export type { Task, TaskStatus, TasksPagination, TasksResponse } from '@/lib/validations/tasks'
