import { z } from 'zod'
import { cookies } from 'next/headers'
import { getCurrentUserFromRequest } from '@/lib/auth'
import { db } from '@/lib/db'
import { ACTIVE_ORG_COOKIE } from '@/lib/organizations'
import { rejectCrossOrigin } from '@/lib/csrf'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  organizationId: z.string().min(1),
})

const NO_STORE = { 'Cache-Control': 'no-store' }

export async function POST(req: Request) {
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

  const membership = await db.membership.findFirst({
    where: {
      userId: user.id,
      organizationId: parsed.data.organizationId,
    },
    select: { id: true },
  })

  if (!membership) {
    return Response.json({ error: 'Forbidden' }, { status: 403, headers: NO_STORE })
  }

  const cookieStore = await cookies()
  cookieStore.set({
    name: ACTIVE_ORG_COOKIE,
    value: parsed.data.organizationId,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 30 * 24 * 60 * 60,
  })

  return Response.json({ ok: true }, { status: 200, headers: NO_STORE })
}
