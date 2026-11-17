# Demo package

This is the 5-minute version of the project for recruiters, Staff engineers and
Forward Deployed Engineers. The goal is not to show every screen; it is to show
**how the system thinks**.

- Live: <https://vogric-challenge.vercel.app>
- Demo: `demo@example.com` / `password123`
- Read-only viewer: `viewer@example.com` / `password123`
- Product video: [`demo/saas-dashboard-demo.mp4`](./demo/saas-dashboard-demo.mp4)

## Before you present

- Open a clean incognito window; never present with a stale `active_org` cookie.
- Use 1440×900, browser zoom 100–110%, bookmarks bar hidden.
- Have a second tab on `/api/health` and a third on the Vercel deployment page.
- If the demo is live, wait for the deployment to be **Ready**, not “Building”.
- Keep the 60-second and 5-minute paths in your head. Do not improvise the order.

## 60 seconds — recruiter version

1. “This is a multi-tenant B2B dashboard built with Next.js App Router and
   Prisma. It is deployed on Vercel with a real database.”
2. Sign in. Point at the pending state: “The login has explicit feedback, not a
   dead button.”
3. Switch Acme → Globex. “The organization is validated server-side, the cache
   is cleared, and the whole workspace shows a transition state.”
4. Open Projects. “Server-side search and filters, cursor pagination,
   optimistic status updates, rollback on a forbidden mutation.”
5. Close: “128 tests, a 93% coverage gate, p95 189 ms warm. The README has the
   architecture and the trade-offs.”

Do not open Settings, Team, or the ADRs in the 60-second version.

## 5 minutes — technical version

| Time | Action | What you say | Proof |
|---|---|---|---|
| 0:00 | Dashboard | “One user, multiple organizations, different role in each.” | Acme ADMIN |
| 0:25 | Switch to Globex | “The tenant lives in an HttpOnly cookie, validated against membership. No client-trusted org id.” | Overlay + MANAGER |
| 0:50 | Switch to Initech | “Same user, VIEWER. The UI does not pre-disable the control; the API is the authority.” | 403 on mutation |
| 1:15 | Projects | “Cursor pagination, not offset. The cursor is opaque and ordered by `updatedAt + id`.” | Next page |
| 1:40 | Change a status | “Optimistic update with rollback; the KPI tag is invalidated server-side.” | Row updates |
| 2:00 | Audit | “Every sensitive mutation writes a tenant-scoped audit event.” | `task.status_changed` |
| 2:25 | Team | “Role management is ADMIN-only and the last admin is protected by a serializable transaction.” | Role control |
| 2:50 | Settings / mobile | “The product is complete, not a dashboard with dead links.” | Mobile nav |
| 3:10 | Command palette | “⌘K keeps navigation keyboard-first; Audit is omitted for non-admin members.” | Palette |
| 3:25 | `/api/health` | “Deploy is healthy and the database is connected.” | JSON |
| 3:45 | Tests | “100 unit, 28 E2E, axe and a coverage gate.” | Terminal |
| 4:15 | Load | “p95 189 ms warm, 0% errors at 20 VUs; cold-start p95 310 ms is documented.” | k6 output |
| 4:45 | ADRs | “The decisions and the rejected options are written down.” | ADR index |

## 15 minutes — Staff/FDE deep dive

After the 5-minute path, go in this order:

1. **Request lifecycle:** Edge middleware → Server Component → session/user
   query → membership → Prisma → Neon. Explain what is *not* in the middleware
   and why (ADR 0006).
2. **Tenant isolation:** resource-derived organization, membership check,
   cache invalidation, cross-tenant E2E.
3. **Auth:** `jti` + `Session`, revocation, 7-day cookie, hydration without an
   extra `/api/auth/me` request.
4. **Scale:** cursor pagination, composite indexes, count cache, `fra1`/Neon
   colocation.
5. **Deployment:** `VERCEL_ENV=production` → `prisma migrate deploy` → generate
   → build; previews skip migrations.
6. **Failure modes:** login failure, org switch timeout, 403 rollback, expired
   session, rate limit.
7. **What is intentionally missing:** Sentry/OTel DSN, SSO/SAML, invitations,
   visual regression. Say the cost and the plan.

## Failure and recovery script

If something fails during the demo, do not hide it:

- **Org switch slow:** “This is the 5-second safety timeout; if the server does
  not confirm, the select reverts instead of lying.”
- **403 on a task:** “That is the intended path: the API rejected a VIEWER.
  The optimistic row is rolling back.”
- **Login rate limit:** “This is the Upstash/local limiter; it is protecting
  credential stuffing.”
- **Cold start:** “First request includes serverless initialization; the warm
  p95 is in the README.”

## Closing line

> “The interesting part is not the dashboard. It is that the tenancy, the
> migrations, the cache, the security headers and the failure states are all
> explicit, tested, and documented. I can hand this to a client without
> explaining it from memory.”
