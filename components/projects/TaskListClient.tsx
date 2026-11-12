'use client'

import { useState } from 'react'
import { useTasks, useUpdateTaskStatus } from '@/hooks/useTasks'
import { TaskTable } from '@/components/projects/TaskTable'
import { TaskPagination } from '@/components/projects/TaskPagination'
import { TaskTableSkeleton } from '@/components/projects/TaskTableSkeleton'

const PAGE_SIZE = 50

type TaskListClientProps = {
  orgId: string
}

export function TaskListClient({ orgId }: TaskListClientProps) {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError } = useTasks(orgId, page, PAGE_SIZE)
  const { mutate: updateStatus, isPending } = useUpdateTaskStatus(orgId)

  if (isLoading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="skeleton-shimmer h-8 w-40 rounded-md" />
        <TaskTableSkeleton />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
        Could not load tasks. Please try again.
      </div>
    )
  }

  const tasks = data?.tasks ?? []
  const pagination = data?.pagination
  const totalPages = Math.max(1, pagination?.totalPages ?? 1)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Tasks</h1>
        <span className="text-xs font-medium tabular-nums text-muted-foreground">
          {pagination?.totalCount ?? tasks.length} task
          {(pagination?.totalCount ?? tasks.length) === 1 ? '' : 's'}
        </span>
      </div>

      <TaskTable
        items={tasks}
        onStatusChange={(id, status) => {
          updateStatus({ taskId: id, status })
        }}
      />

      <TaskPagination
        page={page}
        totalPages={totalPages}
        onPrevious={() => setPage((current) => Math.max(1, current - 1))}
        onNext={() => setPage((current) => Math.min(totalPages, current + 1))}
      />

      {isPending && <p className="text-sm text-muted-foreground">Updating task status...</p>}
    </div>
  )
}
