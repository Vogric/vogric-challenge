'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Settings, LogOut } from 'lucide-react'
import { useLogout } from '@/hooks/useLogout'
import { OrganizationSwitcher } from '@/components/organizations/organization-switcher'
import type { MembershipSummary } from '@/types/organizations'

const NAV_ITEMS = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Members', href: '/dashboard/members', icon: Users },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

type SidebarProps = {
  memberships: MembershipSummary[]
  activeOrganizationId: string | null
}

export function Sidebar({ memberships, activeOrganizationId }: SidebarProps) {
  const pathname = usePathname()
  const { logout, isPending: isLoggingOut } = useLogout()

  return (
    <aside className="hidden w-72 flex-shrink-0 flex-col border-r border-border bg-background lg:flex">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
            S
          </div>
          <span className="font-semibold tracking-tight">SaaS</span>
        </div>
        <button
          type="button"
          onClick={logout}
          disabled={isLoggingOut}
          aria-busy={isLoggingOut}
          aria-label="Sign out of your session"
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
      <div className="px-3 pb-4">
        <OrganizationSwitcher
          memberships={memberships}
          activeOrganizationId={activeOrganizationId}
        />
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href)

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
