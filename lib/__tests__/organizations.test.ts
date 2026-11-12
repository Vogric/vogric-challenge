import { beforeEach, describe, expect, it, vi } from 'vitest'

const cookieGet = vi.fn()

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({ get: cookieGet })),
}))

vi.mock('@/lib/db', () => ({
  db: {
    membership: {
      findMany: vi.fn(),
    },
  },
}))

import { db } from '@/lib/db'
import { getActiveMembership, getUserMemberships } from '@/lib/organizations'

const memberships = [
  {
    id: 'membership-1',
    userId: 'user-1',
    organizationId: 'org-1',
    role: 'ADMIN' as const,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    organization: { id: 'org-1', name: 'Acme Corp', slug: 'acme-corp' },
  },
  {
    id: 'membership-2',
    userId: 'user-1',
    organizationId: 'org-2',
    role: 'MANAGER' as const,
    createdAt: new Date('2026-01-02T00:00:00Z'),
    organization: { id: 'org-2', name: 'Globex', slug: 'globex' },
  },
]

describe('organizations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(db.membership.findMany).mockResolvedValue(memberships)
    cookieGet.mockReturnValue(undefined)
  })

  it('returns memberships ordered by creation', async () => {
    const result = await getUserMemberships('user-1')
    expect(result).toEqual(memberships)
    expect(db.membership.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1' }, orderBy: { createdAt: 'asc' } })
    )
  })

  it('uses the cookie organization when the user belongs to it', async () => {
    cookieGet.mockReturnValue({ value: 'org-2' })
    const result = await getActiveMembership('user-2')
    expect(result?.organizationId).toBe('org-2')
  })

  it('falls back to the oldest membership for an invalid cookie', async () => {
    cookieGet.mockReturnValue({ value: 'org-missing' })
    const result = await getActiveMembership('user-3')
    expect(result?.organizationId).toBe('org-1')
  })

  it('returns null without memberships', async () => {
    vi.mocked(db.membership.findMany).mockResolvedValue([])
    const result = await getActiveMembership('user-4')
    expect(result).toBeNull()
  })
})
