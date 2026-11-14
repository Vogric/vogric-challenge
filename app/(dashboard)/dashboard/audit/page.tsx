import { redirect } from 'next/navigation'
import { getRequestUser } from '@/lib/request-user'
import { getActiveMembership } from '@/lib/organizations'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function AuditPage() {
  const user = await getRequestUser()
  if (!user) redirect('/auth/login')

  const activeMembership = await getActiveMembership(user.id)
  if (!activeMembership) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-lg font-semibold">No organization assigned</h1>
      </div>
    )
  }

  if (activeMembership.role !== 'ADMIN') {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-lg font-semibold">Audit log is restricted</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Only organization admins can view audit events.
        </p>
      </div>
    )
  }

  const events = await db.auditEvent.findMany({
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Audit log</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Recent tenant-scoped changes in {activeMembership.organization.name}.
        </p>
      </div>

      {events.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No audit events yet. Change a task status or a member role to generate one.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="border-b bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">When</th>
                <th scope="col" className="px-4 py-3 font-medium">Actor</th>
                <th scope="col" className="px-4 py-3 font-medium">Action</th>
                <th scope="col" className="px-4 py-3 font-medium">Entity</th>
                <th scope="col" className="px-4 py-3 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {event.createdAt.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{event.actor.name ?? event.actor.email}</div>
                    <div className="text-xs text-muted-foreground">{event.actor.email}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{event.action}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {event.entityType}
                    {event.entityId ? ` · ${event.entityId}` : ''}
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-xs text-muted-foreground" title={JSON.stringify(event.metadata)}>
                    {event.metadata ? JSON.stringify(event.metadata) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
