import { z } from 'zod'
import { getCurrentUserFromRequest } from '@/lib/auth'
import { db } from '@/lib/db'

const updateTaskSchema = z.object({
  status: z.enum(['todo', 'in_progress', 'done']),
})

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUserFromRequest(req)
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const parsed = updateTaskSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json({ error: 'Invalid input' }, { status: 400 })
    }

    const { status } = parsed.data

    const task = await db.task.findUnique({
      where: { id: params.id },
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

    // Verify membership via included project relation
    const membership = await db.membership.findFirst({
      where: {
        userId: user.id,
        organizationId: task.project.organizationId,
      },
    })

    if (!membership) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updatedTask = await db.task.update({
      where: { id: params.id },
      data: { status },
      select: { id: true, status: true, title: true, updatedAt: true },
    })

    return Response.json({ task: updatedTask }, { status: 200 })
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
