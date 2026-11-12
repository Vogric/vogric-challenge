import type { Role } from '@prisma/client'

export function canManageTasks(role: Role | null | undefined): boolean {
  return role === 'ADMIN' || role === 'MANAGER'
}
