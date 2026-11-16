'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTasks, useUpdateTaskStatus } from '@/hooks/useTasks'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { TaskTable } from '@/components/projects/TaskTable'
import { TaskPagination } from '@/components/projects/TaskPagination'
import { TaskToolbar } from '@/components/projects/TaskToolbar'
import { TaskTableSkeleton } from '@/components/projects/TaskTableSkeleton'
import { TASK_PAGE_SIZE, type TaskFilters, type TaskStatus, type TasksResponse } from '@/types/tasks'

type ProjectOption = { id: string; name: string }

type TaskListClientProps = {
  orgId: string
  projects: ProjectOption[]
}

type TaskListView =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; data: TasksResponse }

export function TaskListClient({ orgId, projects }: TaskListClientProps) {
  const [page, setPage] = useState(1)
  const [cursor, setCursor] = useState<string | null>(null)
  const [cursorHistory, setCursorHistory] = useState<Array<string | null>>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<TaskStatus | ''>('')
  const [projectId, setProjectId] = useState('')
  const debouncedSearch = useDebouncedValue(search)

  const filters = useMemo<TaskFilters>(
    () => ({
      q: debouncedSearch || undefined,
      status: status || undefined,
      projectId: projectId || undefined,
    }),
    [debouncedSearch, status, projectId]
  )

  useEffect(() => {
    setCursor(null)
    setCursorHistory([])
    setPage(1)
  }, [debouncedSearch, status, projectId])

  const { data, isLoading, isError, isFetching } = useTasks(
    orgId,
    TASK_PAGE_SIZE,
    cursor,
    filters
  )
  const { mutate: updateStatus, isPending, variables } = useUpdateTaskStatus(orgId)
  const view: TaskListView = isLoading
    ? { status: 'loading' }
    : isError
      ? { status: 'error' }
      : data
        ? { status: 'success', data }
        : { status: 'loading' }

  const totalCount = view.status === 'success' ? view.data.pagination.totalCount : 0
  const pagination = view.status === 'success' ? view.data.pagination : null
  const totalPages = pagination ? Math.max(1, pagination.totalPages) : 1
  const hasNextPage = Boolean(pagination?.nextCursor)

  function goToNextPage() {
    if (!pagination?.nextCursor) return
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

  function clearFilters() {
    setSearch('')
    setStatus('')
    setProjectId('')
  }

  return (
    <div className="space-y-4" aria-busy={isFetching}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TaskToolbar
          search={search}
          status={status}
          projectId={projectId}
          projects={projects}
          onSearchChange={setSearch}
          onStatusChange={setStatus}
          onProjectChange={setProjectId}
          onClear={clearFilters}
        />
        <span className="ml-auto text-xs font-medium tabular-nums text-muted-foreground">
          {totalCount.toLocaleString('en-US')} task{totalCount === 1 ? '' : 's'}
        </span>
      </div>

      {view.status === 'loading' && <TaskTableSkeleton rows={TASK_PAGE_SIZE} />}

      {view.status === 'error' && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          Could not load tasks. Please try again.
        </div>
      )}

      {view.status === 'success' && (
        <>
          <TaskTable
            items={view.data.tasks}
            updatingTaskId={isPending ? variables?.taskId ?? null : null}
            onStatusChange={(id, nextStatus) => {
              updateStatus({ taskId: id, status: nextStatus })
            }}
          />

          <TaskPagination
            page={page}
            pageSize={TASK_PAGE_SIZE}
            totalCount={view.data.pagination.totalCount}
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
        </>
      )}
    </div>
  )
}
