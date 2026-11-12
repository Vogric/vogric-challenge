import type { Role } from '@prisma/client'

/** Roles allowed to mutate tasks. VIEWER is read-only. */
export const TASK_WRITE_ROLES: readonly Role[] = ['ADMIN', 'MANAGER']

export function canManageTasks(role: Role | null | undefined): boolean {
  return role === 'ADMIN' || role === 'MANAGER'
}
