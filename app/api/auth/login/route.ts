import { compare } from 'bcryptjs'
import { createJWT, setSessionCookie } from '@/lib/auth'
import { db } from '@/lib/db'
import { loginSchema } from '@/lib/validations/auth'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = loginSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { email, password } = parsed.data

    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, password: true },
    })

    if (!user || !user.password) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const isValid = await compare(password, user.password)
    if (!isValid) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const token = await createJWT({
      id: user.id,
      email: user.email,
      name: user.name,
    })

    const response = Response.json(
      { user: { id: user.id, email: user.email, name: user.name } },
      { status: 200 }
    )
    setSessionCookie(response, token)

    return response
  } catch (error) {
    console.error('Login failed', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
