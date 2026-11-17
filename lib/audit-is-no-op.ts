import { parseAuditMetadata } from './audit-metadata'

export function isNoOpAuditEvent(metadata: unknown): boolean {
  const parsed = parseAuditMetadata(metadata)
  return Boolean(parsed?.from && parsed.to && parsed.from === parsed.to)
}
