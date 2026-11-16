'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import type { MembershipSummary } from '@/types/organizations'

type Member = {
  id: string
  role: MembershipSummary['role']
  createdAt: string
  user: {
    id: string
    email: string
    name: string | null
  }
}

type MembersTableProps = {
  members: Member[]
  canManage: boolean
  currentUserEmail: string
}

const ROLE_OPTIONS: Array<{ value: MembershipSummary['role']; label: string }> = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'VIEWER', label: 'Viewer' },
]

const ROLE_META: Record<
  MembershipSummary['role'],
  { label: string; description: string; select: string; avatar: string }
> = {
  ADMIN: {
    label: 'Admin',
    description: 'Full workspace access',
    select: 'border-primary/25 bg-primary/10 text-primary',
    avatar: 'bg-primary/10 text-primary',
  },
  MANAGER: {
    label: 'Manager',
    description: 'Can manage tasks',
    select: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-300',
    avatar: 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
  },
  VIEWER: {
    label: 'Viewer',
    description: 'Read-only access',
    select: 'border-border bg-muted text-muted-foreground',
    avatar: 'bg-muted text-muted-foreground',
  },
}

function initials(member: Member): string {
  return (member.user.name ?? member.user.email).slice(0, 2).toUpperCase()
}

export function MembersTable({ members, canManage, currentUserEmail }: MembersTableProps) {
  const router = useRouter()
  const [roles, setRoles] = useState<Record<string, MembershipSummary['role']>>(() =>
    Object.fromEntries(members.map((member) => [member.id, member.role]))
  )
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function updateRole(member: Member, role: MembershipSummary['role']) {
    const previousRole = roles[member.id]
    setRoles((current) => ({ ...current, [member.id]: role }))
    setPendingId(member.id)
    setError(null)

    const res = await fetch(`/api/organizations/members/${member.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ role }),
    })

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null
      setRoles((current) => ({ ...current, [member.id]: previousRole }))
      setError(data?.error ?? 'Could not update the member role.')
      setPendingId(null)
      return
    }

    setPendingId(null)
    router.refresh()
  }

  if (members.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
        No team members found.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-[0_1px_2px_rgba(16,24,40,0.06),0_1px_3px_rgba(16,24,40,0.08)]">
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">Team members and their workspace roles</caption>
          <thead className="border-b bg-muted/40 text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
            <tr>
              <th scope="col" className="px-5 py-3 font-semibold">Member</th>
              <th scope="col" className="hidden px-5 py-3 font-semibold sm:table-cell">Joined</th>
              <th scope="col" className="px-5 py-3 font-semibold">Role</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => {
              const role = roles[member.id]
              const meta = ROLE_META[role]
              const isCurrentUser = member.user.email === currentUserEmail

              return (
                <tr
                  key={member.id}
                  aria-busy={pendingId === member.id}
                  className={`border-b transition-colors duration-150 last:border-0 hover:bg-muted/40 ${
                    pendingId === member.id ? 'opacity-60' : ''
                  }`}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${meta.avatar}`}
                        aria-hidden="true"
                      >
                        {initials(member)}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-medium">{member.user.name ?? 'Unnamed user'}</p>
                          {isCurrentUser && (
                            <span className="rounded-full border border-border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                              You
                            </span>
                          )}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">{member.user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden whitespace-nowrap px-5 py-4 text-xs text-muted-foreground sm:table-cell">
                    {new Date(member.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`relative inline-flex items-center rounded-full border ${meta.select}`}
                    >
                      <select
                        aria-label={`Role for ${member.user.email}`}
                        value={role}
                        disabled={!canManage || pendingId === member.id}
                        onChange={(event) => {
                          const nextRole = event.target.value as MembershipSummary['role']
                          void updateRole(member, nextRole)
                        }}
                        className="cursor-pointer appearance-none bg-transparent py-1 pl-2.5 pr-7 text-xs font-semibold uppercase tracking-[0.06em] outline-none disabled:cursor-not-allowed"
                      >
                        {ROLE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value} className="text-foreground">
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2 h-3 w-3 opacity-60" aria-hidden="true" />
                    </span>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {pendingId === member.id ? 'Updating...' : meta.description}
                    </p>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
