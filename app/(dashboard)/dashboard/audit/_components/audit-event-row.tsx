import { Activity, ArrowRight, ListChecks, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { metadataOf } from './audit-metadata'
import { stringValue } from './audit-string-value'
import { formatRelativeTime } from '@/lib/format-relative-time'

export type AuditEvent = {
  id: string
  action: string
  entityType: string
  entityId: string | null
  metadata: unknown
  createdAt: Date
  actor: { email: string; name: string | null }
}

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

export function AuditEventRow({ event }: { event: AuditEvent }) {
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
    <li className="relative flex gap-4 pb-6 last:pb-0">
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
            {formatRelativeTime(event.createdAt)}
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
}
