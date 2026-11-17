import { db } from '@/lib/db'
import { isNoOpAuditEvent } from '@/lib/audit-is-no-op'
import { TaskDistribution } from '@/components/dashboard/task-distribution'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { TeamOverview } from '@/components/dashboard/team-overview'

export async function DashboardSections({ organizationId }: { organizationId: string }) {
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
    .filter((event) => !isNoOpAuditEvent(event.metadata))
    .slice(0, 5)

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <TaskDistribution counts={counts} />
      <RecentActivity items={recentActivity} />
      <TeamOverview members={team} />
    </div>
  )
}
