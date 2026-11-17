export function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}
