export default function ProjectsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 rounded bg-muted"></div>
      <div className="h-6 w-32 rounded bg-muted"></div>
      <div className="h-96 rounded-lg border border-border bg-card shadow-sm">
        <div className="h-8 w-full rounded bg-muted mx-4 my-2"></div>
        <div className="h-8 w-3/4 rounded bg-muted mx-4 my-2"></div>
      </div>
    </div>
  )
}
