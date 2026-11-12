'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
}

const ROLE_OPTIONS: Array<{ value: MembershipSummary['role']; label: string }> = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'VIEWER', label: 'Viewer' },
]

export function MembersTable({ members, canManage }: MembersTableProps) {
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
      <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        No team members found.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {error && (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="border-b bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Member</th>
              <th scope="col" className="px-4 py-3 font-medium">Joined</th>
              <th scope="col" className="px-4 py-3 font-medium">Role</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id} className="border-b transition-colors duration-150 last:border-0 hover:bg-muted/50">
                <td className="px-4 py-3">
                  <p className="font-medium">{member.user.name ?? 'Unnamed user'}</p>
                  <p className="text-xs text-muted-foreground">{member.user.email}</p>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(member.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                </td>
                <td className="px-4 py-3">
                  <select
                    aria-label={`Role for ${member.user.email}`}
                    value={roles[member.id]}
                    disabled={!canManage || pendingId === member.id}
                    onChange={(event) => {
                      const nextRole = event.target.value as MembershipSummary['role']
                      void updateRole(member, nextRole)
                    }}
                    className="rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {ROLE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
