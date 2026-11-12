import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useTasks, useUpdateTaskStatus, type TasksResponse } from '@/hooks/useTasks'
import { NotificationProvider } from '@/contexts/NotificationContext'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

const mockTasks = [
  { id: 'task-1', title: 'Task 1', status: 'todo' as const, updatedAt: '2024-01-01' },
  { id: 'task-2', title: 'Task 2', status: 'in_progress' as const, updatedAt: '2024-01-02' },
]

const mockResponse: TasksResponse = {
  tasks: mockTasks,
  pagination: { page: 1, pageSize: 50, totalCount: 2, totalPages: 1 },
}

describe('useTasks', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should fetch the paginated payload on mount', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response)

    const { result } = renderHook(() => useTasks('org-123'), {
      wrapper: (props: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          <NotificationProvider>{props.children}</NotificationProvider>
        </QueryClientProvider>
      ),
    })

    await waitForAsync(result, () => expect(result.current.data).toEqual(mockResponse))

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/dashboard/tasks?orgId=org-123&page=1&pageSize=50',
      expect.objectContaining({ cache: 'no-store' })
    )
  })

  it('should not fetch if orgId is null', async () => {
    const { result } = renderHook(() => useTasks(null), {
      wrapper: (props: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          <NotificationProvider>{props.children}</NotificationProvider>
        </QueryClientProvider>
      ),
    })

    expect(result.current.data).toBeUndefined()
    expect(mockFetch).not.toHaveBeenCalled()
  })
})

describe('useUpdateTaskStatus', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should optimistically update the current organization page and rollback on error', async () => {
    queryClient.setQueryData(['tasks', 'org-123', 1, 50], mockResponse)

    mockFetch.mockRejectedValueOnce(new Error('Server error'))

    const { result } = renderHook(() => useUpdateTaskStatus('org-123'), {
      wrapper: (props: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          <NotificationProvider>{props.children}</NotificationProvider>
        </QueryClientProvider>
      ),
    })

    await act(async () => {
      result.current.mutate({ taskId: 'task-1', status: 'done' })
    })

    expect(queryClient.getQueryData(['tasks', 'org-123', 1, 50])).toEqual(mockResponse)
  })

  it('should keep the optimistic update on success', async () => {
    queryClient.setQueryData(['tasks', 'org-123', 1, 50], mockResponse)

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        task: { id: 'task-1', title: 'Task 1', status: 'done', updatedAt: '2024-01-02' },
      }),
    } as Response)

    const { result } = renderHook(() => useUpdateTaskStatus('org-123'), {
      wrapper: (props: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          <NotificationProvider>{props.children}</NotificationProvider>
        </QueryClientProvider>
      ),
    })

    await act(async () => {
      result.current.mutate({ taskId: 'task-1', status: 'done' })
    })

    const current = queryClient.getQueryData<TasksResponse>(['tasks', 'org-123', 1, 50])
    expect(current?.tasks[0].status).toBe('done')
  })
})

async function waitForAsync(
  result: { current: { data: unknown } },
  condition: () => void
): Promise<void> {
  for (let i = 0; i < 50; i++) {
    try {
      condition()
      return
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 50))
    }
  }
  condition()
}
