'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FolderKanban, History, LayoutDashboard, Settings, Users } from 'lucide-react'
import type { MembershipSummary } from '@/types/organizations'

type MobileTabBarProps = {
  memberships: MembershipSummary[]
  activeOrganizationId: string | null
}

const BASE_ITEMS = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Projects', href: '/dashboard/projects', icon: FolderKanban },
  { name: 'Team', href: '/dashboard/members', icon: Users },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function MobileTabBar({ memberships, activeOrganizationId }: MobileTabBarProps) {
  const pathname = usePathname()
  const activeRole = memberships.find(
    (membership) => membership.organizationId === activeOrganizationId
  )?.role
  const items =
    activeRole === 'ADMIN'
      ? [...BASE_ITEMS.slice(0, 3), { name: 'Audit', href: '/dashboard/audit', icon: History }, ...BASE_ITEMS.slice(3)]
      : BASE_ITEMS

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
    >
      <div className="flex h-16 items-stretch justify-around px-1">
        {items.map((item) => {
          const isActive =
            item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href)

          return (
            <Link
              key={item.name}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <item.icon className="h-[18px] w-[18px]" strokeWidth={isActive ? 2.1 : 1.75} />
              <span className="truncate">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
