'use client'

import { useEffect, useId, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { taskKeys } from '@/lib/query-keys'
import { useWorkspaceTransition } from '@/contexts/WorkspaceTransitionContext'
import type { MembershipSummary } from '@/types/organizations'

type OrganizationSwitcherProps = {
  memberships: MembershipSummary[]
  activeOrganizationId: string | null
  ariaLabel?: string
}

export function OrganizationSwitcher({
  memberships,
  activeOrganizationId,
  ariaLabel = 'Organization',
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

  return (
    <div className="space-y-1.5" aria-busy={isBusy}>
      <label
        htmlFor={selectId}
        className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
      >
        Organization
      </label>
      <select
        id={selectId}
        aria-label={ariaLabel}
        value={selectedId ?? ''}
        disabled={isBusy || memberships.length === 0}
        onChange={(event) => void handleChange(event.target.value)}
        className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
      >
        {memberships.map((membership) => (
          <option key={membership.organizationId} value={membership.organizationId}>
            {membership.organization.name}
          </option>
        ))}
      </select>
      {isBusy && (
        <div
          role="progressbar"
          aria-label="Switching organization"
          className="h-0.5 w-full overflow-hidden rounded bg-muted"
        >
          <div className="h-full w-1/2 animate-pulse bg-primary" />
        </div>
      )}
      <p
        role={error ? 'alert' : 'status'}
        aria-live="polite"
        className={`text-[11px] ${error ? 'text-destructive' : 'text-muted-foreground'}`}
      >
        {error ?? (isBusy ? `Switching to ${selectedName}...` : '')}
      </p>
    </div>
  )
}
