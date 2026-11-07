'use client'

import { useTasks, useUpdateTaskStatus } from '@/hooks/useTasks'
import { VirtualizedTable } from '@/components/projects/VirtualizedTable'

type TaskListClientProps = {
  orgId: string
}

export function TaskListClient({ orgId }: TaskListClientProps) {
  const { data: tasks, isLoading } = useTasks(orgId)
  const { mutate: updateStatus, isPending } = useUpdateTaskStatus()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading tasks...</p>
      </div>
    )
  }

  if (!tasks) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tasks</h1>
        <span className="text-xs font-medium text-muted-foreground">
          {tasks.length} task{s(tasks.length)}
        </span>
      </div>
      <VirtualizedTable
        items={tasks}
        onStatusChange={(id, status) => {
          updateStatus({ taskId: id, status })
        }}
      />
      {isPending && (
        <p className="text-sm text-muted-foreground">Updating task status...</p>
      )}
    </div>
  )
}

function s(count: number): string {
  return count === 1 ? '' : 's'
}
