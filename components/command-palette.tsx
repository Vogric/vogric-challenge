'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { filterCommands } from './command-palette/filter-commands'
import { getCommands } from './command-palette/command-catalog'
import type { Command } from './command-palette/command'
import { CommandFooter } from './command-palette/command-footer'
import { CommandSearch } from './command-palette/command-search'
import { CommandList } from './command-palette/command-list'

type CommandPaletteProps = {
  open: boolean
  onClose: () => void
  canViewAudit: boolean
}

export function CommandPalette({ open, onClose, canViewAudit }: CommandPaletteProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const commands = useMemo(() => getCommands(canViewAudit), [canViewAudit])
  const filtered = useMemo(() => filterCommands(commands, query), [commands, query])

  useEffect(() => {
    if (!open) return

    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    setQuery('')
    setActiveIndex(0)

    const frame = requestAnimationFrame(() => inputRef.current?.focus())

    return () => {
      cancelAnimationFrame(frame)
      document.body.style.overflow = originalOverflow
      previousFocus.current?.focus()
    }
  }, [open])

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  if (!open) return null

  function run(command: Command | undefined) {
    if (!command) return
    onClose()
    router.push(command.href)
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => (filtered.length === 0 ? 0 : (index + 1) % filtered.length))
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) =>
        filtered.length === 0 ? 0 : (index - 1 + filtered.length) % filtered.length
      )
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      run(filtered[activeIndex])
      return
    }
    if (event.key === 'Tab') {
      // Keep focus inside the dialog: only the search field and close button
      // are tabbable, so cycle between them instead of escaping to the page.
      event.preventDefault()
      const focusables = [inputRef.current, closeButtonRef.current].filter(
        Boolean
      ) as HTMLElement[]
      const currentIndex = focusables.indexOf(document.activeElement as HTMLElement)
      const nextIndex = event.shiftKey
        ? (currentIndex - 1 + focusables.length) % focusables.length
        : (currentIndex + 1) % focusables.length
      focusables[nextIndex]?.focus()
    }
  }

  const activeOptionId = filtered[activeIndex] ? `command-option-${filtered[activeIndex].id}` : undefined

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-foreground/20 px-4 pt-[12vh] backdrop-blur-[2px]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="command-palette-title"
        onKeyDown={handleKeyDown}
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-[0_24px_80px_-16px_rgba(16,24,40,0.35)]"
      >
        <h2 id="command-palette-title" className="sr-only">
          Command palette
        </h2>

        <CommandSearch
          inputRef={inputRef}
          closeButtonRef={closeButtonRef}
          query={query}
          activeOptionId={activeOptionId}
          onChange={setQuery}
          onClose={onClose}
        />

        <CommandList
          commands={filtered}
          activeIndex={activeIndex}
          onActiveChange={setActiveIndex}
          onSelect={run}
        />

        <CommandFooter />
      </div>
    </div>
  )
}
