import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { CommandPalette } from '@/components/command-palette'

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

describe('CommandPalette', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0)
      return 0
    })
    vi.stubGlobal('cancelAnimationFrame', () => {})
  })

  it('filters commands and opens the selected destination with Enter', () => {
    const onClose = vi.fn()
    render(<CommandPalette open onClose={onClose} canViewAudit />)

    expect(screen.getByRole('dialog', { name: 'Command palette' })).toBeInTheDocument()
    const input = screen.getByLabelText('Search commands')
    fireEvent.change(input, { target: { value: 'team' } })

    expect(screen.getByRole('option', { name: /Team/ })).toBeInTheDocument()
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(pushMock).toHaveBeenCalledWith('/dashboard/members')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not expose Audit to non-admin members', () => {
    render(<CommandPalette open onClose={vi.fn()} canViewAudit={false} />)

    expect(screen.queryByRole('option', { name: /Audit/ })).not.toBeInTheDocument()
  })

  it('closes with Escape', () => {
    const onClose = vi.fn()
    render(<CommandPalette open onClose={onClose} canViewAudit />)

    fireEvent.keyDown(screen.getByRole('dialog', { name: 'Command palette' }), {
      key: 'Escape',
    })

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
