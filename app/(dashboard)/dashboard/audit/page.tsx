import { redirect } from 'next/navigation'
import { Activity, ArrowRight, ListChecks, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { getRequestUser } from '@/lib/request-user'
import { getActiveMembership } from '@/lib/organizations'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

const ACTION_META: Record<string, { label: string; verb: string; icon: LucideIcon }> = {
  'task.status_changed': {
    label: 'Task status changed',
    verb: 'changed a task status',
    icon: ListChecks,
  },
  'membership.role_changed': {
    label: 'Member role changed',
    verb: 'changed a member role',
    icon: Users,
  },
  'organization.selected': {
    label: 'Organization selected',
    verb: 'switched the active workspace',
    icon: Activity,
  },
}

const STATUS_LABELS: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  VIEWER: 'Viewer',
}

const TOKEN_STYLES: Record<string, string> = {
  todo: 'border-slate-200 bg-slate-50 text-slate-700',
  in_progress: 'border-amber-200 bg-amber-50 text-amber-800',
  done: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  ADMIN: 'border-primary/25 bg-primary/10 text-primary',
  MANAGER: 'border-amber-200 bg-amber-50 text-amber-800',
  VIEWER: 'border-border bg-muted text-muted-foreground',
}

function relativeTime(date: Date): string {
  const seconds = Math.round((date.getTime() - Date.now()) / 1000)
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ]

  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return formatter.format(Math.round(seconds / size), unit)
  }
  return 'just now'
}

function metadataOf(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function Token({ value }: { value: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] ${
        TOKEN_STYLES[value] ?? 'border-border bg-muted text-muted-foreground'
      }`}
    >
      {STATUS_LABELS[value] ?? value}
    </span>
  )
}

export default async function AuditPage() {
  const user = await getRequestUser()
  if (!user) redirect('/auth/login')

  const activeMembership = await getActiveMembership(user.id)
  if (!activeMembership) {
    return (
      <div className="rounded-xl border border-border bg-card p-8">
        <h1 className="text-lg font-semibold">No organization assigned</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ask an administrator to add you to an organization.
        </p>
      </div>
    )
  }

  if (activeMembership.role !== 'ADMIN') {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-border bg-card p-8 text-center">
        <Activity className="mx-auto h-6 w-6 text-muted-foreground" aria-hidden="true" />
        <h1 className="mt-3 text-lg font-semibold">Audit log is restricted</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Only organization admins can view tenant audit events.
        </p>
      </div>
    )
  }

  const rawEvents = await db.auditEvent.findMany({
    where: { organizationId: activeMembership.organization.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true,
      action: true,
      entityType: true,
      entityId: true,
      metadata: true,
      createdAt: true,
      actor: { select: { email: true, name: true } },
    },
  })

  // Older records may contain no-op transitions from before the API guard was
  // added. They are not meaningful audit events, so do not surface them.
  const events = rawEvents.filter((event) => {
    const metadata = metadataOf(event.metadata)
    const from = metadata ? stringValue(metadata.from) : null
    const to = metadata ? stringValue(metadata.to) : null
    return !(from && to && from === to)
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Audit log</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tenant-scoped changes in {activeMembership.organization.name}, newest first.
          </p>
        </div>
        <span className="text-xs font-medium tabular-nums text-muted-foreground">
          {events.length} event{events.length === 1 ? '' : 's'} · last 100
        </span>
      </div>

      {events.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <Activity className="mx-auto h-6 w-6 text-muted-foreground" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium">No audit events yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Change a task status or a member role to generate one.
          </p>
        </div>
      ) : (
        <ol className="relative space-y-0">
          <span
            className="absolute bottom-5 left-[15px] top-5 w-px bg-border"
            aria-hidden="true"
          />
          {events.map((event) => {
            const meta = ACTION_META[event.action] ?? {
              label: event.action,
              verb: 'recorded an event',
              icon: Activity,
            }
            const Icon = meta.icon
            const metadata = metadataOf(event.metadata)
            const title = metadata ? stringValue(metadata.title) : null
            const from = metadata ? stringValue(metadata.from) : null
            const to = metadata ? stringValue(metadata.to) : null
            const entity = event.entityType.toLowerCase()

            return (
              <li key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
                <span className="relative z-10 mt-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm">
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1 rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_rgba(16,24,40,0.06),0_1px_3px_rgba(16,24,40,0.08)]">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        {meta.label}
                      </p>
                      <p className="mt-1 text-sm">
                        <span className="font-medium">{event.actor.name ?? event.actor.email}</span>{' '}
                        <span className="text-muted-foreground">{meta.verb}</span>
                        {title && <span className="font-medium"> · {title}</span>}
                      </p>
                    </div>
                    <time
                      dateTime={event.createdAt.toISOString()}
                      title={event.createdAt.toLocaleString('en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'medium',
                      })}
                      className="whitespace-nowrap text-xs text-muted-foreground"
                    >
                      {relativeTime(event.createdAt)}
                    </time>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      {entity}
                    </span>
                    {from && to && (
                      <span className="inline-flex items-center gap-1.5">
                        <Token value={from} />
                        <ArrowRight className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                        <Token value={to} />
                      </span>
                    )}
                  </div>

                  {metadata && (
                    <details className="group mt-3 border-t border-border pt-2">
                      <summary className="cursor-pointer list-none text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground hover:text-foreground">
                        Event details
                      </summary>
                      <pre className="mt-2 overflow-x-auto rounded-lg bg-muted/50 p-3 text-[10px] leading-5 text-muted-foreground">
                        {JSON.stringify({ action: event.action, entityId: event.entityId, metadata }, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
