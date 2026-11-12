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
}

export type TasksResponse = {
  tasks: Task[]
  pagination: TasksPagination
}
