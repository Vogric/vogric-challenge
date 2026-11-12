'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FolderKanban, Users, Settings } from 'lucide-react'
import { OrganizationSwitcher } from '@/components/organizations/organization-switcher'
import type { MembershipSummary } from '@/types/organizations'

const MOBILE_ITEMS = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Projects', href: '/dashboard/projects', icon: FolderKanban },
  { name: 'Members', href: '/dashboard/members', icon: Users },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

type MobileNavProps = {
  memberships: MembershipSummary[]
  activeOrganizationId: string | null
}

export function MobileNav({ memberships, activeOrganizationId }: MobileNavProps) {
  const pathname = usePathname()

  return (
    <div className="border-b border-border bg-background p-3 lg:hidden">
      <OrganizationSwitcher
        memberships={memberships}
        activeOrganizationId={activeOrganizationId}
        ariaLabel="Organization (mobile)"
      />
      <nav className="mt-3 flex gap-1 overflow-x-auto" aria-label="Mobile navigation">
        {MOBILE_ITEMS.map((item) => {
          const isActive =
            item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href)

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-2 text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
