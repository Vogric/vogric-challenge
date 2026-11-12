import { SignJWT, jwtVerify } from 'jose'

const MIN_SECRET_LENGTH = 32
// An operational dashboard does not need 30-day sessions: seven days limits
// the window of a stolen token without forcing a login every workday.
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60

function readRequiredSecret(name: 'JWT_SECRET'): string {
  const value = process.env[name]

  if (!value || value.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `${name} must be set and contain at least ${MIN_SECRET_LENGTH} characters. ` +
        'Refusing to start with an insecure or missing secret.'
    )
  }

  return value
}

// Fail at startup (not on the first request) when auth configuration is
// insecure. There is no hardcoded fallback: a misconfigured deploy must break
// instead of signing tokens with a public secret.
const JWT_SECRET = new TextEncoder().encode(readRequiredSecret('JWT_SECRET'))
const JWT_ALG = 'HS256'
const JWT_ISSUER = 'saas-dashboard'
const JWT_AUDIENCE = 'saas-dashboard-web'

export type SessionPayload = {
  userId: string
  email: string
  name?: string | null
  role?: string
  jti?: string
  iat?: number
  exp?: number
}

export type SessionToken = {
  token: string
  jti: string
  expiresAt: Date
}

export async function createSessionToken(user: {
  id: string
  email: string
  name?: string | null
  role?: string
}): Promise<SessionToken> {
  const iat = Math.floor(Date.now() / 1000)
  const exp = iat + SESSION_MAX_AGE_SECONDS
  const jti = crypto.randomUUID()

  const token = await new SignJWT({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setJti(jti)
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .sign(JWT_SECRET)

  return { token, jti, expiresAt: new Date(exp * 1000) }
}

export async function createJWT(user: {
  id: string
  email: string
  name?: string | null
  role?: string
}) {
  return (await createSessionToken(user)).token
}

export async function verifyJWT(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: [JWT_ALG],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    })
    if (typeof payload.userId !== 'string' || typeof payload.email !== 'string') return null

    return {
      userId: payload.userId,
      email: payload.email,
      name: typeof payload.name === 'string' ? payload.name : null,
      role: typeof payload.role === 'string' ? payload.role : undefined,
      jti: typeof payload.jti === 'string' ? payload.jti : undefined,
      iat: payload.iat,
      exp: payload.exp,
    }
  } catch {
    return null
  }
}
