'use client'

import { useState } from 'react'

type PaginationState = {
  signature: string
  cursor: string | null
  history: Array<string | null>
  page: number
}

export function useTaskPagination(filterSignature: string) {
  const [pagination, setPagination] = useState<PaginationState>(() => ({
    signature: filterSignature,
    cursor: null,
    history: [],
    page: 1,
  }))

  // Derive the visible cursor from the current filters instead of resetting it
  // in an effect. This avoids issuing one request with the old cursor under the
  // new filters, followed by a second reset request.
  const activePagination: PaginationState =
    pagination.signature === filterSignature
      ? pagination
      : { signature: filterSignature, cursor: null, history: [], page: 1 }

  function goToNextPage(nextCursor: string | null) {
    if (!nextCursor) return
    setPagination({
      signature: filterSignature,
      cursor: nextCursor,
      history: [...activePagination.history, activePagination.cursor],
      page: activePagination.page + 1,
    })
  }

  function goToPreviousPage() {
    if (activePagination.history.length === 0) return
    const previousCursor = activePagination.history[activePagination.history.length - 1]
    setPagination({
      signature: filterSignature,
      cursor: previousCursor,
      history: activePagination.history.slice(0, -1),
      page: Math.max(1, activePagination.page - 1),
    })
  }

  return { activePagination, goToNextPage, goToPreviousPage }
}
