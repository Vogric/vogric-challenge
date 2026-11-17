type TaskPaginationProps = {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
  onPrevious: () => void
  onNext: () => void
}

export function TaskPagination({
  page,
  pageSize,
  totalCount,
  totalPages,
  hasPreviousPage,
  hasNextPage,
  onPrevious,
  onNext,
}: TaskPaginationProps) {
  if (totalCount === 0) return null

  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalCount)

  return (
    <nav className="flex flex-wrap items-center justify-between gap-3" aria-label="Tasks pagination">
      <p className="text-xs tabular-nums text-muted-foreground" aria-live="polite">
        Showing {start}–{end} of {totalCount}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrevious}
          disabled={!hasPreviousPage}
          className="h-8 rounded-lg border border-border bg-card px-3 text-xs font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>
        <span className="min-w-[72px] text-center text-xs text-muted-foreground">
          Page {page} of {Math.max(1, totalPages)}
        </span>
        <button
          type="button"
          onClick={onNext}
          disabled={!hasNextPage}
          className="h-8 rounded-lg border border-border bg-card px-3 text-xs font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </nav>
  )
}
