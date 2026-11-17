import { clearSessionCookie, revokeSessionFromCookie } from '@/lib/auth'
import { rejectCrossOrigin } from '@/lib/csrf'
import { getRequestId } from '@/lib/logger/get-request-id'
import { logError } from '@/lib/logger/log-error'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const csrfError = rejectCrossOrigin(req)
  if (csrfError) return csrfError

  try {
    await revokeSessionFromCookie(req.headers.get('cookie') ?? undefined)
  } catch (error) {
    // Local logout must not be held hostage by a transient database failure.
    // The cookie is cleared below; the residual server session is logged for
    // incident follow-up and remains bounded by the JWT/session expiry.
    logError('auth.logout.revoke_failed', {
      requestId: getRequestId(req),
      error: error instanceof Error ? error.message : String(error),
    })
  }

  const response = Response.json({ ok: true }, { status: 200, headers: { 'Cache-Control': 'no-store' } })
  clearSessionCookie(response)
  return response
}
