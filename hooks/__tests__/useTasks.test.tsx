import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useTasks, useUpdateTaskStatus } from '@/hooks/useTasks'
import { taskKeys } from '@/lib/query-keys'
import type { TasksResponse } from '@/types/tasks'
import { NotificationProvider } from '@/contexts/NotificationContext'

const mockFetch = vi.fn()
global.fetch = mockFetch

const mockTasks = [
  {
    id: 'task-1',
    title: 'Task 1',
    status: 'todo' as const,
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'task-2',
    title: 'Task 2',
    status: 'in_progress' as const,
    updatedAt: '2024-01-02T00:00:00.000Z',
  },
]

const mockResponse: TasksResponse = {
  tasks: mockTasks,
  pagination: {
    pageSize: 50,
    totalCount: 2,
    totalPages: 1,
    nextCursor: null,
    hasNextPage: false,
  },
}

function wrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <NotificationProvider>{children}</NotificationProvider>
      </QueryClientProvider>
    )
  }
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

describe('useTasks', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = makeQueryClient()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('fetches the cursor-paginated payload on mount', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response)

    const { result } = renderHook(() => useTasks('org-123'), {
      wrapper: wrapper(queryClient),
    })

    await waitFor(() => expect(result.current.data).toEqual(mockResponse))

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/dashboard/tasks?orgId=org-123&pageSize=50',
      expect.objectContaining({ cache: 'no-store', signal: expect.any(AbortSignal) })
    )
  })

  it('sends the cursor instead of a page number', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response)

    const { result } = renderHook(() => useTasks('org-123', 50, 'cursor-abc'), {
      wrapper: wrapper(queryClient),
    })

    await waitFor(() => expect(result.current.data).toEqual(mockResponse))

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/dashboard/tasks?orgId=org-123&pageSize=50&cursor=cursor-abc',
      expect.objectContaining({ cache: 'no-store' })
    )
  })

  it('surfaces a contract violation instead of silently showing zero tasks', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ tasks: [{ id: 'task-1' }] }),
    } as Response)

    const { result } = renderHook(() => useTasks('org-123'), {
      wrapper: wrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.data).toBeUndefined()
  })

  it('does not fetch when orgId is null', async () => {
    const { result } = renderHook(() => useTasks(null), {
      wrapper: wrapper(queryClient),
    })

    expect(result.current.data).toBeUndefined()
    expect(mockFetch).not.toHaveBeenCalled()
  })
})

describe('useUpdateTaskStatus', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = makeQueryClient()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('rolls back the optimistic update when the request fails', async () => {
    queryClient.setQueryData(taskKeys.cursor('org-123', null), mockResponse)
    mockFetch.mockRejectedValueOnce(new Error('Server error'))

    const { result } = renderHook(() => useUpdateTaskStatus('org-123'), {
      wrapper: wrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync({ taskId: 'task-1', status: 'done' }).catch(() => {})
    })

    await waitFor(() =>
      expect(queryClient.getQueryData(taskKeys.cursor('org-123', null))).toEqual(mockResponse)
    )
  })

  it('keeps the optimistic update on success', async () => {
    queryClient.setQueryData(taskKeys.cursor('org-123', null), mockResponse)

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        task: {
          id: 'task-1',
          title: 'Task 1',
          status: 'done',
          updatedAt: '2024-01-02T00:00:00.000Z',
        },
      }),
    } as Response)

    const { result } = renderHook(() => useUpdateTaskStatus('org-123'), {
      wrapper: wrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate({ taskId: 'task-1', status: 'done' })
    })

    await waitFor(() => {
      const current = queryClient.getQueryData<TasksResponse>(taskKeys.cursor('org-123', null))
      expect(current?.tasks[0].status).toBe('done')
    })
  })
})
