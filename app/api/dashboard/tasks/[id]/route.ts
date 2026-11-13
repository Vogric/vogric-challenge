import { z } from 'zod'
import { revalidateTag } from 'next/cache'
import { getCurrentUserFromRequest } from '@/lib/auth'
import { canManageTasks } from '@/lib/authz'
import { db } from '@/lib/db'
import { rejectCrossOrigin } from '@/lib/csrf'
import { getRequestId, logError } from '@/lib/logger'
import { ORG_STATS_TAG } from '@/lib/cache-tags'

const updateTaskSchema = z.object({
  status: z.enum(['todo', 'in_progress', 'done']),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const csrfError = rejectCrossOrigin(req)
  if (csrfError) return csrfError

  const user = await getCurrentUserFromRequest(req)
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body: unknown = await req.json()
    const parsed = updateTaskSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json({ error: 'Invalid input' }, { status: 400 })
    }

    const { status } = parsed.data

    const task = await db.task.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        title: true,
        updatedAt: true,
        project: {
          select: {
            organizationId: true,
          },
        },
      },
    })

    if (!task) {
      return Response.json({ error: 'Task not found' }, { status: 404 })
    }

    const membership = await db.membership.findFirst({
      where: {
        userId: user.id,
        organizationId: task.project.organizationId,
      },
      select: { role: true },
    })

    if (!membership || !canManageTasks(membership.role)) {
      return Response.json(
        { error: 'Forbidden: ADMIN or MANAGER role required' },
        { status: 403 }
      )
    }

    const updatedTask = await db.task.update({
      where: { id },
      data: { status },
      select: { id: true, status: true, title: true, updatedAt: true },
    })

    // The KPI counters include "pending tasks", so a status change must drop the
    // cached numbers instead of waiting for the TTL backstop.
    revalidateTag(ORG_STATS_TAG)

    return Response.json({ task: updatedTask }, { status: 200 })
  } catch (error) {
    logError('tasks.update.failed', {
      requestId: getRequestId(req),
      error: error instanceof Error ? error.message : String(error),
    })
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
