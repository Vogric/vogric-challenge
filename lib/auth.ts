import { cookies } from 'next/headers'
import { parseCookieHeader, SESSION_COOKIE } from '@/lib/cookies'
import { db } from '@/lib/db'
import { createJWT, verifyJWT, SESSION_MAX_AGE_SECONDS, type SessionPayload } from '@/lib/jwt'

export { createJWT, verifyJWT }
export type { SessionPayload }

export function setSessionCookie(response: Response, token: string) {
  const isProduction = process.env.NODE_ENV === 'production'
  // First-party dashboard: Lax is sufficient and avoids browsers rejecting
  // SameSite=None cookies. X-Frame-Options: DENY rules out cross-site embedding.
  response.headers.set(
    'Set-Cookie',
    `session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE_SECONDS}${isProduction ? '; Secure' : ''}`
  )
}

export function clearSessionCookie(response: Response) {
  const isProduction = process.env.NODE_ENV === 'production'
  response.headers.set(
    'Set-Cookie',
    `session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${isProduction ? '; Secure' : ''}`
  )
}

export async function getSessionFromCookie(cookieHeader: string | undefined): Promise<SessionPayload | null> {
  const token = parseCookieHeader(cookieHeader)[SESSION_COOKIE]
  if (!token) return null
  return verifyJWT(token)
}

async function getUserForSession(payload: SessionPayload) {
  if (!payload.jti) return null

  const session = await db.session.findUnique({
    where: { sessionToken: payload.jti },
    select: {
      expires: true,
      user: { select: { id: true, email: true, name: true } },
    },
  })

  if (!session || session.expires <= new Date()) return null
  return session.user
}

export async function getCurrentUserFromToken(token: string) {
  const payload = await verifyJWT(token)
  if (!payload) return null
  return getUserForSession(payload)
}

export async function getCurrentUserFromRequest(request: Request) {
  const cookieHeader = request.headers.get('cookie')
  if (!cookieHeader) return null

  const payload = await getSessionFromCookie(cookieHeader)
  if (!payload) return null
  return getUserForSession(payload)
}

export async function revokeSessionFromCookie(cookieHeader: string | undefined) {
  const payload = await getSessionFromCookie(cookieHeader)
  if (!payload?.jti) return

  await db.session.deleteMany({ where: { sessionToken: payload.jti } })
}

export async function getCurrentUserFromServer() {
  const cookieStore = await cookies()
  const token = cookieStore.get('session')?.value ?? undefined
  if (!token) return null

  return getCurrentUserFromToken(token)
}
