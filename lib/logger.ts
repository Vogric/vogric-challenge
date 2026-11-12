type LogContext = Record<string, unknown>

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


export function getRequestId(request: Request): string {
  return request.headers.get('x-request-id') ?? 'unknown'
}
