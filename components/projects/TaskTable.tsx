'use client'

import type { Task, TaskStatus } from '@/hooks/useTasks'

type TaskTableProps = {
  items: Task[]
  onStatusChange: (id: string, status: TaskStatus) => void
}

const STATUS_OPTIONS: Array<{ value: TaskStatus; label: string }> = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
]

function formatUpdatedAt(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
}

export function TaskTable({ items, onStatusChange }: TaskTableProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        No tasks found for this organization.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="border-b bg-muted/50 text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">ID</th>
            <th scope="col" className="px-4 py-3 font-medium">Title</th>
            <th scope="col" className="px-4 py-3 font-medium">Status</th>
            <th scope="col" className="px-4 py-3 font-medium">Updated At</th>
          </tr>
        </thead>
        <tbody>
          {items.map((task) => (
            <tr key={task.id} className="border-b last:border-0 hover:bg-accent/50">
              <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{task.id}</td>
              <td className="px-4 py-3 font-medium">{task.title}</td>
              <td className="px-4 py-3">
                <select
                  value={task.status}
                  aria-label={`Status for ${task.title}`}
                  onChange={(event) => onStatusChange(task.id, event.target.value as TaskStatus)}
                  className="rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{formatUpdatedAt(task.updatedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
