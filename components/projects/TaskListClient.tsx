'use client'

import { useState } from 'react'
import { useTasks, useUpdateTaskStatus } from '@/hooks/useTasks'
import { TaskTable } from '@/components/projects/TaskTable'
import { TaskPagination } from '@/components/projects/TaskPagination'
import { TaskTableSkeleton } from '@/components/projects/TaskTableSkeleton'
import { TASK_PAGE_SIZE, type TasksResponse } from '@/types/tasks'


type TaskListClientProps = {
  orgId: string
}

type TaskListView =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; data: TasksResponse }

export function TaskListClient({ orgId }: TaskListClientProps) {
  const [page, setPage] = useState(1)
  const [cursor, setCursor] = useState<string | null>(null)
  const [cursorHistory, setCursorHistory] = useState<Array<string | null>>([])
  const { data, isLoading, isError, isFetching } = useTasks(orgId, TASK_PAGE_SIZE, cursor)
  const { mutate: updateStatus, isPending, variables } = useUpdateTaskStatus(orgId)
  const view: TaskListView = isLoading
    ? { status: 'loading' }
    : isError
      ? { status: 'error' }
      : data
        ? { status: 'success', data }
        : { status: 'loading' }

  if (view.status === 'loading') {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold tracking-tight">Tasks</h2>
          <span className="skeleton-shimmer h-4 w-24 rounded-md" />
        </div>
        <TaskTableSkeleton rows={TASK_PAGE_SIZE} />
      </div>
    )
  }

  if (view.status === 'error') {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
        Could not load tasks. Please try again.
      </div>
    )
  }

  const { tasks, pagination } = view.data
  const totalPages = Math.max(1, pagination.totalPages)
  const hasNextPage = Boolean(pagination.nextCursor)

  function goToNextPage() {
    if (!pagination.nextCursor) return
    setCursorHistory((history) => [...history, cursor])
    setCursor(pagination.nextCursor)
    setPage((current) => current + 1)
  }

  function goToPreviousPage() {
    if (cursorHistory.length === 0) return
    const previousCursor = cursorHistory[cursorHistory.length - 1]
    setCursorHistory((history) => history.slice(0, -1))
    setCursor(previousCursor)
    setPage((current) => Math.max(1, current - 1))
  }

  return (
    <div className="space-y-4" aria-busy={isFetching}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold">Tasks</h2>
        <span className="text-xs font-medium tabular-nums text-muted-foreground">
          {pagination.totalCount} task
          {pagination.totalCount === 1 ? '' : 's'}
        </span>
      </div>

      <TaskTable
        items={tasks}
        updatingTaskId={isPending ? variables?.taskId ?? null : null}
        onStatusChange={(id, status) => {
          updateStatus({ taskId: id, status })
        }}
      />

      <TaskPagination
        page={page}
        totalPages={totalPages}
        hasPreviousPage={cursorHistory.length > 0}
        hasNextPage={hasNextPage}
        onPrevious={goToPreviousPage}
        onNext={goToNextPage}
      />

      {isPending && (
        <p role="status" className="text-sm text-muted-foreground">
          Updating task status...
        </p>
      )}
    </div>
  )
}
