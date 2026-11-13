import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/auth', () => ({
  getCurrentUserFromRequest: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  db: { $transaction: vi.fn() },
}))

import { getCurrentUserFromRequest } from '@/lib/auth'
import { db } from '@/lib/db'
import { PATCH } from '@/app/api/organizations/members/[id]/route'

const user = { id: 'admin-1', email: 'admin@example.com', name: 'Admin' }

type Tx = {
  membership: {
    findUnique: ReturnType<typeof vi.fn>
    findFirst: ReturnType<typeof vi.fn>
    count: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
  }
}

function makeTx(): Tx {
  return {
    membership: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
  }
}

/** Runs the interactive transaction callback against a mocked tx client. */
function wireTransaction(tx: Tx) {
  vi.mocked(db.$transaction).mockImplementation((async (fn: (client: Tx) => unknown) =>
    fn(tx)) as never)
}

function request(body: unknown) {
  return new Request('http://localhost/api/organizations/members/m1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const params = { params: Promise.resolve({ id: 'm1' }) }

describe('PATCH /api/organizations/members/[id]', () => {
  let tx: Tx

  beforeEach(() => {
    vi.clearAllMocks()
    tx = makeTx()
    wireTransaction(tx)
    vi.mocked(getCurrentUserFromRequest).mockResolvedValue(user as never)
  })

  it('rejects an anonymous request without opening a transaction', async () => {
    vi.mocked(getCurrentUserFromRequest).mockResolvedValue(null as never)

    const response = await PATCH(request({ role: 'ADMIN' }), params)

    expect(response.status).toBe(401)
    expect(db.$transaction).not.toHaveBeenCalled()
  })

  it('rejects an invalid role before opening a transaction', async () => {
    const response = await PATCH(request({ role: 'SUPERUSER' }), params)

    expect(response.status).toBe(400)
    expect(db.$transaction).not.toHaveBeenCalled()
  })

  it('returns 404 when the membership does not exist', async () => {
    tx.membership.findUnique.mockResolvedValue(null)

    const response = await PATCH(request({ role: 'VIEWER' }), params)

    expect(response.status).toBe(404)
    expect(tx.membership.update).not.toHaveBeenCalled()
  })

  it('rejects an actor who is not an admin of that organization', async () => {
    tx.membership.findUnique.mockResolvedValue({
      id: 'm1',
      organizationId: 'org-1',
      role: 'VIEWER',
    })
    tx.membership.findFirst.mockResolvedValue({ role: 'MANAGER' })

    const response = await PATCH(request({ role: 'ADMIN' }), params)

    expect(response.status).toBe(403)
    expect(tx.membership.update).not.toHaveBeenCalled()
  })

  it('refuses to demote the last admin', async () => {
    tx.membership.findUnique.mockResolvedValue({
      id: 'm1',
      organizationId: 'org-1',
      role: 'ADMIN',
    })
    tx.membership.findFirst.mockResolvedValue({ role: 'ADMIN' })
    tx.membership.count.mockResolvedValue(1)

    const response = await PATCH(request({ role: 'VIEWER' }), params)

    expect(response.status).toBe(400)
    expect(tx.membership.update).not.toHaveBeenCalled()
  })

  it('allows demoting an admin when another admin remains', async () => {
    tx.membership.findUnique.mockResolvedValue({
      id: 'm1',
      organizationId: 'org-1',
      role: 'ADMIN',
    })
    tx.membership.findFirst.mockResolvedValue({ role: 'ADMIN' })
    tx.membership.count.mockResolvedValue(2)
    tx.membership.update.mockResolvedValue({ id: 'm1', role: 'VIEWER' })

    const response = await PATCH(request({ role: 'VIEWER' }), params)

    expect(response.status).toBe(200)
    expect(tx.membership.update).toHaveBeenCalledWith({
      where: { id: 'm1' },
      data: { role: 'VIEWER' },
      select: { id: true, role: true },
    })
  })

  it('runs the read and the write inside one serializable transaction', async () => {
    tx.membership.findUnique.mockResolvedValue({
      id: 'm1',
      organizationId: 'org-1',
      role: 'VIEWER',
    })
    tx.membership.findFirst.mockResolvedValue({ role: 'ADMIN' })
    tx.membership.update.mockResolvedValue({ id: 'm1', role: 'MANAGER' })

    await PATCH(request({ role: 'MANAGER' }), params)

    expect(db.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: 'Serializable',
    })
  })

  it('retries once when serializable reports a write conflict', async () => {
    tx.membership.findUnique.mockResolvedValue({
      id: 'm1',
      organizationId: 'org-1',
      role: 'VIEWER',
    })
    tx.membership.findFirst.mockResolvedValue({ role: 'ADMIN' })
    tx.membership.update.mockResolvedValue({ id: 'm1', role: 'MANAGER' })

    // First attempt loses the race (Postgres 40001 surfaced as Prisma P2034).
    vi.mocked(db.$transaction).mockRejectedValueOnce(Object.assign(new Error('write conflict'), {
      code: 'P2034',
    }))

    const response = await PATCH(request({ role: 'MANAGER' }), params)

    expect(response.status).toBe(200)
    expect(db.$transaction).toHaveBeenCalledTimes(2)
  })

  it('does not retry a non-transient failure', async () => {
    vi.mocked(db.$transaction).mockRejectedValueOnce(new Error('connection lost'))

    await expect(PATCH(request({ role: 'MANAGER' }), params)).rejects.toThrow('connection lost')
    expect(db.$transaction).toHaveBeenCalledTimes(1)
  })
})
