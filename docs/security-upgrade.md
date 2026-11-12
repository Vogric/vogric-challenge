# Security upgrade path

`npm audit` al 2026-11-12: **14 vulnerabilidades (3 críticas, 9 altas, 2
moderadas)**. En producción (`npm audit --omit=dev`): **3** — `next` crítica,
`postcss` alta (transitiva de Next) y `zod` alta.

## 1. Next.js 14.2.35 → 15.5.24+ o 16.4.6

`next@14.2.35` está dentro del rango vulnerable de varios advisories, entre
ellos:

- RCE en Image Optimization con SVG/AVIF (`GHSA-2464-fhr4-w9xw`,
  `GHSA-2xp9-vwfh-vxw4`).
- RCE en servidores Windows (`GHSA-p293-qw3h-jr36`).
- SSRF en WebSocket upgrades (`GHSA-c4j6-fc7j-m34r`).
- Cache poisoning / XSS / DoS en App Router.

**Upgrade path:** subir a `next@15.5.24` como mínimo, idealmente `16.4.6`.
Next 15/16 requiere migrar `params` y `searchParams` a Promises en rutas
dinámicas (el repo ya usa `params: Promise` en algunas páginas, pero no en
`app/api/dashboard/tasks/[id]/route.ts`). Pasos:

1. Crear branch `chore/next-16`.
2. `npx @next/codemod@latest upgrade latest`.
3. Resolver cambios de `params`/`searchParams` y de `next lint`.
4. Ejecutar `npm run typecheck && npm run lint && npm test && npm run build && npm run test:e2e`.
5. Desplegar a preview y probar login, projects, health y headers.

## 2. Zod 3.25.76 → 4.6.7

Advisory: `GHSA-mrhx-c7xc-m3w5` (memory exhaustion con colecciones grandes).
Es un major breaking: cambia el manejo de errores (`error.flatten()`), algunos
métodos de string y los tipos inferidos. Migrar en un branch aparte, correr
tests y revisar `loginSchema`, `querySchema` y `updateTaskSchema`.

## 3. Vitest 1.6.1 → 3.2.6+

`GHSA-5xrq-8626-4rwp` (Vitest UI puede leer/ejecutar archivos arbitrarios).
Es tooling de desarrollo, pero conviene actualizar. Vitest 3 cambia la config de
coverage y algunos matchers; actualizar `vitest.config.ts` y `tests/setup.ts`.

## 4. PostCSS

La copia vulnerable viene dentro de `next/node_modules/postcss`; se resuelve al
subir Next. El `postcss` top-level ya está en 8.5.32.

## Verificación posterior

```bash
npm audit --omit=dev --audit-level=high
npm run typecheck && npm run lint && npm test && npm run build
npm run test:e2e
```
