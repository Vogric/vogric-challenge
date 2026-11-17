import { unstable_cache } from 'next/cache'
import { db } from '@/lib/db'
import { ORG_STATS_TAG, ORG_STATS_TTL_SECONDS } from '@/lib/cache-tags'

/**
 * KPI counts, cached per organization and invalidated by event.
 *
 * These counters are identical for every member of the same organization and
 * were recomputed on every page view. The TTL is only a backstop; mutations
 * call `revalidateTag(ORG_STATS_TAG)`.
 */
export const getOrganizationStats = unstable_cache(
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
