import { z } from 'zod'
import { getCurrentUserFromRequest } from '@/lib/auth'
import { db } from '@/lib/db'
import { decodeTaskCursor } from '@/lib/tasks/task-cursor'
import { getTasksPage } from '@/lib/tasks/get-tasks-page'
import { getRequestId } from '@/lib/logger/get-request-id'
import { logError } from '@/lib/logger/log-error'
import { TASK_PAGE_SIZE } from '@/types/tasks'
import { taskStatusSchema } from '@/lib/validations/tasks'

export const dynamic = 'force-dynamic'
export const preferredRegion = 'fra1'

const querySchema = z.object({
  orgId: z.string().min(1),
  cursor: z.string().max(500).optional(),
  pageSize: z.coerce.number().int().positive().max(100).default(TASK_PAGE_SIZE),
  q: z.string().trim().max(100).optional(),
  status: taskStatusSchema.optional(),
  projectId: z.string().min(1).optional(),
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
    cursor: searchParams.get('cursor') ?? undefined,
    pageSize: searchParams.get('pageSize') ?? undefined,
    q: searchParams.get('q') ?? undefined,
    status: searchParams.get('status') ?? undefined,
    projectId: searchParams.get('projectId') ?? undefined,
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

  const { orgId, pageSize, q, status, projectId } = parsed.data
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

  const result = await getTasksPage(orgId, cursor, pageSize, { q, status, projectId })

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
