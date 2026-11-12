export const authKeys = {
  currentUser: ['currentUser'] as const,
}

export const taskKeys = {
  all: ['tasks'] as const,
  byOrg: (orgId: string) => ['tasks', orgId] as const,
  list: (orgId: string | null, page: number, pageSize: number) =>
    ['tasks', orgId, page, pageSize] as const,
  cursor: (orgId: string | null, cursor: string | null, page: number) =>
    ['tasks', orgId, 'cursor', cursor, page] as const,
}
