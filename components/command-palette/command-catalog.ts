import { FolderKanban, History, LayoutDashboard, Settings, Users } from 'lucide-react'
import type { Command } from './command'

const BASE_COMMANDS: Command[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'Workspace overview and operational metrics',
    href: '/dashboard',
    icon: LayoutDashboard,
    keywords: 'home overview metrics kpi',
  },
  {
    id: 'projects',
    label: 'Projects',
    description: 'Browse and filter every task',
    href: '/dashboard/projects',
    icon: FolderKanban,
    keywords: 'tasks work items projects filters',
  },
  {
    id: 'team',
    label: 'Team',
    description: 'Members, roles, and access',
    href: '/dashboard/members',
    icon: Users,
    keywords: 'members people roles permissions',
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Account, workspace, and security',
    href: '/dashboard/settings',
    icon: Settings,
    keywords: 'profile organization security account',
  },
]

const AUDIT_COMMAND: Command = {
  id: 'audit',
  label: 'Audit log',
  description: 'Tenant-scoped change history',
  href: '/dashboard/audit',
  icon: History,
  keywords: 'events history security activity',
}

export function getCommands(canViewAudit: boolean): Command[] {
  return canViewAudit ? [...BASE_COMMANDS, AUDIT_COMMAND] : BASE_COMMANDS
}
