import { z } from 'zod'
import { getCurrentUserFromRequest } from '@/lib/auth'
import { db } from '@/lib/db'

const querySchema = z.object({
  orgId: z.string(),
  page: z.string().optional(),
  pageSize: z.string().optional(),
})

export async function GET(req: Request) {
  const user = await getCurrentUserFromRequest(req)
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const parsed = querySchema.safeParse({
    orgId: searchParams.get('orgId'),
    page: searchParams.get('page'),
    pageSize: searchParams.get('pageSize'),
  })

  if (!parsed.success) {
    return Response.json({ error: 'Missing orgId' }, { status: 400 })
  }

  const { orgId } = parsed.data
  const page = Math.max(1, parseInt(parsed.data.page ?? '1', 10))
  const pageSize = Math.max(1, Math.min(100, parseInt(parsed.data.pageSize ?? '50', 10)))
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
