import { db } from '@/lib/db'

/**
 * Resolves the organization used by the dashboard for a given user.
 *
 * The demo has no organization switcher yet; picking the oldest membership is
 * deterministic and keeps every page scoped to a real organization instead of
 * a hardcoded slug.
 */
export async function getActiveMembership(userId: string) {
  return db.membership.findFirst({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    select: {
      organizationId: true,
      role: true,
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  })
}
