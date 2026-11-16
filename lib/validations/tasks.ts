import { z } from 'zod'

/**
 * Single source of truth for the task contract, shared by the API route, the
 * server data layer and the client.
 *
 * The input schemas live next to their routes; this one describes the *output*.
 * Parsing the response on the client is the point: before, a shape change in the
 * API silently degraded to "0 tasks" because the client fell back to a default
 * pagination object.
 */
export const taskStatusSchema = z.enum(['todo', 'in_progress', 'done'])

export const taskProjectSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
})

export const taskAssigneeSchema = z.object({
  name: z.string().nullable(),
  email: z.string(),
})

export const taskSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  status: taskStatusSchema,
  updatedAt: z.string().datetime({ offset: true }),
  project: taskProjectSchema,
  assignee: taskAssigneeSchema.nullable(),
})

export const taskFiltersSchema = z.object({
  q: z.string().trim().max(100).optional(),
  status: taskStatusSchema.optional(),
  projectId: z.string().min(1).optional(),
})

export const tasksPaginationSchema = z.object({
  pageSize: z.number().int().positive(),
  totalCount: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  nextCursor: z.string().nullable(),
  hasNextPage: z.boolean(),
})

export const tasksResponseSchema = z.object({
  tasks: z.array(taskSchema),
  pagination: tasksPaginationSchema,
})

export type TaskStatus = z.infer<typeof taskStatusSchema>
export type Task = z.infer<typeof taskSchema>
export type TasksPagination = z.infer<typeof tasksPaginationSchema>
export type TasksResponse = z.infer<typeof tasksResponseSchema>
export type TaskFilters = z.infer<typeof taskFiltersSchema>
