# Production auth checklist (Vercel)

## Context

The app uses a custom `jose` JWT implementation. The local production simulation (`next start` + `NODE_ENV=production`) works:
the login response sets an HttpOnly `session` cookie, `/api/auth/me` returns
200, the navbar shows the user and the dashboard renders real data after a
full reload. If Vercel still shows "Guest", check the deployment environment.

## Required Vercel variables (Production scope)

| Variable | Requirement |
|---|---|
| `JWT_SECRET` | ≥32 chars, same value used by login and middleware |
| `DATABASE_URL` | production PostgreSQL URL with SSL |

After changing any variable, trigger a **new deployment**: Vercel does not
hot-reload environment variables into an existing deployment.

## Cookie behavior

`POST /api/auth/login` must include:

```http
Set-Cookie: session=<jwt>; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800; Secure
```

`SameSite=Lax` is intentional: the dashboard is first-party and
`X-Frame-Options: DENY` rules out cross-site embedding. `SameSite=None` was
replaced because some browsers reject or partition it in production.

`GET /api/auth/me` must return:

```http
Cache-Control: private, no-store, max-age=0, must-revalidate
Vary: Cookie
```

and `200 {"user":...}` when the cookie is present.

## Quick production checks

1. DevTools → Network → `login` request → Response Headers → `Set-Cookie`.
2. DevTools → Application → Cookies → `session` exists, `HttpOnly`, `Secure`,
   `SameSite=Lax`, `Path=/`.
3. Open `/api/auth/me` in the same tab; it must return 200, not 401.
4. Reload `/dashboard`; the navbar must keep the email and the stat cards must
   load.
5. If `/api/auth/me` returns 401, inspect the request `Cookie` header. If it is
   missing, check the deployment domain and whether a proxy/CDN strips it.

## Common causes

- `JWT_SECRET` missing or changed in Vercel → middleware cannot verify tokens.
- Old deployment without the latest code → redeploy.
- Cookie set on a different host (preview URL vs custom domain) → log in on the
  same host you are testing.
- Browser privacy extension blocking `SameSite=None` → now uses `Lax`.
