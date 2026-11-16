'use client'

import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { TaskStatus } from '@/types/tasks'

type ProjectOption = { id: string; name: string }

type TaskToolbarProps = {
  search: string
  status: TaskStatus | ''
  projectId: string
  projects: ProjectOption[]
  onSearchChange: (value: string) => void
  onStatusChange: (value: TaskStatus | '') => void
  onProjectChange: (value: string) => void
  onClear: () => void
}

export function TaskToolbar({
  search,
  status,
  projectId,
  projects,
  onSearchChange,
  onStatusChange,
  onProjectChange,
  onClear,
}: TaskToolbarProps) {
  const hasFilters = Boolean(search || status || projectId)

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-full sm:w-[280px]">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search tasks..."
          aria-label="Search tasks"
          className="h-9 pl-9"
        />
      </div>

      <select
        value={status}
        onChange={(event) => onStatusChange(event.target.value as TaskStatus | '')}
        aria-label="Filter by status"
        className="h-9 rounded-[10px] border border-input bg-card px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
      >
        <option value="">All statuses</option>
        <option value="todo">To Do</option>
        <option value="in_progress">In Progress</option>
        <option value="done">Done</option>
      </select>

      <select
        value={projectId}
        onChange={(event) => onProjectChange(event.target.value)}
        aria-label="Filter by project"
        className="h-9 max-w-[220px] rounded-[10px] border border-input bg-card px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
      >
        <option value="">All projects</option>
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name}
          </option>
        ))}
      </select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={onClear} className="h-9 gap-1.5">
          <X className="h-3.5 w-3.5" aria-hidden="true" />
          Clear
        </Button>
      )}
    </div>
  )
}
