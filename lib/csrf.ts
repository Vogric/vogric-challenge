const NO_STORE = { 'Cache-Control': 'no-store' }

/**
 * Rejects state-changing requests that explicitly declare a cross-site origin.
 * Requests without Origin/Sec-Fetch-Site (curl, server-to-server) are allowed;
 * browser form/fetch requests always include one of these headers.
 */
export function rejectCrossOrigin(request: Request): Response | null {
  const secFetchSite = request.headers.get('sec-fetch-site')
  if (secFetchSite && secFetchSite !== 'same-origin' && secFetchSite !== 'none') {
    return Response.json({ error: 'Cross-origin request blocked' }, { status: 403, headers: NO_STORE })
  }

  const origin = request.headers.get('origin')
  if (!origin) return null

  const host = request.headers.get('host')
  if (!host) {
    return Response.json({ error: 'Cross-origin request blocked' }, { status: 403, headers: NO_STORE })
  }

  try {
    return new URL(origin).host === host
      ? null
      : Response.json({ error: 'Cross-origin request blocked' }, { status: 403, headers: NO_STORE })
  } catch {
    return Response.json({ error: 'Cross-origin request blocked' }, { status: 403, headers: NO_STORE })
  }
}
