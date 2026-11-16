'use client'

import { useEffect, useId, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { ChevronDown } from 'lucide-react'
import { taskKeys } from '@/lib/query-keys'
import { useWorkspaceTransition } from '@/contexts/WorkspaceTransitionContext'
import type { MembershipSummary } from '@/types/organizations'

type OrganizationSwitcherProps = {
  memberships: MembershipSummary[]
  activeOrganizationId: string | null
  ariaLabel?: string
  tone?: 'dark' | 'light'
}

export function OrganizationSwitcher({
  memberships,
  activeOrganizationId,
  ariaLabel = 'Organization',
  tone = 'light',
}: OrganizationSwitcherProps) {
  const router = useRouter()
  const selectId = useId()
  const queryClient = useQueryClient()
  const { begin, end } = useWorkspaceTransition()
  const [isPending, startTransition] = useTransition()
  const [selectedId, setSelectedId] = useState(activeOrganizationId)
  const [isSwitching, setIsSwitching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setSelectedId(activeOrganizationId)
  }, [activeOrganizationId])

  useEffect(() => {
    if (isSwitching && activeOrganizationId === selectedId) {
      setIsSwitching(false)
      end()
    }
  }, [activeOrganizationId, selectedId, isSwitching, end])

  useEffect(() => {
    if (!isSwitching) return
    const timeout = setTimeout(() => {
      setIsSwitching(false)
      setSelectedId(activeOrganizationId)
      setError('Could not confirm the organization switch. Try again.')
      end()
    }, 5000)
    return () => clearTimeout(timeout)
  }, [isSwitching, activeOrganizationId, end])

  const isBusy = isSwitching || isPending
  const selectedName =
    memberships.find((membership) => membership.organizationId === selectedId)?.organization.name ??
    'organization'

  async function handleChange(organizationId: string) {
    if (organizationId === activeOrganizationId || isBusy) return

    setSelectedId(organizationId)
    setIsSwitching(true)
    begin()
    setError(null)

    try {
      const res = await fetch('/api/organizations/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ organizationId }),
      })

      if (!res.ok) {
        setSelectedId(activeOrganizationId)
        setIsSwitching(false)
        end()
        setError('Could not switch organization.')
        return
      }

      queryClient.removeQueries({ queryKey: taskKeys.all })
      startTransition(() => router.refresh())
    } catch {
      setSelectedId(activeOrganizationId)
      setIsSwitching(false)
      end()
      setError('Could not switch organization.')
    }
  }

  const dark = tone === 'dark'

  return (
    <div className="space-y-1.5" aria-busy={isBusy}>
      <label
        htmlFor={selectId}
        className={`text-[10px] font-semibold uppercase tracking-[0.12em] ${
          dark ? 'text-sidebar-muted' : 'text-muted-foreground'
        }`}
      >
        Workspace
      </label>
      <div className="relative">
        <select
          id={selectId}
          aria-label={ariaLabel}
          value={selectedId ?? ''}
          disabled={isBusy || memberships.length === 0}
          onChange={(event) => void handleChange(event.target.value)}
          className={`h-10 w-full appearance-none rounded-[10px] border px-3 pr-9 text-sm font-medium outline-none transition-colors focus-visible:ring-2 disabled:opacity-60 ${
            dark
              ? 'border-sidebar-border bg-white/[0.06] text-sidebar-foreground hover:bg-white/[0.09] focus-visible:ring-primary/60'
              : 'border-input bg-card text-foreground hover:border-foreground/25 focus-visible:ring-ring/20'
          }`}
        >
          {memberships.map((membership) => (
            <option key={membership.organizationId} value={membership.organizationId} className="text-foreground">
              {membership.organization.name}
            </option>
          ))}
        </select>
        <ChevronDown
          className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 ${
            dark ? 'text-sidebar-muted' : 'text-muted-foreground'
          }`}
          aria-hidden="true"
        />
      </div>
      {isBusy && (
        <div
          role="progressbar"
          aria-label="Switching organization"
          className={`h-0.5 w-full overflow-hidden rounded ${dark ? 'bg-white/10' : 'bg-muted'}`}
        >
          <div className="h-full w-1/2 animate-pulse bg-primary" />
        </div>
      )}
      <p
        role={error ? 'alert' : 'status'}
        aria-live="polite"
        className={`text-[11px] ${error ? 'text-destructive' : dark ? 'text-sidebar-muted' : 'text-muted-foreground'}`}
      >
        {error ?? (isBusy ? `Switching to ${selectedName}...` : '')}
      </p>
    </div>
  )
}
