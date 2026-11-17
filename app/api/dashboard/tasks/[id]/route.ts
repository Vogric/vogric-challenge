import { z } from 'zod'
import { revalidateTag } from 'next/cache'
import { getCurrentUserFromRequest } from '@/lib/auth'
import { canManageTasks } from '@/lib/authz'
import { db } from '@/lib/db'
import { rejectCrossOrigin } from '@/lib/csrf'
import { getRequestId } from '@/lib/logger/get-request-id'
import { logError } from '@/lib/logger/log-error'
import { ORG_STATS_TAG } from '@/lib/cache-tags'
import { recordAuditEvent } from '@/lib/audit'

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

    // Selecting the current status is a no-op: do not write an audit event or
    // churn the KPI cache for a change that never happened.
    if (task.status === status) {
      return Response.json({
        task: {
          id: task.id,
          status: task.status,
          title: task.title,
          updatedAt: task.updatedAt,
        },
      })
    }

    // The status write and its audit event are one unit. If audit insertion
    // fails, the transaction rolls back instead of leaving a changed row with
    // no record of who changed it.
    const updatedTask = await db.$transaction(async (tx) => {
      const updated = await tx.task.update({
        where: { id },
        data: { status },
        select: { id: true, status: true, title: true, updatedAt: true },
      })

      await recordAuditEvent(
        {
          organizationId: task.project.organizationId,
          actorId: user.id,
          action: 'task.status_changed',
          entityType: 'task',
          entityId: id,
          metadata: { from: task.status, to: status, title: task.title },
        },
        tx
      )

      return updated
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
