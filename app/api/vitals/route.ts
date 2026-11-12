import { z } from 'zod'
import { rejectCrossOrigin } from '@/lib/csrf'
import { getRequestId, logInfo } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  name: z.string().min(1).max(50),
  value: z.number().finite(),
  rating: z.enum(['good', 'needs-improvement', 'poor']).optional(),
  id: z.string().max(100).optional(),
  navigationType: z.string().max(50).optional(),
})

export async function POST(req: Request) {
  const csrfError = rejectCrossOrigin(req)
  if (csrfError) return csrfError

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Invalid payload' }, { status: 400 })
  }

  logInfo('web_vitals.metric', { ...parsed.data, requestId: getRequestId(req) })
  return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } })
}
