import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { unstable_cache } from 'next/cache'
import { getRequestUser } from '@/lib/request-user'
import { getActiveMembership } from '@/lib/organizations'
import { db } from '@/lib/db'
import { ORG_STATS_TAG, ORG_STATS_TTL_SECONDS } from '@/lib/cache-tags'
import { StatsGrid } from '@/components/dashboard/stats-grid'
import { TaskDistribution } from '@/components/dashboard/task-distribution'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { TeamOverview } from '@/components/dashboard/team-overview'
import { buttonVariants } from '@/components/ui/button'
import Link from 'next/link'
import type { StatCardProps } from '@/components/dashboard/stat-card'

export const dynamic = 'force-dynamic'

/**
 * KPI counts, cached per organization and invalidated by event.
 *
 * These three counters are identical for every member of the same organization
 * and were being recomputed on every page view. They now survive between
 * requests and are dropped by `revalidateTag(ORG_STATS_TAG)` whenever a
 * mutation changes them, so the TTL is only a backstop rather than the primary
 * freshness mechanism.
 *
 * The task *list* is never cached: it is per-request, cursor-paginated and
 * rendered from a client cache that is invalidated on mutation.
 */
const getOrganizationStats = unstable_cache(
  async (organizationId: string) => {
    const [activeProjects, pendingTasks, completedTasks, members] = await Promise.all([
      db.project.count({ where: { organizationId } }),
      db.task.count({
        where: {
          project: { organizationId },
          status: { in: ['todo', 'in_progress'] },
        },
      }),
      db.task.count({ where: { project: { organizationId }, status: 'done' } }),
      db.membership.count({ where: { organizationId } }),
    ])

    return { activeProjects, pendingTasks, completedTasks, members }
  },
  ['organization-stats'],
  { revalidate: ORG_STATS_TTL_SECONDS, tags: [ORG_STATS_TAG] }
)

function StatsFallback() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true">
      {[0, 1, 2, 3].map((index) => (
        <div key={index} className="skeleton-shimmer h-[104px] rounded-lg border border-border" />
      ))}
    </div>
  )
}

async function DashboardSections({ organizationId }: { organizationId: string }) {
  const [statusCounts, rawRecentActivity, team] = await Promise.all([
    db.task.groupBy({
      by: ['status'],
      where: { project: { organizationId } },
      _count: { _all: true },
    }),
    db.auditEvent.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        action: true,
        entityType: true,
        metadata: true,
        createdAt: true,
        actor: { select: { name: true, email: true } },
      },
    }),
    db.membership.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'asc' },
      take: 4,
      select: {
        id: true,
        role: true,
        user: { select: { name: true, email: true } },
      },
    }),
  ])

  const counts = statusCounts.map((item) => ({
    status: item.status,
    count: item._count._all,
  }))

  // Keep the feed honest: legacy no-op status changes should not look like
  // recent work. Fetch a few extra rows so the card can still show five real
  // events after filtering.
  const recentActivity = rawRecentActivity
    .filter((event) => {
      if (!event.metadata || typeof event.metadata !== 'object' || Array.isArray(event.metadata)) {
        return true
      }
      const metadata = event.metadata as Record<string, unknown>
      return metadata.from !== metadata.to
    })
    .slice(0, 5)

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <TaskDistribution counts={counts} />
      <RecentActivity items={recentActivity} />
      <TeamOverview members={team} />
    </div>
  )
}

function SectionsFallback() {
  return (
    <div className="grid gap-6 lg:grid-cols-3" aria-busy="true">
      {[0, 1, 2].map((index) => (
        <div key={index} className="skeleton-shimmer h-[300px] rounded-xl border border-border" />
      ))}
    </div>
  )
}

async function StatsSection({
  organizationId,
  organizationName,
}: {
  organizationId: string
  organizationName: string
}) {
  const stats = await getOrganizationStats(organizationId)

  const cards: StatCardProps[] = [
    {
      title: 'Active Projects',
      value: stats.activeProjects,
      description: `Projects in ${organizationName}.`,
      valueTestId: 'stat-projects',
    },
    {
      title: 'Pending Tasks',
      value: stats.pendingTasks,
      description: 'Tasks not yet completed.',
      valueTestId: 'stat-pending',
      accent: 'destructive',
    },
    {
      title: 'Users',
      value: stats.members,
      description: 'Members in the current organization.',
      valueTestId: 'stat-members',
      accent: 'secondary',
    },
    {
      title: 'Completed Tasks',
      value: stats.completedTasks,
      description: 'Tasks marked as done.',
      valueTestId: 'stat-completed',
      accent: 'success',
    },
  ]

  return <StatsGrid stats={cards} />
}

export default async function DashboardHomePage() {
  const user = await getRequestUser()
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Workspace
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {membership.organization.name} &middot; signed in as {membership.role.toLowerCase()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/audit" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            View audit
          </Link>
          <Link href="/dashboard/projects" className={buttonVariants({ variant: 'default', size: 'sm' })}>
            Open projects
          </Link>
        </div>
      </div>

      <Suspense fallback={<StatsFallback />}>
        <StatsSection
          organizationId={membership.organization.id}
          organizationName={membership.organization.name}
        />
      </Suspense>

      <Suspense fallback={<SectionsFallback />}>
        <DashboardSections organizationId={membership.organization.id} />
      </Suspense>
    </div>
  )
}
