export const TASK_PAGE_SIZE = 50

export type TaskStatus = 'todo' | 'in_progress' | 'done'

export type Task = {
  id: string
  title: string
  status: TaskStatus
  updatedAt: string
}

export type TasksPagination = {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  nextCursor?: string | null
  hasNextPage?: boolean
}

export type TasksResponse = {
  tasks: Task[]
  pagination: TasksPagination
}
