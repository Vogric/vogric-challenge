export const authKeys = {
  currentUser: ['currentUser'] as const,
}

export const taskKeys = {
  all: ['tasks'] as const,
  byOrg: (orgId: string) => ['tasks', orgId] as const,
  /**
   * Cursor-only cache key. The server never receives a page number, so page
   * must not participate in the key.
   */
  cursor: (
    orgId: string | null,
    cursor: string | null,
    filters: { q?: string | undefined; status?: string | undefined; projectId?: string | undefined } = {}
  ) => ['tasks', orgId, 'cursor', cursor, filters.q ?? '', filters.status ?? '', filters.projectId ?? ''] as const,
}
