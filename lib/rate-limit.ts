type RateLimitResult = {
  limited: boolean
  remaining: number
}

const localCounters = new Map<string, { count: number; resetTime: number }>()
const MAX_LOCAL_ENTRIES = 5000

function checkLocalRateLimit(key: string, max: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const current = localCounters.get(key)

  if (!current || now >= current.resetTime) {
    localCounters.set(key, { count: 1, resetTime: now + windowMs })
    return { limited: false, remaining: max - 1 }
  }

  if (current.count >= max) {
    return { limited: true, remaining: 0 }
  }

  current.count += 1

  if (localCounters.size > MAX_LOCAL_ENTRIES) {
    localCounters.forEach((value, entryKey) => {
      if (now >= value.resetTime) localCounters.delete(entryKey)
    })
  }

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
 * deployments). Falls back to an in-memory counter for local development.
 */
export async function checkRateLimit(
  key: string,
  max: number,
  windowMs: number
): Promise<RateLimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    return checkLocalRateLimit(key, max, windowMs)
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(['EVAL', INCREMENT_SCRIPT, '1', key, String(windowMs)]),
      cache: 'no-store',
    })

    if (!res.ok) throw new Error(`Upstash returned ${res.status}`)

    const data = (await res.json()) as { result?: unknown }
    if (typeof data.result !== 'number') throw new Error('Invalid Upstash response')

    return {
      limited: data.result > max,
      remaining: Math.max(0, max - data.result),
    }
  } catch {
    return checkLocalRateLimit(key, max, windowMs)
  }
}
