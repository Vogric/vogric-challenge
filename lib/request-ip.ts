/**
 * Client IP resolution for rate limiting.
 *
 * `x-forwarded-for` is a list; the left-most entry is the original client as
 * appended by the first trusted proxy. On Vercel that header is set by the
 * platform, so it cannot be spoofed by the browser.
 */
export function clientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwardedFor || request.headers.get('x-real-ip') || 'anonymous'
}
