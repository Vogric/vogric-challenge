export default function MembersLoading() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading members" aria-busy="true">
      <span className="sr-only">Loading members...</span>
      <div className="skeleton-shimmer h-8 w-48 rounded-md" />
      <div className="skeleton-shimmer h-4 w-72 rounded-md" />
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="skeleton-shimmer h-14 rounded-md" />
        ))}
      </div>
    </div>
  )
}
