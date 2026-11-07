import { getCurrentUserFromRequest } from '@/lib/auth'

export async function GET(req: Request) {
  const user = await getCurrentUserFromRequest(req)
  if (!user) {
    return Response.json({ error: 'Unauthenticated' }, { status: 401 })
  }
  return Response.json({ user }, { status: 200 })
}
