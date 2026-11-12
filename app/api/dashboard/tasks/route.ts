import { z } from 'zod'
import { getCurrentUserFromRequest } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

const querySchema = z.object({
  orgId: z.string().min(1),
  page: z.coerce.number().int().positive().max(100_000).default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(50),
})

export async function GET(req: Request) {
  const user = await getCurrentUserFromRequest(req)
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const parsed = querySchema.safeParse({
    orgId: searchParams.get('orgId') ?? undefined,
    page: searchParams.get('page') ?? undefined,
    pageSize: searchParams.get('pageSize') ?? undefined,
  })

  if (!parsed.success) {
    return Response.json(
      {
        error: 'Invalid query parameters',
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    )
  }

  const { orgId, page, pageSize } = parsed.data
  const skip = (page - 1) * pageSize

  // Verify membership
  const membership = await db.membership.findFirst({
    where: {
      userId: user.id,
      organizationId: orgId,
    },
  })

  if (!membership) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const [tasks, totalCount] = await Promise.all([
    db.task.findMany({
      where: {
        project: { organizationId: orgId },
      },
      select: {
        id: true,
        title: true,
        status: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: pageSize,
    }),
    db.task.count({
      where: {
        project: { organizationId: orgId },
      },
    }),
  ])

  return Response.json({
    tasks,
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
    },
  }, { status: 200 })
}
