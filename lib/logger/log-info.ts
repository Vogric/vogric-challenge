import type { LogContext } from './types'

export function logInfo(event: string, context: LogContext = {}): void {
  console.info(
    JSON.stringify({
      level: 'info',
      event,
      timestamp: new Date().toISOString(),
      ...context,
    })
  )
}
