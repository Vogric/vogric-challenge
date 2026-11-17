import { redirect } from 'next/navigation'
import { getRequestUser } from '@/lib/request-user'
import { getActiveMembership } from '@/lib/organizations'
import { db } from '@/lib/db'
import { MembersTable } from '@/components/organizations/members-table'

export const dynamic = 'force-dynamic'

export default async function MembersPage() {
  const user = await getRequestUser()
  if (!user) redirect('/auth/login')

  const activeMembership = await getActiveMembership(user.id)
  if (!activeMembership) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-lg font-semibold">No organization assigned</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ask an administrator to add you to an organization.
        </p>
      </div>
    )
  }

  const memberships = await db.membership.findMany({
    where: { organizationId: activeMembership.organization.id },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      role: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  })

  const members = memberships.map((membership) => ({
    ...membership,
    createdAt: membership.createdAt.toISOString(),
  }))

  const roleCounts = members.reduce(
    (counts, membership) => {
      counts[membership.role] += 1
      return counts
    },
    { ADMIN: 0, MANAGER: 0, VIEWER: 0 }
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Team members</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            People with access to {activeMembership.organization.name}.
          </p>
        </div>
        <span className="text-xs font-medium tabular-nums text-muted-foreground">
          {members.length} member{members.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {(['ADMIN', 'MANAGER', 'VIEWER'] as const).map((role) => (
          <div key={role} className="rounded-xl border border-border bg-card px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {role === 'ADMIN' ? 'Admins' : role === 'MANAGER' ? 'Managers' : 'Viewers'}
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{roleCounts[role]}</p>
          </div>
        ))}
      </div>

      <MembersTable
        members={members}
        canManage={activeMembership.role === 'ADMIN'}
        currentUserEmail={user.email}
      />
    </div>
  )
}
