import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'

const jwtSecretString: string = process.env.JWT_SECRET ?? 'test-secret-min-32-chars-for-dev'
const JWT_SECRET = new TextEncoder().encode(jwtSecretString)
const JWT_ALG = 'HS256'

export type SessionPayload = {
  userId: string
  email: string
  name?: string | null
  role?: string
  iat?: number
  exp?: number
}

export async function createJWT(user: {
  id: string
  email: string
  name?: string | null
  role?: string
}) {
  const iat = Math.floor(Date.now() / 1000)
  const exp = iat + 30 * 24 * 60 * 60 // 30 days

  return await new SignJWT({ userId: user.id, email: user.email, name: user.name, role: user.role })
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .sign(JWT_SECRET)
}

export async function verifyJWT(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, { algorithms: [JWT_ALG] })
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

export function setSessionCookie(response: Response, token: string) {
  const isProduction = process.env.NODE_ENV === 'production'
  response.headers.set(
    'Set-Cookie',
    `session=${token}; Path=/; HttpOnly; SameSite=${isProduction ? 'None' : 'Lax'}; Max-Age=2592000${isProduction ? '; Secure' : ''}`
  )
}

export function clearSessionCookie(response: Response) {
  response.headers.set(
    'Set-Cookie',
    `session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  )
}

export async function getSessionFromCookie(cookieHeader: string | undefined): Promise<SessionPayload | null> {
  if (!cookieHeader) return null
  const cookies = cookieHeader.split('; ').reduce<Record<string, string>>((acc, c) => {
    const [key, ...valParts] = c.split('=')
    acc[key] = valParts.join('=')
    return acc
  }, {})
  const token = cookies['session']
  if (!token) return null
  return verifyJWT(token)
}

export async function getCurrentUserFromToken(token: string) {
  const payload = await verifyJWT(token)
  if (!payload) return null

  const user = await db.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, name: true },
  })
  return user
}

export async function getCurrentUserFromRequest(request: Request) {
  const cookieHeader = request.headers.get('cookie')
  if (!cookieHeader) return null

  const payload = await getSessionFromCookie(cookieHeader)
  if (!payload) return null

  const user = await db.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, name: true },
  })
  return user
}

export async function getCurrentUserFromServer() {
  const cookieStore = cookies()
  const token = cookieStore.get('session')?.value ?? undefined
  if (!token) return null

  return getCurrentUserFromToken(token)
}
