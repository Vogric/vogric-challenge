import { metadataOf } from './audit-metadata'
import { stringValue } from './audit-string-value'

export function isNoOpAuditEvent(metadata: unknown): boolean {
  const parsed = metadataOf(metadata)
  const from = parsed ? stringValue(parsed.from) : null
  const to = parsed ? stringValue(parsed.to) : null
  return Boolean(from && to && from === to)
}
