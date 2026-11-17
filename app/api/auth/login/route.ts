import { compare } from 'bcryptjs'
import { setSessionCookie } from '@/lib/auth'
import { createSessionToken } from '@/lib/jwt'
import { db } from '@/lib/db'
import { loginSchema } from '@/lib/validations/auth'
import { rejectCrossOrigin } from '@/lib/csrf'
import { getRequestId } from '@/lib/logger/get-request-id'
import { logError } from '@/lib/logger/log-error'

export const dynamic = 'force-dynamic'
export const preferredRegion = 'fra1'

const NO_STORE = { 'Cache-Control': 'no-store' }

// A real bcrypt hash keeps the unknown-email path close to the known-email
// path in cost, so response timing does not become an account oracle.
const DUMMY_PASSWORD_HASH = '$2a$10$OIksVVZVa2VVtLgDR8hoU.izs616UwsTvzwddvy6eOUVb8GVL5WP6'

function json(data: unknown, status: number) {
  return Response.json(data, { status, headers: NO_STORE })
}

export async function POST(req: Request) {
  const csrfError = rejectCrossOrigin(req)
  if (csrfError) return csrfError

  try {
    const body: unknown = await req.json()
    const parsed = loginSchema.safeParse(body)

    if (!parsed.success) {
      return json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        400
      )
    }

    const { email, password } = parsed.data

    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, password: true },
    })

    const passwordHash = user?.password ?? DUMMY_PASSWORD_HASH
    const isValid = await compare(password, passwordHash)
    if (!user || !user.password || !isValid) {
      return json({ error: 'Invalid credentials' }, 401)
    }

    const session = await createSessionToken({
      id: user.id,
      email: user.email,
      name: user.name,
    })

    await db.session.deleteMany({
      where: { userId: user.id, expires: { lt: new Date() } },
    })
    await db.session.create({
      data: {
        sessionToken: session.jti,
        userId: user.id,
        expires: session.expiresAt,
      },
    })

    const response = json(
      { user: { id: user.id, email: user.email, name: user.name } },
      200
    )
    setSessionCookie(response, session.token)

    return response
  } catch (error) {
    logError('auth.login.failed', {
      requestId: getRequestId(req),
      error: error instanceof Error ? error.message : String(error),
    })
    return json({ error: 'Internal server error' }, 500)
  }
}
