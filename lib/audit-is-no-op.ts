import { parseAuditMetadata } from './audit-metadata'

export function isNoOpAuditEvent(action: string, metadata: unknown): boolean {
  const parsed = parseAuditMetadata(action, metadata)
  if (!parsed || parsed.kind === 'unknown') return false
  return parsed.from === parsed.to
}
