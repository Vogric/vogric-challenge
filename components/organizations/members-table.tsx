'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { MembershipSummary } from '@/types/organizations'
import { MemberRow } from './member-row'
import type { Member } from './members-table-model'

type MembersTableProps = {
  members: Member[]
  canManage: boolean
  currentUserEmail: string
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
            {members.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                role={roles[member.id]}
                canManage={canManage}
                isPending={pendingId === member.id}
                isCurrentUser={member.user.email === currentUserEmail}
                onChange={(target, role) => void updateRole(target, role)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
