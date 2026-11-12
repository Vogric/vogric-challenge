import { getCurrentUserFromRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const NO_STORE = {
  'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
  Vary: 'Cookie',
}

export async function GET(req: Request) {
  const user = await getCurrentUserFromRequest(req)
  if (!user) {
    return Response.json({ error: 'Unauthenticated' }, { status: 401, headers: NO_STORE })
  }
  return Response.json({ user }, { status: 200, headers: NO_STORE })
}
