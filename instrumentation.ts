import type { Instrumentation } from 'next'
import { logError } from '@/lib/logger'

/**
 * Next calls `register` once per server runtime, before the first request.
 *
 * Kept intentionally small: the goal is to have the hook in place — and to fail
 * loudly if required configuration is missing — instead of discovering a
 * misconfiguration on the first login attempt.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'edge') return

  const missing: string[] = []
  if (!process.env.JWT_SECRET) missing.push('JWT_SECRET')
  if (!process.env.DATABASE_URL) missing.push('DATABASE_URL')

  if (missing.length > 0) {
    // Fail fast: a server that cannot authenticate or reach the database should
    // never accept a request. `lib/jwt` already refuses to sign without a
    // secret; this surfaces the whole list at once, at boot.
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}

/**
 * Structured error reporting for every server-side failure, with the request id
 * that the middleware assigns and that API responses already log. This is the
 * hook a real deployment attaches to an error tracker (Sentry, OTel, Vercel
 * drains); today it writes one JSON line per error, which is what the rest of
 * the codebase emits.
 */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  logError('request.unhandled', {
    requestId: request.headers['x-request-id'] ?? 'unknown',
    path: request.path,
    method: request.method,
    routerKind: context.routerKind,
    routePath: context.routePath,
    routeType: context.routeType,
    error: error instanceof Error ? error.message : String(error),
  })
}
