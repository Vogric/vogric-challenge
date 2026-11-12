import { redirect } from 'next/navigation'
import { getCurrentUserFromServer } from '@/lib/auth'
import { getActiveMembership } from '@/lib/organizations'
import { db } from '@/lib/db'
import { StatsGrid } from '@/components/dashboard/stats-grid'
import type { StatCardProps } from '@/components/dashboard/stat-card'

export const dynamic = 'force-dynamic'

export default async function DashboardHomePage() {
  const user = await getCurrentUserFromServer()
  if (!user) redirect('/auth/login')

  const membership = await getActiveMembership(user.id)
  if (!membership) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-lg font-semibold">No organization assigned</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ask an administrator to add you to an organization.
        </p>
      </div>
    )
  }

  const organizationId = membership.organization.id

  const [activeProjects, pendingTasks, members, dbLatency] = await Promise.all([
    db.project.count({ where: { organizationId } }),
    db.task.count({
      where: {
        project: { organizationId },
        status: { in: ['todo', 'in_progress'] },
      },
    }),
    db.membership.count({ where: { organizationId } }),
    (async () => {
      const start = Date.now()
      try {
        await db.$queryRaw`SELECT 1`
        return Date.now() - start
      } catch {
        return null
      }
    })(),
  ])

  const stats: StatCardProps[] = [
    {
      title: 'Active Projects',
      value: activeProjects,
      description: `Projects in ${membership.organization.name}.`,
      valueTestId: 'stat-projects',
    },
    {
      title: 'Pending Tasks',
      value: pendingTasks,
      description: 'Tasks not yet completed.',
      valueTestId: 'stat-pending',
      accent: 'destructive',
    },
    {
      title: 'Users',
      value: members,
      description: 'Members in the current organization.',
      valueTestId: 'stat-members',
      accent: 'secondary',
    },
    {
      title: 'Database',
      value: dbLatency === null ? 'Offline' : `${dbLatency} ms`,
      description: 'Live Prisma health check.',
      valueTestId: 'stat-db',
      accent: dbLatency === null ? 'destructive' : 'success',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {membership.organization.name} &middot; signed in as {membership.role.toLowerCase()}
        </p>
      </div>

      <StatsGrid stats={stats} />
    </div>
  )
}
