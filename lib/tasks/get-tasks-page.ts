import type { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import type { TaskFilters, TasksResponse } from '@/types/tasks'
import { buildTaskWhere } from './task-filters'
import { getTaskCount } from './task-count'
import {
  encodeTaskCursor,
  serializeTask,
  type CursorTaskRow,
  type TaskCursor,
} from './task-cursor'

export async function getTasksPage(
  organizationId: string,
  cursor: TaskCursor | null,
  pageSize: number,
  filters: TaskFilters = {}
): Promise<TasksResponse> {
  const baseWhere = buildTaskWhere(organizationId, filters)
  const where: Prisma.TaskWhereInput = {
    ...baseWhere,
    ...(cursor
      ? {
          OR: [
            { updatedAt: { lt: cursor.updatedAt } },
            { updatedAt: cursor.updatedAt, id: { lt: cursor.id } },
          ],
        }
      : {}),
  }

  const [rows, totalCount] = await Promise.all([
    db.task.findMany({
      where,
      select: {
        id: true,
        title: true,
        status: true,
        updatedAt: true,
        project: { select: { id: true, name: true } },
        assignee: { select: { name: true, email: true } },
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: pageSize + 1,
    }),
    getTaskCount(organizationId, filters),
  ])

  const hasNextPage = rows.length > pageSize
  const pageRows = hasNextPage ? rows.slice(0, pageSize) : rows
  const lastRow: CursorTaskRow | undefined = pageRows[pageRows.length - 1]

  return {
    tasks: pageRows.map(serializeTask),
    pagination: {
      pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      nextCursor: hasNextPage && lastRow ? encodeTaskCursor(lastRow) : null,
      hasNextPage,
    },
  }
}
