import { checkRateLimit } from '@/lib/rate-limit'
import { clientIp } from '@/lib/request-ip'

const WINDOW_MS = 60 * 1000
// Strict in production without making local/E2E login flows trip the limit.
const MAX_ATTEMPTS = process.env.NODE_ENV === 'production' ? 5 : 50

/**
 * Brute-force protection for the login endpoint.
 *
 * It lives in its own module rather than inside the route handler for two
 * reasons: it is the only piece of the middleware that needs to run before the
 * route (so a flood never reaches bcrypt), and keeping it separate lets the
 * middleware import one small function instead of the whole rate-limiting
 * stack.
 *
 * Returns a 429 response when the caller should be rejected, or null to
 * continue.
 */
export async function enforceLoginRateLimit(request: Request): Promise<Response | null> {
  const result = await checkRateLimit(
    `rate-limit:login:${clientIp(request)}`,
    MAX_ATTEMPTS,
    WINDOW_MS
  )

  if (!result.limited) return null

  return Response.json(
    { error: 'Too many requests. Please try again later.' },
    { status: 429, headers: { 'Cache-Control': 'no-store' } }
  )
}
