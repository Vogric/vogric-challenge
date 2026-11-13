import { z } from 'zod'
import { getCurrentUserFromRequest } from '@/lib/auth'
import { db } from '@/lib/db'
import { runSerializable } from '@/lib/db-tx'
import { rejectCrossOrigin } from '@/lib/csrf'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  role: z.enum(['ADMIN', 'MANAGER', 'VIEWER']),
})

const NO_STORE = { 'Cache-Control': 'no-store' }

type Outcome =
  | { kind: 'not-found' }
  | { kind: 'forbidden' }
  | { kind: 'last-admin' }
  | { kind: 'ok'; membership: { id: string; role: string } }

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const csrfError = rejectCrossOrigin(req)
  if (csrfError) return csrfError

  const user = await getCurrentUserFromRequest(req)
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400, headers: NO_STORE })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
      { status: 400, headers: NO_STORE }
    )
  }

  // The "keep at least one admin" rule used to be a check-then-act: count the
  // admins, then update in a separate statement. Two concurrent demotions could
  // both pass the count and leave the organization with zero admins. A
  // serializable transaction makes the read and the write one unit, and the
  // helper retries the write conflicts that serializable makes possible.
  const outcome = await runSerializable(async (tx): Promise<Outcome> => {
      const target = await tx.membership.findUnique({
        where: { id },
        select: { id: true, organizationId: true, role: true },
      })

      if (!target) return { kind: 'not-found' }

      const actor = await tx.membership.findFirst({
        where: {
          userId: user.id,
          organizationId: target.organizationId,
        },
        select: { role: true },
      })

      if (!actor || actor.role !== 'ADMIN') return { kind: 'forbidden' }

      if (target.role === 'ADMIN' && parsed.data.role !== 'ADMIN') {
        const adminCount = await tx.membership.count({
          where: { organizationId: target.organizationId, role: 'ADMIN' },
        })
        if (adminCount <= 1) return { kind: 'last-admin' }
      }

      const membership = await tx.membership.update({
        where: { id: target.id },
        data: { role: parsed.data.role },
        select: { id: true, role: true },
      })

      return { kind: 'ok', membership }
    }
  )

  if (outcome.kind === 'not-found') {
    return Response.json({ error: 'Membership not found' }, { status: 404, headers: NO_STORE })
  }

  if (outcome.kind === 'forbidden') {
    return Response.json(
      { error: 'Forbidden: ADMIN role required' },
      { status: 403, headers: NO_STORE }
    )
  }

  if (outcome.kind === 'last-admin') {
    return Response.json(
      { error: 'An organization must keep at least one admin.' },
      { status: 400, headers: NO_STORE }
    )
  }

  return Response.json({ membership: outcome.membership }, { status: 200, headers: NO_STORE })
}
