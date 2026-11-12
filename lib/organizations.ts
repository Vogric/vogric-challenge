import { cache } from 'react'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import type { MembershipSummary } from '@/types/organizations'

export const ACTIVE_ORG_COOKIE = 'active_org'

/**
 * Resolves the organization used by the dashboard for a given user.
 *
 * The selected organization is stored in an HttpOnly cookie and validated
 * against the user's memberships. If the cookie is missing or stale, we fall
 * back to the oldest membership deterministically.
 */
export const getUserMemberships = cache(async (userId: string): Promise<MembershipSummary[]> => {
  return db.membership.findMany({
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
})

export const getActiveMembership = cache(async (userId: string): Promise<MembershipSummary | null> => {
  const memberships = await getUserMemberships(userId)
  if (memberships.length === 0) return null

  const cookieStore = await cookies()
  const requestedOrganizationId = cookieStore.get(ACTIVE_ORG_COOKIE)?.value
  return (
    memberships.find((membership) => membership.organizationId === requestedOrganizationId) ??
    memberships[0]
  )
})
