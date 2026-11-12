export default function DashboardLoading() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading dashboard" aria-busy="true">
      <span className="sr-only">Loading dashboard...</span>
      <div className="space-y-2">
        <div className="skeleton-shimmer h-8 w-40 rounded-md" />
        <div className="skeleton-shimmer h-4 w-64 rounded-md" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-lg border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="skeleton-shimmer h-5 w-28 rounded-md" />
              <div className="skeleton-shimmer h-5 w-12 rounded-full" />
            </div>
            <div className="skeleton-shimmer h-4 w-40 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  )
}
