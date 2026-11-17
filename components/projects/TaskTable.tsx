'use client'

import { ChevronDown } from 'lucide-react'
import type { Task, TaskStatus } from '@/types/tasks'
import { formatRelativeTime } from '@/lib/format-relative-time'

type TaskTableProps = {
  items: Task[]
  updatingTaskId?: string | null
  onStatusChange: (id: string, status: TaskStatus) => void
}

const STATUS_OPTIONS: Array<{ value: TaskStatus; label: string }> = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
]

const STATUS_STYLES: Record<TaskStatus, string> = {
  todo: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200',
  in_progress:
    'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-300',
  done: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300',
}

function isTaskStatus(value: string): value is TaskStatus {
  return value === 'todo' || value === 'in_progress' || value === 'done'
}

export function TaskTable({ items, updatingTaskId, onStatusChange }: TaskTableProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
        No tasks match these filters.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-[0_1px_2px_rgba(16,24,40,0.06),0_1px_3px_rgba(16,24,40,0.08)]">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="border-b bg-muted/40 text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
          <tr>
            <th scope="col" className="px-5 py-3 font-semibold">Task</th>
            <th scope="col" className="hidden px-5 py-3 font-semibold md:table-cell">Project</th>
            <th scope="col" className="px-5 py-3 font-semibold">Status</th>
            <th scope="col" className="hidden px-5 py-3 font-semibold lg:table-cell">Assignee</th>
            <th scope="col" className="px-5 py-3 text-right font-semibold">Updated</th>
          </tr>
        </thead>
        <tbody>
          {items.map((task) => (
            <tr
              key={task.id}
              aria-busy={updatingTaskId === task.id}
              className={`border-b transition-colors duration-150 last:border-0 hover:bg-muted/40 ${
                updatingTaskId === task.id ? 'opacity-60' : ''
              }`}
            >
              <td className="max-w-[320px] px-5 py-3.5">
                <p className="truncate font-medium text-foreground">{task.title}</p>
                <p className="mt-0.5 font-mono text-[10px] text-muted-foreground md:hidden">
                  {task.project.name}
                </p>
              </td>
              <td className="hidden px-5 py-3.5 text-muted-foreground md:table-cell">
                {task.project.name}
              </td>
              <td className="px-5 py-3.5">
                <span
                  className={`relative inline-flex items-center rounded-full border ${STATUS_STYLES[task.status]}`}
                >
                  <select
                    value={task.status}
                    disabled={updatingTaskId === task.id}
                    aria-label={`Status for ${task.title}`}
                    onChange={(event) => {
                      const nextStatus = event.target.value
                      if (isTaskStatus(nextStatus) && nextStatus !== task.status) {
                        onStatusChange(task.id, nextStatus)
                      }
                    }}
                    className="cursor-pointer appearance-none bg-transparent py-1 pl-2.5 pr-7 text-xs font-medium outline-none disabled:cursor-not-allowed"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value} className="text-foreground">
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 h-3 w-3 opacity-70" aria-hidden="true" />
                </span>
              </td>
              <td className="hidden px-5 py-3.5 lg:table-cell">
                {task.assignee ? (
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[9px] font-semibold text-foreground">
                      {(task.assignee.name ?? task.assignee.email).slice(0, 2).toUpperCase()}
                    </span>
                    <span className="text-muted-foreground">{task.assignee.name ?? task.assignee.email}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Unassigned</span>
                )}
              </td>
              <td className="whitespace-nowrap px-5 py-3.5 text-right text-xs text-muted-foreground">
                <time
                  dateTime={task.updatedAt}
                  title={task.updatedAt}
                  suppressHydrationWarning
                >
                  {formatRelativeTime(task.updatedAt)}
                </time>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
