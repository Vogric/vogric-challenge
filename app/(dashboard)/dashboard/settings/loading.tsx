export default function SettingsLoading() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading settings" aria-busy="true">
      <span className="sr-only">Loading settings...</span>
      <div className="skeleton-shimmer h-8 w-40 rounded-md" />
      <div className="grid gap-6 md:grid-cols-2">
        <div className="skeleton-shimmer h-52 rounded-lg" />
        <div className="skeleton-shimmer h-52 rounded-lg" />
      </div>
    </div>
  )
}
