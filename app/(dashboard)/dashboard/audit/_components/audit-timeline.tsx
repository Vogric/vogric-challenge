import { AuditEventRow, type AuditEvent } from './audit-event-row'

export function AuditTimeline({ events }: { events: AuditEvent[] }) {
  return (
    <ol className="relative space-y-0">
      <span className="absolute bottom-5 left-[15px] top-5 w-px bg-border" aria-hidden="true" />
      {events.map((event) => (
        <AuditEventRow key={event.id} event={event} />
      ))}
    </ol>
  )
}
