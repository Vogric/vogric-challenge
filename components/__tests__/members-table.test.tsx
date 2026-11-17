import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MembersTable } from '@/components/organizations/members-table'

const { refreshMock } = vi.hoisted(() => ({ refreshMock: vi.fn() }))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: refreshMock }),
}))

const members = [
  {
    id: 'membership-1',
    role: 'ADMIN' as const,
    createdAt: '2026-01-01T00:00:00.000Z',
    user: { id: 'user-1', email: 'demo@example.com', name: 'Demo User' },
  },
]

describe('MembersTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('updates a role and refreshes server data', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ membership: { id: 'membership-1', role: 'MANAGER' } }),
    } as Response)

    render(
      <MembersTable members={members} canManage currentUserEmail="demo@example.com" />
    )

    fireEvent.change(screen.getByLabelText('Role for demo@example.com'), {
      target: { value: 'MANAGER' },
    })

    await waitFor(() => expect(fetch).toHaveBeenCalledWith(
      '/api/organizations/members/membership-1',
      expect.objectContaining({ method: 'PATCH' })
    ))
    await waitFor(() => expect(refreshMock).toHaveBeenCalledTimes(1))
  })

  it('reverts the optimistic role and shows an API error', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'An organization must keep at least one admin.' }),
    } as Response)

    render(
      <MembersTable members={members} canManage currentUserEmail="demo@example.com" />
    )

    const select = screen.getByLabelText('Role for demo@example.com')
    fireEvent.change(select, { target: { value: 'MANAGER' } })

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('at least one admin'))
    expect(select).toHaveValue('ADMIN')
  })
})
