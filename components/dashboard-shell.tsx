'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
import { Navbar } from '@/components/navbar'
import { MobileNav } from '@/components/mobile-nav'
import { useWorkspaceTransition } from '@/contexts/WorkspaceTransitionContext'
import type { MembershipSummary } from '@/types/organizations'

type DashboardShellProps = {
  children: React.ReactNode
  memberships: MembershipSummary[]
  activeOrganizationId: string | null
}

export function DashboardShell({
  children,
  memberships,
  activeOrganizationId,
}: DashboardShellProps) {
  const pathname = usePathname()
  const { isSwitching } = useWorkspaceTransition()
  const contentRef = useRef<HTMLDivElement>(null)
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    contentRef.current?.focus()
  }, [pathname])

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <Sidebar memberships={memberships} activeOrganizationId={activeOrganizationId} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <MobileNav memberships={memberships} activeOrganizationId={activeOrganizationId} />
        <div
          ref={contentRef}
          tabIndex={-1}
          role="region"
          aria-label="Dashboard content"
          className="relative flex-1 overflow-y-auto p-6"
        >
          {isSwitching && (
            <div
              role="status"
              aria-live="polite"
              className="absolute inset-0 z-30 flex items-start justify-center bg-background/50 pt-24 backdrop-blur-[1px]"
            >
              <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm shadow-sm">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden="true" />
                Updating workspace...
              </div>
            </div>
          )}
          <div
            aria-busy={isSwitching}
            className={isSwitching ? 'pointer-events-none opacity-60 transition-opacity' : 'transition-opacity'}
          >
          <nav className="mb-6 flex items-center space-x-1 text-sm text-muted-foreground">
            <Link
              href="/dashboard"
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                pathname === '/dashboard'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              Dashboard
            </Link>
            <span className="px-3 py-1.5">/</span>
            <Link
              href="/dashboard/projects"
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                pathname.startsWith('/dashboard/projects')
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              Projects
            </Link>
          </nav>
          {children}
          </div>
        </div>
      </div>
    </div>
  )
}
