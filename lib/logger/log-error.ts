import type { LogContext } from './types'

export function logError(event: string, context: LogContext = {}): void {
  console.error(
    JSON.stringify({
      level: 'error',
      event,
      timestamp: new Date().toISOString(),
      ...context,
    })
  )
}
