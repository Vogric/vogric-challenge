import type { MembershipSummary } from '@/types/organizations'
import { initials } from '@/lib/utils'

export type Member = {
  id: string
  role: MembershipSummary['role']
  createdAt: string
  user: {
    id: string
    email: string
    name: string | null
  }
}

export const ROLE_OPTIONS: Array<{ value: MembershipSummary['role']; label: string }> = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'VIEWER', label: 'Viewer' },
]

export const ROLE_META: Record<
  MembershipSummary['role'],
  { label: string; description: string; select: string; avatar: string }
> = {
  ADMIN: {
    label: 'Admin',
    description: 'Full workspace access',
    select: 'border-primary/25 bg-primary/10 text-blue-700 dark:text-blue-300',
    avatar: 'bg-primary text-primary-foreground',
  },
  MANAGER: {
    label: 'Manager',
    description: 'Can manage tasks',
    select: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-300',
    avatar: 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
  },
  VIEWER: {
    label: 'Viewer',
    description: 'Read-only access',
    select: 'border-border bg-muted text-foreground',
    avatar: 'bg-muted text-foreground',
  },
}

export function memberInitials(member: Member): string {
  return initials(member.user.name, member.user.email)
}
