'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, LogOut, Moon, Search, Sun } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'
import { useAuth } from '@/hooks/useAuth'
import { useLogout } from '@/hooks/useLogout'
import { initials } from '@/lib/utils'

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  projects: 'Projects',
  members: 'Team',
  audit: 'Audit',
  settings: 'Settings',
}

function Breadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)
  const crumbs = segments.map((segment, index) => ({
    label: SEGMENT_LABELS[segment] ?? segment,
    href: '/' + segments.slice(0, index + 1).join('/'),
    isLast: index === segments.length - 1,
  }))

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
      {crumbs.map((crumb, index) => (
        <span key={crumb.href} className="flex items-center gap-1.5">
          {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />}
          {crumb.isLast ? (
            <span className="font-medium text-foreground">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="text-muted-foreground transition-colors hover:text-foreground">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  )
}

type NavbarProps = {
  onOpenCommandPalette: () => void
}

export function Navbar({ onOpenCommandPalette }: NavbarProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const { user } = useAuth()
  const { logout, isPending: isLoggingOut } = useLogout()
  const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark'

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-background/85 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
        <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-primary text-xs font-bold text-primary-foreground">
          V
        </span>
        <span className="text-sm font-semibold tracking-tight">Vogric</span>
      </Link>
      <div className="hidden lg:block">
        <Breadcrumb />
      </div>
      <div className="flex-1" />
      <button
        type="button"
        onClick={onOpenCommandPalette}
        aria-keyshortcuts="Meta+K Control+K"
        className="flex h-9 items-center gap-2 rounded-[10px] border border-border bg-card px-2.5 text-xs text-muted-foreground transition-colors hover:border-border hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Search className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="sr-only">Search or jump to...</span>
        <span aria-hidden="true" className="hidden sm:inline">Search or jump to...</span>
        <kbd
          aria-hidden="true"
          className="hidden rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-foreground sm:inline"
        >
          ⌘K
        </kbd>
      </button>
      <button
        type="button"
        onClick={() => setTheme(nextTheme)}
        aria-label={`Switch to ${nextTheme} theme`}
        className="flex h-9 w-9 items-center justify-center rounded-[10px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {resolvedTheme === 'dark' ? (
          <Sun className="h-4 w-4" strokeWidth={1.75} />
        ) : (
          <Moon className="h-4 w-4" strokeWidth={1.75} />
        )}
      </button>
      <div className="flex items-center gap-2 border-l border-border pl-3">
        <div className="hidden h-8 w-8 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground sm:flex">
          {initials(user?.name, user?.email)}
        </div>
        <div className="hidden md:block">
          <p className="max-w-[180px] truncate text-xs font-medium text-foreground">
            {user?.name ?? 'Demo user'}
          </p>
          <p className="max-w-[180px] truncate text-[11px] text-muted-foreground">
            {user?.email ?? 'Guest'}
          </p>
        </div>
        <button
          type="button"
          onClick={logout}
          disabled={isLoggingOut}
          aria-busy={isLoggingOut}
          aria-label={isLoggingOut ? 'Signing out...' : 'Sign out'}
          title={isLoggingOut ? 'Signing out...' : 'Sign out'}
          className="ml-1 inline-flex h-8 items-center gap-1.5 rounded-lg border border-transparent px-2 text-xs font-medium text-muted-foreground transition-colors hover:border-border hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
        >
          <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
          <span className="hidden sm:inline">{isLoggingOut ? 'Signing out...' : 'Sign out'}</span>
        </button>
      </div>
    </header>
  )
}
