export const taskKeys = {
  all: ['tasks'] as const,
  byOrg: (orgId: string) => ['tasks', orgId] as const,
  list: (orgId: string | null, page: number, pageSize: number) =>
    ['tasks', orgId, page, pageSize] as const,
}
