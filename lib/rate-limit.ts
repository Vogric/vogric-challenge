type RateLimitResult = {
  limited: boolean
  remaining: number
}

const localCounters = new Map<string, { count: number; resetTime: number }>()
const MAX_LOCAL_ENTRIES = 5000
const UPSTASH_TIMEOUT_MS = 1000

function pruneExpired(now: number): void {
  if (localCounters.size <= MAX_LOCAL_ENTRIES) return
  localCounters.forEach((value, entryKey) => {
    if (now >= value.resetTime) localCounters.delete(entryKey)
  })
}

function checkLocalRateLimit(key: string, max: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  pruneExpired(now)

  const current = localCounters.get(key)

  if (!current || now >= current.resetTime) {
    localCounters.set(key, { count: 1, resetTime: now + windowMs })
    return { limited: false, remaining: max - 1 }
  }

  if (current.count >= max) {
    return { limited: true, remaining: 0 }
  }

  current.count += 1
  return { limited: false, remaining: max - current.count }
}

const INCREMENT_SCRIPT = `
local current = redis.call("INCR", KEYS[1])
if current == 1 then
  redis.call("PEXPIRE", KEYS[1], ARGV[1])
end
return current
`

/**
 * Uses Upstash Redis when configured (required for distributed/serverless
 * deployments). Falls back to an in-memory counter for local development and as
 * a degraded mode.
 *
 * The fallback is deliberate and documented: a Redis outage must not lock every
 * user out of the product, but it must not be silent either. It degrades to
 * per-instance limits, which is a real (if weaker) bound, and the failure is
 * logged with a stable event name so the degradation is alertable.
 *
 * The upstream call is bounded by a timeout: without it a hanging request would
 * hold the login open instead of failing over.
 */
export async function checkRateLimit(
  key: string,
  max: number,
  windowMs: number
): Promise<RateLimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL
  // Read from the environment at call time; never inlined in source.
  const upstashAuth = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !upstashAuth) {
    return checkLocalRateLimit(key, max, windowMs)
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${upstashAuth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(['EVAL', INCREMENT_SCRIPT, '1', key, String(windowMs)]),
      cache: 'no-store',
      signal: AbortSignal.timeout(UPSTASH_TIMEOUT_MS),
    })

    if (!res.ok) throw new Error(`Upstash returned ${res.status}`)

    const data = (await res.json()) as { result?: unknown }
    if (typeof data.result !== 'number') throw new Error('Invalid Upstash response')

    return {
      limited: data.result > max,
      remaining: Math.max(0, max - data.result),
    }
  } catch (error) {
    console.error(
      JSON.stringify({
        level: 'error',
        event: 'rate_limit.upstash_unavailable',
        timestamp: new Date().toISOString(),
        mode: 'local_fallback',
        error: error instanceof Error ? error.message : String(error),
      })
    )
    return checkLocalRateLimit(key, max, windowMs)
  }
}
