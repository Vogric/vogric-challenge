import { z } from 'zod'
import { rejectCrossOrigin } from '@/lib/csrf'
import { getRequestId, logInfo } from '@/lib/logger'
import { checkRateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

const MAX_REPORTS_PER_MINUTE = 30

function clientIdentifier(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwardedFor || req.headers.get('x-real-ip') || 'anonymous'
}

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

  // This endpoint is unauthenticated by design (metrics arrive before login),
  // so it needs its own bound: otherwise anyone can flood the logs with
  // attacker-controlled payloads and inflate ingestion cost.
  const limit = await checkRateLimit(
    `rate-limit:vitals:${clientIdentifier(req)}`,
    MAX_REPORTS_PER_MINUTE,
    60_000
  )
  if (limit.limited) {
    return new Response(null, { status: 429, headers: { 'Cache-Control': 'no-store' } })
  }

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
