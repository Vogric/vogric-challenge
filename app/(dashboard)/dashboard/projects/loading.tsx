import { TaskTableSkeleton } from '@/components/projects/TaskTableSkeleton'

export default function ProjectsLoading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
        <p className="text-sm text-muted-foreground">Loading organization...</p>
      </div>
      <TaskTableSkeleton rows={50} />
    </div>
  )
}
