# Remediation sprint — saas-dashboard

Fecha: 2026-11-12
Alcance: P0 (seguridad, aislamiento, funcionalidad, RBAC) + P1 (datos reales, lint/CI).

## Estado por punto

| Punto | Estado | Evidencia |
|---|---|---|
| P0.1 JWT/Auth hardening | Hecho | `lib/auth.ts` exige `JWT_SECRET` y `NEXTAUTH_SECRET` de ≥32 caracteres; no hay fallback. |
| P0.2 Environment isolation | Hecho | `DATABASE_URL_TEST`; Playwright en puerto 3100 con `globalSetup` que resetea y seedea solo una DB cuyo nombre contiene `test`; `seed.ts` aborta con `NODE_ENV=production`. |
| P0.3 Tasks API + hook + table | Hecho | Zod coerce/default, 400 claro, respuesta `{ tasks, pagination }`, cache key por organización, tabla paginada estándar. |
| P0.4 RBAC | Hecho | `PATCH /api/dashboard/tasks/[id]` exige `ADMIN` o `MANAGER`; `VIEWER` recibe 403. |
| P1.5 Dashboard real | Hecho | `Promise.all` de Prisma filtrado por la organización activa; sin números hardcodeados. |
| P1.6 Lint + CI | Hecho | `.eslintrc.json`, `lint --max-warnings=0`, `.github/workflows/ci.yml`. |
| P1.7 Migraciones versionadas | Hecho | Baseline `20241104120000_baseline_schema_sync`; `prisma/migrations/` fuera de `.gitignore`; E2E usa `migrate reset`. |
| P1.8 Security headers | Hecho | `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` y `Permissions-Policy` en `next.config.js`. |
| P1.9 Sesión de 7 días | Hecho | JWT y cookie con `Max-Age=604800`; antes 30 días. |

## Verificación

```text
npm run typecheck   -> OK
npm run lint        -> OK (0 warnings)
npm test            -> 26 unit tests passed
npm run test:e2e    -> 7 E2E tests passed
npm run build       -> OK
npx prisma migrate reset --force --skip-seed (test DB) -> OK
```

La suite E2E corre en `http://localhost:3100` contra `saas_dashboard_test`
(PostgreSQL local) y verifica que el dashboard muestre 5 proyectos, 14 tareas
pendientes y 1 miembro. Producción tiene 1.348 pendientes, así que la aserción
también demuestra el aislamiento de la base.

## Cambios de comportamiento

- `JWT_SECRET` y `NEXTAUTH_SECRET` son obligatorios desde el arranque. Un deploy
  sin ellos falla en vez de firmar tokens con un secreto público.
- `npm run seed` se niega a ejecutarse con `NODE_ENV=production`.
- `GET /api/dashboard/tasks` acepta `page` y `pageSize` opcionales; sin
  parámetros usa 1 y 50. Valores no numéricos devuelven 400, no 500.
- La tabla de tareas ya no usa virtualización: muestra 50 filas por página con
  controles Previous/Next. La virtualización queda como trabajo futuro con tests
  de performance propios.
- El dashboard y Projects resuelven la organización desde la membership del
  usuario (la más antigua) en vez de `acme-corp` hardcodeado.
- El navbar muestra el email real del usuario; el login hidrata la cache de
  `currentUser` para evitar el “Guest” transitorio.
- La sesión JWT y la cookie expiran a los 7 días (antes 30).
- Todas las respuestas incluyen `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin` y
  `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
- `prisma/migrations/` ahora contiene un baseline limpio que refleja
  `schema.prisma` (incluye `Task.createdAt/updatedAt` y todos los índices).

## Migraciones: nota de adopción

El baseline reemplaza las dos migraciones antiguas. En una base existente con
historial de migraciones previo hay que reconciliar `_prisma_migrations` antes
de un `migrate deploy` (o recrear la base desde el baseline, que es lo
recomendado para este demo). No se ejecutó `migrate reset` sobre la base de
desarrollo/Neon: la validación se hizo sobre `saas_dashboard_test`.

## Deuda pendiente (no incluida en este sprint)

1. **CVEs**: `next@14.2.35` tiene advisories críticos (RCE en Image
   Optimization, SSRF, cache poisoning, XSS, DoS). `zod@3.25.76` y
   `vitest@1.6.1` también. Ver `docs/security-upgrade.md`.
3. **CSRF/CSP**: quedan pendientes la validación de `Origin`/token CSRF y una
   CSP; los headers básicos ya están.
4. **Revocación de sesión**: JWT de 7 días sin denylist/refresh token; logout
   solo borra la cookie.
5. **Members/Settings**: siguen siendo stubs.
6. **Observabilidad**: los `catch` devuelven 500 sin logging estructurado.
7. **Rate limit**: sigue en memoria por instancia y usa `x-forwarded-for`.
