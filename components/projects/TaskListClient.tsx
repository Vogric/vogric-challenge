'use client'

import { useState } from 'react'
import { useTasks, useUpdateTaskStatus } from '@/hooks/useTasks'
import { VirtualizedTable } from '@/components/projects/VirtualizedTable'

const PAGE_SIZE = 50

type TaskListClientProps = {
  orgId: string
}

export function TaskListClient({ orgId }: TaskListClientProps) {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, error } = useTasks(orgId, page, PAGE_SIZE)
  const { mutate: updateStatus, isPending } = useUpdateTaskStatus(orgId)

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Loading tasks...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
        Could not load tasks: {error instanceof Error ? error.message : 'unknown error'}
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
        <span className="text-xs font-medium text-muted-foreground">
          {pagination?.totalCount ?? tasks.length} task
          {(pagination?.totalCount ?? tasks.length) === 1 ? '' : 's'}
        </span>
      </div>

      <VirtualizedTable
        items={tasks}
        onStatusChange={(id, status) => {
          updateStatus({ taskId: id, status })
        }}
      />

      {pagination && pagination.totalPages > 1 && (
        <nav className="flex items-center justify-between gap-3" aria-label="Tasks pagination">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1}
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={page >= totalPages}
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </nav>
      )}

      {isPending && <p className="text-sm text-muted-foreground">Updating task status...</p>}
    </div>
  )
}
