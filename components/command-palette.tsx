'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowDown,
  ArrowUp,
  CornerDownLeft,
  FolderKanban,
  History,
  LayoutDashboard,
  Search,
  Settings,
  Users,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type Command = {
  id: string
  label: string
  description: string
  href: string
  icon: LucideIcon
  keywords: string
}

const BASE_COMMANDS: Command[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'Workspace overview and operational metrics',
    href: '/dashboard',
    icon: LayoutDashboard,
    keywords: 'home overview metrics kpi',
  },
  {
    id: 'projects',
    label: 'Projects',
    description: 'Browse and filter every task',
    href: '/dashboard/projects',
    icon: FolderKanban,
    keywords: 'tasks work items projects filters',
  },
  {
    id: 'team',
    label: 'Team',
    description: 'Members, roles, and access',
    href: '/dashboard/members',
    icon: Users,
    keywords: 'members people roles permissions',
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Account, workspace, and security',
    href: '/dashboard/settings',
    icon: Settings,
    keywords: 'profile organization security account',
  },
]

const AUDIT_COMMAND: Command = {
  id: 'audit',
  label: 'Audit log',
  description: 'Tenant-scoped change history',
  href: '/dashboard/audit',
  icon: History,
  keywords: 'events history security activity',
}

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

  const commands = useMemo(
    () => (canViewAudit ? [...BASE_COMMANDS, AUDIT_COMMAND] : BASE_COMMANDS),
    [canViewAudit]
  )
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return commands
    return commands.filter((command) =>
      `${command.label} ${command.description} ${command.keywords}`.toLowerCase().includes(normalized)
    )
  }, [commands, query])

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

        <div className="command-search-row flex items-center gap-3 border-b border-border px-4">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search pages and actions..."
            aria-label="Search commands"
            aria-controls="command-list"
            aria-activedescendant={activeOptionId}
            className="command-search-input h-14 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close command palette"
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="max-h-[min(420px,55vh)] overflow-y-auto p-2">
          <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Navigate
          </p>
          {filtered.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              No matching commands.
            </p>
          ) : (
            <div id="command-list" role="listbox" aria-label="Commands">
              {filtered.map((command, index) => (
                <div
                  key={command.id}
                  id={`command-option-${command.id}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => run(command)}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                    index === activeIndex ? 'bg-muted text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
                      index === activeIndex
                        ? 'border-border bg-card text-foreground'
                        : 'border-transparent bg-muted/60'
                    }`}
                  >
                    <command.icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-foreground">{command.label}</span>
                    <span className="block truncate text-xs text-muted-foreground">{command.description}</span>
                  </span>
                  {index === activeIndex && (
                    <CornerDownLeft className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/30 px-4 py-2.5 text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <ArrowUp className="h-3 w-3" aria-hidden="true" />
            <ArrowDown className="h-3 w-3" aria-hidden="true" />
            navigate
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CornerDownLeft className="h-3 w-3" aria-hidden="true" />
            open
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="rounded border border-border bg-card px-1 py-0.5 font-mono">esc</span>
            close
          </span>
        </div>
      </div>
    </div>
  )
}
