type TaskPaginationProps = {
  page: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
  onPrevious: () => void
  onNext: () => void
}

export function TaskPagination({
  page,
  totalPages,
  hasPreviousPage,
  hasNextPage,
  onPrevious,
  onNext,
}: TaskPaginationProps) {
  if (!hasPreviousPage && !hasNextPage) return null

  return (
    <nav className="flex items-center justify-between gap-3" aria-label="Tasks pagination">
      <button
        type="button"
        onClick={onPrevious}
        disabled={!hasPreviousPage}
        className="rounded-md border border-border px-3 py-1.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
      >
        Previous
      </button>
      <span className="text-sm text-muted-foreground" aria-live="polite">
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        onClick={onNext}
        disabled={!hasNextPage}
        className="rounded-md border border-border px-3 py-1.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next
      </button>
    </nav>
  )
}
