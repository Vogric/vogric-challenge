import { clearSessionCookie, revokeSessionFromCookie } from '@/lib/auth'
import { rejectCrossOrigin } from '@/lib/csrf'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const csrfError = rejectCrossOrigin(req)
  if (csrfError) return csrfError

  await revokeSessionFromCookie(req.headers.get('cookie') ?? undefined)

  const response = Response.json({ ok: true }, { status: 200, headers: { 'Cache-Control': 'no-store' } })
  clearSessionCookie(response)
  return response
}
