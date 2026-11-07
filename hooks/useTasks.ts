'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNotifications } from '@/hooks/useNotifications'

type TaskStatus = 'todo' | 'in_progress' | 'done'

type Task = {
  id: string
  title: string
  status: TaskStatus
  updatedAt: string
}

type UpdateTaskStatusInput = {
  taskId: string
  status: TaskStatus
}

async function fetchTasks(orgId: string): Promise<Task[]> {
  const res = await fetch(`/api/dashboard/tasks?orgId=${encodeURIComponent(orgId)}`, {
    cache: 'no-store',
  })
  if (!res.ok) throw new Error('Failed to fetch tasks')
  return res.json()
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

export function useTasks(orgId: string | null) {
  return useQuery({
    queryKey: ['tasks', orgId],
    queryFn: () => fetchTasks(orgId!),
    enabled: !!orgId,
    staleTime: 1000 * 60 * 2,
  })
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient()
  const { addNotification } = useNotifications()

  return useMutation({
    mutationFn: updateTaskStatus,
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', input.taskId] })

      const previousTasks = queryClient.getQueryData<Task[]>(['tasks', input.taskId])

      queryClient.setQueryData<Task[]>(['tasks', input.taskId], (old) =>
        old?.map((t) => (t.id === input.taskId ? { ...t, status: input.status } : t)) ?? []
      )

      return { previousTasks }
    },
    onError: (err, input, context) => {
      queryClient.setQueryData<Task[]>(['tasks', input.taskId], context?.previousTasks)
      addNotification({ type: 'error', message: 'Failed to update task. Reverting changes.' })
    },
    onSettled: (_, __, input) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', input.taskId] })
    },
  })
}
