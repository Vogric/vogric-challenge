export function StatsFallback() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true">
      {[0, 1, 2, 3].map((index) => (
        <div key={index} className="skeleton-shimmer h-[104px] rounded-lg border border-border" />
      ))}
    </div>
  )
}

export function SectionsFallback() {
  return (
    <div className="grid gap-6 lg:grid-cols-3" aria-busy="true">
      {[0, 1, 2].map((index) => (
        <div key={index} className="skeleton-shimmer h-[300px] rounded-xl border border-border" />
      ))}
    </div>
  )
}
