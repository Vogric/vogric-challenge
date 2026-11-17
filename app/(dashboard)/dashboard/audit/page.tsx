import { redirect } from 'next/navigation'
import { Activity } from 'lucide-react'
import { getRequestUser } from '@/lib/request-user'
import { getActiveMembership } from '@/lib/organizations'
import { isNoOpAuditEvent } from '@/lib/audit-is-no-op'
import { db } from '@/lib/db'
import { AuditTimeline } from './_components/audit-timeline'

export const dynamic = 'force-dynamic'

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

  const events = rawEvents.filter((event) => !isNoOpAuditEvent(event.action, event.metadata))

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
        <AuditTimeline events={events} />
      )}
    </div>
  )
}
