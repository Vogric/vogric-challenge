import { z } from 'zod'
import { getCurrentUserFromRequest } from '@/lib/auth'
import { db } from '@/lib/db'
import { rejectCrossOrigin } from '@/lib/csrf'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  role: z.enum(['ADMIN', 'MANAGER', 'VIEWER']),
})

const NO_STORE = { 'Cache-Control': 'no-store' }

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

  const target = await db.membership.findUnique({
    where: { id },
    select: { id: true, organizationId: true, role: true },
  })

  if (!target) {
    return Response.json({ error: 'Membership not found' }, { status: 404, headers: NO_STORE })
  }

  const actor = await db.membership.findFirst({
    where: {
      userId: user.id,
      organizationId: target.organizationId,
    },
    select: { role: true },
  })

  if (!actor || actor.role !== 'ADMIN') {
    return Response.json(
      { error: 'Forbidden: ADMIN role required' },
      { status: 403, headers: NO_STORE }
    )
  }

  if (target.role === 'ADMIN' && parsed.data.role !== 'ADMIN') {
    const adminCount = await db.membership.count({
      where: { organizationId: target.organizationId, role: 'ADMIN' },
    })
    if (adminCount <= 1) {
      return Response.json(
        { error: 'An organization must keep at least one admin.' },
        { status: 400, headers: NO_STORE }
      )
    }
  }

  const updated = await db.membership.update({
    where: { id: target.id },
    data: { role: parsed.data.role },
    select: { id: true, role: true },
  })

  return Response.json({ membership: updated }, { status: 200, headers: NO_STORE })
}
