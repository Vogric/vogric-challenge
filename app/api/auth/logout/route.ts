import { clearSessionCookie } from '@/lib/auth'

export async function POST() {
  const response = Response.json({ ok: true }, { status: 200 })
  clearSessionCookie(response)
  return response
}
