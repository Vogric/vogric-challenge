import type { Prisma } from '@prisma/client'
import type { TaskFilters } from '@/types/tasks'

export function taskFilterKey(organizationId: string, filters: TaskFilters): string {
  return [organizationId, filters.q ?? '', filters.status ?? '', filters.projectId ?? ''].join('|')
}

export function buildTaskWhere(
  organizationId: string,
  filters: TaskFilters
): Prisma.TaskWhereInput {
  return {
    project: {
      organizationId,
      ...(filters.projectId ? { id: filters.projectId } : {}),
    },
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.q ? { title: { contains: filters.q, mode: 'insensitive' } } : {}),
  }
}
