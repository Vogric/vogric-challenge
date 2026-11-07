'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Settings, LogOut } from 'lucide-react'

export function Sidebar() {
  const pathname = usePathname()

  const nav = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Members', href: '/dashboard/members', icon: Users },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ]

  return (
    <aside className="hidden w-72 flex-shrink-0 flex-col border-r border-border bg-background lg:flex">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs">
            S
          </div>
          <span className="font-semibold tracking-tight">SaaS</span>
        </div>
        <LogOut className="h-5 w-5 cursor-pointer hover:text-destructive transition-colors" />
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {nav.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`
              flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors
              ${pathname === item.href
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'}
            `}
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
