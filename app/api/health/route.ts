import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const NO_STORE = { 'Cache-Control': 'no-store' }

export async function GET() {
  let database = 'disconnected'

  try {
    await db.$queryRaw`SELECT 1`
    database = 'connected'
  } catch {
    database = 'disconnected'
  }

  const status = database === 'connected' ? 'ok' : 'error'
  const statusCode = database === 'connected' ? 200 : 503

  return Response.json(
    {
      status,
      timestamp: new Date().toISOString(),
      database,
    },
    { status: statusCode, headers: NO_STORE },
  )
}
