import { redirect } from 'next/navigation'
import { getCurrentUserFromServer } from '@/lib/auth'
import { getActiveMembership } from '@/lib/organizations'
import { db } from '@/lib/db'
import { MembersTable } from '@/components/organizations/members-table'

export const dynamic = 'force-dynamic'

export default async function MembersPage() {
  const user = await getCurrentUserFromServer()
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Team Members</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {activeMembership.organization.name} · signed in as {activeMembership.role.toLowerCase()}
          </p>
        </div>
        <span className="text-xs font-medium tabular-nums text-muted-foreground">
          {members.length} member{members.length === 1 ? '' : 's'}
        </span>
      </div>

      <MembersTable members={members} canManage={activeMembership.role === 'ADMIN'} />
    </div>
  )
}
