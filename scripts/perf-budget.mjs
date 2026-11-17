import { chromium } from 'playwright'

const baseUrl = process.env.PERF_BASE_URL || 'http://localhost:3000'
const routes = [
  '/dashboard',
  '/dashboard/projects',
  '/dashboard/members',
  '/dashboard/audit',
  '/dashboard/settings',
]
const budgets = {
  ttfbMs: 800,
  lcpMs: 2500,
  cls: 0.1,
  jsTransferBytes: 350 * 1024,
}

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await context.newPage()

await page.addInitScript(() => {
  window.__perf = { lcp: 0, cls: 0 }
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      window.__perf.lcp = Math.max(window.__perf.lcp, entry.startTime)
    }
  }).observe({ type: 'largest-contentful-paint', buffered: true })

  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!entry.hadRecentInput) window.__perf.cls += entry.value
    }
  }).observe({ type: 'layout-shift', buffered: true })
})

async function measure(route) {
  const started = Date.now()
  await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)

  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0]
    const resources = performance.getEntriesByType('resource')
    const js = resources.filter((entry) => entry.initiatorType === 'script')
    const bytes = (entry) => entry.transferSize || entry.encodedBodySize || 0
    const transfer = resources.reduce((total, entry) => total + bytes(entry), 0)
    const jsTransfer = js.reduce((total, entry) => total + bytes(entry), 0)

    return {
      ttfbMs: navigation ? Math.round(navigation.responseStart - navigation.requestStart) : null,
      lcpMs: Math.round(window.__perf?.lcp ?? 0),
      cls: Number((window.__perf?.cls ?? 0).toFixed(4)),
      requests: resources.length + 1,
      transferBytes: transfer,
      jsTransferBytes: jsTransfer,
      jsRequests: js.length,
    }
  })

  return { route, wallMs: Date.now() - started, ...metrics }
}

await page.goto(`${baseUrl}/auth/login`, { waitUntil: 'networkidle' })
await page.fill('input[type="email"]', 'demo@example.com')
await page.fill('input[type="password"]', 'password123')
await page.locator('#login-form button').first().click()
await page.waitForURL('**/dashboard', { timeout: 30_000 })
await page.waitForLoadState('networkidle')

const results = []
for (const route of routes) {
  results.push(await measure(route))
}
await browser.close()

const failures = []
console.log(`Perf budget · ${baseUrl}`)
for (const result of results) {
  const checks = [
    ['TTFB', result.ttfbMs, budgets.ttfbMs, 'ms'],
    ['LCP', result.lcpMs, budgets.lcpMs, 'ms'],
    ['CLS', result.cls, budgets.cls, ''],
    ['JS transfer', result.jsTransferBytes, budgets.jsTransferBytes, 'bytes'],
  ]

  for (const [label, actual, budget, unit] of checks) {
    const pass = actual !== null && actual <= budget
    if (!pass) failures.push(`${result.route} ${label}`)
    const display = unit === 'bytes' ? `${(actual / 1024).toFixed(1)} kB` : `${actual}${unit}`
    const limit = unit === 'bytes' ? `${(budget / 1024).toFixed(0)} kB` : `${budget}${unit}`
    console.log(`${pass ? 'PASS' : 'FAIL'}  ${result.route} ${label}: ${display} (budget ${limit})`)
  }
  console.log(
    `INFO  ${result.route}: ${result.wallMs} ms · ${result.requests} requests · ` +
      `${(result.transferBytes / 1024).toFixed(1)} kB total · ${result.jsRequests} JS requests`
  )
}

if (failures.length > 0) {
  console.error(`Budget failures: ${failures.join(', ')}`)
  process.exitCode = 1
}
