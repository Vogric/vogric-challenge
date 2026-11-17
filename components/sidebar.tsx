'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FolderKanban, Users, Settings, LogOut, History } from 'lucide-react'
import { useLogout } from '@/hooks/useLogout'
import { useAuth } from '@/hooks/useAuth'
import { OrganizationSwitcher } from '@/components/organizations/organization-switcher'
import { initials } from '@/lib/utils'
import type { MembershipSummary } from '@/types/organizations'

const NAV_ITEMS = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Projects', href: '/dashboard/projects', icon: FolderKanban },
  { name: 'Team', href: '/dashboard/members', icon: Users },
  { name: 'Audit', href: '/dashboard/audit', icon: History },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

type SidebarProps = {
  memberships: MembershipSummary[]
  activeOrganizationId: string | null
}

export function Sidebar({ memberships, activeOrganizationId }: SidebarProps) {
  const pathname = usePathname()
  const { logout, isPending: isLoggingOut } = useLogout()
  const { user } = useAuth()
  const activeRole = memberships.find(
    (membership) => membership.organizationId === activeOrganizationId
  )?.role
  const navItems = activeRole === 'ADMIN' ? NAV_ITEMS : NAV_ITEMS.filter((item) => item.name !== 'Audit')

  return (
    <aside className="hidden w-[260px] flex-shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
      <div className="flex h-16 items-center gap-3 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary text-sm font-bold text-primary-foreground shadow-sm">
          V
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight">Vogric</p>
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-sidebar-muted">
            Operations
          </p>
        </div>
      </div>

      <div className="px-3 pb-4">
        <OrganizationSwitcher
          memberships={memberships}
          activeOrganizationId={activeOrganizationId}
          tone="dark"
        />
      </div>

      <nav className="flex-1 space-y-0.5 px-3" aria-label="Primary navigation">
        {navItems.map((item) => {
          const isActive =
            item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href)

          return (
            <Link
              key={item.name}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white/[0.08] text-sidebar-foreground'
                  : 'text-sidebar-muted hover:bg-white/[0.05] hover:text-sidebar-foreground'
              }`}
            >
              {isActive && (
                <span className="absolute left-0 h-5 w-0.5 rounded-r-full bg-primary" aria-hidden="true" />
              )}
              <item.icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-[10px] px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-[11px] font-semibold text-sidebar-foreground">
            {initials(user?.name, user?.email)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-sidebar-foreground">{user?.name ?? 'Demo user'}</p>
            <p className="truncate text-[11px] text-sidebar-muted">{user?.email ?? 'demo@example.com'}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            disabled={isLoggingOut}
            aria-busy={isLoggingOut}
            aria-label="Sign out of your session"
            className="flex h-8 w-8 items-center justify-center rounded-md text-sidebar-muted transition-colors hover:bg-white/10 hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </aside>
  )
}
