# Security baseline

## Authentication

- Custom JWT signed with HS256 via `jose`.
- `iss` and `aud` are set and verified on every request.
- Session JWT and cookie expire after seven days.
- Cookie flags: `HttpOnly`, `Secure` in production, `SameSite=Lax`, `Path=/`.

## Request protection

- State-changing API routes reject explicit cross-site origins via `lib/csrf.ts`.
- All request bodies and task query params are validated with Zod.
- Auth, tasks and health responses use `private, no-store` or `no-store`.
- Security headers: `X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy`, HSTS, COOP, CORP and nonce-based CSP.

## Known limitations

- Rate limiting uses Upstash Redis when `UPSTASH_REDIS_REST_URL` and
  `UPSTASH_REDIS_REST_TOKEN` are set; otherwise it falls back to an in-memory
  counter for local development.
- There is no JWT revocation/denylist yet.
- A nonce-based CSP is enforced in production; development keeps CSP disabled for HMR.
- Next.js is on 15.5.29; remaining transitive advisories are tracked in `docs/security-upgrade.md`.
