const relativeTimeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
const RELATIVE_TIME_UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 31536000],
  ['month', 2592000],
  ['week', 604800],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
]

export function formatRelativeTime(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return typeof value === 'string' ? value : ''

  const seconds = Math.round((date.getTime() - Date.now()) / 1000)
  for (const [unit, size] of RELATIVE_TIME_UNITS) {
    if (Math.abs(seconds) >= size) {
      return relativeTimeFormatter.format(Math.round(seconds / size), unit)
    }
  }
  return 'just now'
}
