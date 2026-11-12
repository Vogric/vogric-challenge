export function TaskTableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading tasks" className="space-y-2">
      <span className="sr-only">Loading tasks...</span>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="skeleton-shimmer h-12 rounded-md" />
      ))}
    </div>
  )
}
