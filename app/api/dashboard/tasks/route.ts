import { z } from 'zod'
import { getCurrentUserFromRequest } from '@/lib/auth'
import { db } from '@/lib/db'
import { decodeTaskCursor, getTasksCursorPage, getTasksPage } from '@/lib/tasks'
import { getRequestId, logError } from '@/lib/logger'
import { TASK_PAGE_SIZE } from '@/types/tasks'

export const dynamic = 'force-dynamic'

const querySchema = z.object({
  orgId: z.string().min(1),
  page: z.coerce.number().int().positive().max(100_000).optional(),
  cursor: z.string().max(500).optional(),
  pageSize: z.coerce.number().int().positive().max(100).default(TASK_PAGE_SIZE),
})

const NO_STORE_HEADERS = {
  'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
}

function json(data: unknown, status: number) {
  return Response.json(data, { status, headers: NO_STORE_HEADERS })
}

async function listTasks(req: Request) {
  const user = await getCurrentUserFromRequest(req)
  if (!user) {
    return json({ error: 'Unauthorized' }, 401)
  }

  const { searchParams } = new URL(req.url)
  const parsed = querySchema.safeParse({
    orgId: searchParams.get('orgId') ?? undefined,
    page: searchParams.get('page') ?? undefined,
    cursor: searchParams.get('cursor') ?? undefined,
    pageSize: searchParams.get('pageSize') ?? undefined,
  })

  if (!parsed.success) {
    return json(
      {
        error: 'Invalid query parameters',
        details: parsed.error.flatten().fieldErrors,
      },
      400
    )
  }

  const { orgId, pageSize } = parsed.data
  const page = parsed.data.page ?? 1
  const cursor = parsed.data.cursor ? decodeTaskCursor(parsed.data.cursor) : null

  if (parsed.data.cursor && !cursor) {
    return json({ error: 'Invalid cursor' }, 400)
  }

  const membership = await db.membership.findFirst({
    where: {
      userId: user.id,
      organizationId: orgId,
    },
  })

  if (!membership) {
    return json({ error: 'Forbidden' }, 403)
  }

  const result =
    parsed.data.page && !parsed.data.cursor
      ? await getTasksPage(orgId, page, pageSize)
      : await getTasksCursorPage(orgId, cursor, page, pageSize)

  return json(result, 200)
}

export async function GET(req: Request) {
  try {
    return await listTasks(req)
  } catch (error) {
    logError('tasks.list.failed', {
      requestId: getRequestId(req),
      error: error instanceof Error ? error.message : String(error),
    })
    return json({ error: 'Internal server error' }, 500)
  }
}
