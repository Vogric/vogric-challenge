import { compare } from 'bcryptjs'
import { setSessionCookie } from '@/lib/auth'
import { createSessionToken } from '@/lib/jwt'
import { db } from '@/lib/db'
import { loginSchema } from '@/lib/validations/auth'
import { rejectCrossOrigin } from '@/lib/csrf'
import { getRequestId, logError } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const NO_STORE = { 'Cache-Control': 'no-store' }

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

    if (!user || !user.password) {
      return json({ error: 'Invalid credentials' }, 401)
    }

    const isValid = await compare(password, user.password)
    if (!isValid) {
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
