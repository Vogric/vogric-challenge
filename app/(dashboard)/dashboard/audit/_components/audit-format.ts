export function metadataOf(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

export function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

export function isNoOpAuditEvent(metadata: unknown): boolean {
  const parsed = metadataOf(metadata)
  const from = parsed ? stringValue(parsed.from) : null
  const to = parsed ? stringValue(parsed.to) : null
  return Boolean(from && to && from === to)
}
