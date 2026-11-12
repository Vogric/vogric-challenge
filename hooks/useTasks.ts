'use client'

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from '@tanstack/react-query'
import { useNotifications } from '@/hooks/useNotifications'
import { taskKeys } from '@/lib/query-keys'
import { TASK_PAGE_SIZE, type Task, type TasksResponse, type TaskStatus } from '@/types/tasks'

type UpdateTaskStatusInput = {
  taskId: string
  status: TaskStatus
}

type UpdateTaskContext = {
  previousTasks: Array<[QueryKey, TasksResponse | undefined]>
}

type TasksApiPayload = {
  tasks?: Task[]
  pagination?: unknown
}

function isTasksPagination(value: unknown): value is TasksResponse['pagination'] {
  if (typeof value !== 'object' || value === null) return false

  const candidate = value as Record<string, unknown>
  return ['page', 'pageSize', 'totalCount', 'totalPages'].every(
    (key) => typeof candidate[key] === 'number'
  )
}

async function fetchTasks(
  orgId: string,
  page: number,
  pageSize: number,
  cursor: string | null,
  signal?: AbortSignal
): Promise<TasksResponse> {
  const params = new URLSearchParams({
    orgId,
    pageSize: String(pageSize),
  })
  if (cursor) params.set('cursor', cursor)

  const res = await fetch(`/api/dashboard/tasks?${params.toString()}`, {
    cache: 'no-store',
    signal,
  })
  if (!res.ok) throw new Error('Failed to fetch tasks')

  const data = (await res.json()) as TasksApiPayload
  return {
    tasks: Array.isArray(data.tasks) ? data.tasks : [],
    pagination: isTasksPagination(data.pagination)
      ? data.pagination
      : {
          page,
          pageSize,
          totalCount: 0,
          totalPages: 0,
        },
  }
}

async function updateTaskStatus(input: UpdateTaskStatusInput): Promise<Task> {
  const res = await fetch(`/api/dashboard/tasks/${input.taskId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: input.status }),
  })
  if (!res.ok) throw new Error('Failed to update task')
  const data = (await res.json()) as { task: Task }
  return data.task
}

export function useTasks(
  orgId: string | null,
  page = 1,
  pageSize = TASK_PAGE_SIZE,
  cursor: string | null = null
) {
  return useQuery({
    queryKey: taskKeys.cursor(orgId, cursor, page),
    queryFn: ({ signal }) => {
      if (!orgId) throw new Error('orgId is required to fetch tasks')
      // TanStack Query aborts this signal when the page changes, so a slow
      // response for an obsolete page can never overwrite the latest one.
      return fetchTasks(orgId, page, pageSize, cursor, signal)
    },
    enabled: Boolean(orgId),
    staleTime: 1000 * 60 * 2,
    placeholderData: keepPreviousData,
  })
}

export function useUpdateTaskStatus(orgId: string) {
  const queryClient = useQueryClient()
  const { addNotification } = useNotifications()
  const queryKey = taskKeys.byOrg(orgId)

  return useMutation<Task, Error, UpdateTaskStatusInput, UpdateTaskContext>({
    mutationFn: updateTaskStatus,
    onMutate: async (input): Promise<UpdateTaskContext> => {
      await queryClient.cancelQueries({ queryKey })

      const previousTasks = queryClient.getQueriesData<TasksResponse>({ queryKey })

      queryClient.setQueriesData<TasksResponse>({ queryKey }, (old) => {
        if (!old) return old
        return {
          ...old,
          tasks: old.tasks.map((task) =>
            task.id === input.taskId ? { ...task, status: input.status } : task
          ),
        }
      })

      return { previousTasks }
    },
    onError: (_error, _input, context: UpdateTaskContext | undefined) => {
      context?.previousTasks.forEach(([key, data]) => {
        queryClient.setQueryData(key, data)
      })
      addNotification({ type: 'error', message: 'Failed to update task. Reverting changes.' })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })
}
