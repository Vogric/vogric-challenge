export const authKeys = {
  currentUser: ['currentUser'] as const,
}

export const taskKeys = {
  all: ['tasks'] as const,
  byOrg: (orgId: string) => ['tasks', orgId] as const,
  /**
   * Cursor-only cache key. `page` used to be part of this key even though the
   * server never received it, so "Previous" produced a brand-new key and
   * refetched a page that was already cached.
   */
  cursor: (orgId: string | null, cursor: string | null) =>
    ['tasks', orgId, 'cursor', cursor] as const,
}
