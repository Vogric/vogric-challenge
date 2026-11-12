'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNotifications } from '@/hooks/useNotifications'
import { taskKeys } from '@/lib/query-keys'
import type { Task, TasksResponse, TaskStatus } from '@/types/tasks'

type UpdateTaskStatusInput = {
  taskId: string
  status: TaskStatus
}

async function fetchTasks(orgId: string, page: number, pageSize: number): Promise<TasksResponse> {
  const params = new URLSearchParams({
    orgId,
    page: String(page),
    pageSize: String(pageSize),
  })

  const res = await fetch(`/api/dashboard/tasks?${params.toString()}`, {
    cache: 'no-store',
  })
  if (!res.ok) throw new Error('Failed to fetch tasks')

  const data = await res.json()
  return {
    tasks: Array.isArray(data?.tasks) ? data.tasks : [],
    pagination:
      data?.pagination ?? {
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
  const data = await res.json()
  return data.task
}

export function useTasks(orgId: string | null, page = 1, pageSize = 50) {
  return useQuery({
    queryKey: taskKeys.list(orgId, page, pageSize),
    queryFn: () => {
      if (!orgId) throw new Error('orgId is required to fetch tasks')
      return fetchTasks(orgId, page, pageSize)
    },
    enabled: Boolean(orgId),
    staleTime: 1000 * 60 * 2,
  })
}

export function useUpdateTaskStatus(orgId: string) {
  const queryClient = useQueryClient()
  const { addNotification } = useNotifications()
  const queryKey = taskKeys.byOrg(orgId)

  return useMutation({
    mutationFn: updateTaskStatus,
    onMutate: async (input) => {
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
    onError: (_error, _input, context) => {
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
