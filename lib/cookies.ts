/**
 * Cookie header parsing lived in three places (middleware, `lib/auth` and an
 * inline reduce in the request helper), each with slightly different trimming
 * rules. One implementation, no dependencies, safe for the edge runtime.
 */
export function parseCookieHeader(
  cookieHeader: string | null | undefined
): Record<string, string> {
  if (!cookieHeader) return {}

  return cookieHeader.split(';').reduce<Record<string, string>>((acc, part) => {
    const trimmed = part.trim()
    if (!trimmed) return acc

    const equalsIndex = trimmed.indexOf('=')
    if (equalsIndex === -1) return acc

    const key = trimmed.slice(0, equalsIndex).trim()
    if (!key) return acc

    acc[key] = trimmed.slice(equalsIndex + 1)
    return acc
  }, {})
}

export const SESSION_COOKIE = 'session'

export function readSessionToken(cookieHeader: string | null | undefined): string | undefined {
  return parseCookieHeader(cookieHeader)[SESSION_COOKIE]
}
