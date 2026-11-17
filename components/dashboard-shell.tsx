'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
import { Navbar } from '@/components/navbar'
import { MobileNav } from '@/components/mobile-nav'
import { MobileTabBar } from '@/components/mobile-tab-bar'
import { CommandPalette } from '@/components/command-palette'
import { useWorkspaceTransition } from '@/contexts/WorkspaceTransitionContext'
import type { MembershipSummary } from '@/types/organizations'

type DashboardShellProps = {
  children: ReactNode
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
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false)
  const activeRole = memberships.find(
    (membership) => membership.organizationId === activeOrganizationId
  )?.role
  const canViewAudit = activeRole === 'ADMIN'

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setIsCommandPaletteOpen((open) => !open)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

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
        <Navbar onOpenCommandPalette={() => setIsCommandPaletteOpen(true)} />
        <MobileNav memberships={memberships} activeOrganizationId={activeOrganizationId} />
        <div
          ref={contentRef}
          tabIndex={-1}
          role="region"
          aria-label="Dashboard content"
          className="relative flex-1 overflow-y-auto px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-8 lg:pt-8"
        >
          {isSwitching && (
            <div
              role="status"
              aria-live="polite"
              className="absolute inset-0 z-30 flex items-start justify-center bg-background/50 pt-24 backdrop-blur-[1px]"
            >
              <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground shadow-sm">
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"
                  aria-hidden="true"
                />
                Updating workspace...
              </div>
            </div>
          )}
          <div
            aria-busy={isSwitching}
            className={`mx-auto w-full max-w-[1440px] ${
              isSwitching ? 'pointer-events-none opacity-60 transition-opacity' : 'transition-opacity'
            }`}
          >
            {children}
          </div>
        </div>
        <MobileTabBar
          memberships={memberships}
          activeOrganizationId={activeOrganizationId}
        />
      </div>
      <CommandPalette
        open={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        canViewAudit={canViewAudit}
      />
    </div>
  )
}
