import { chromium } from 'playwright'

const baseUrl = process.env.PERF_BASE_URL || 'http://localhost:3000'
const budgets = {
  ttfbMs: 800,
  lcpMs: 2500,
  cls: 0.1,
  jsTransferBytes: 600 * 1024,
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

await page.goto(`${baseUrl}/auth/login`, { waitUntil: 'networkidle' })
await page.fill('input[type="email"]', 'demo@example.com')
await page.fill('input[type="password"]', 'password123')

const started = Date.now()
await page.locator('#login-form button').first().click()
await page.waitForURL('**/dashboard', { timeout: 30_000 })
await page.waitForLoadState('networkidle')
await page.waitForTimeout(1_500)
const wallMs = Date.now() - started

const metrics = await page.evaluate(() => {
  const navigation = performance.getEntriesByType('navigation')[0]
  const resources = performance.getEntriesByType('resource')
  const js = resources.filter((entry) => entry.initiatorType === 'script')
  const transfer = resources.reduce((total, entry) => total + (entry.transferSize || 0), 0)
  const jsTransfer = js.reduce((total, entry) => total + (entry.transferSize || 0), 0)

  return {
    ttfbMs: navigation ? Math.round(navigation.responseStart - navigation.requestStart) : null,
    domContentLoadedMs: navigation ? Math.round(navigation.domContentLoadedEventEnd) : null,
    loadMs: navigation ? Math.round(navigation.loadEventEnd) : null,
    lcpMs: Math.round(window.__perf?.lcp ?? 0),
    cls: Number((window.__perf?.cls ?? 0).toFixed(4)),
    requests: resources.length + 1,
    transferBytes: transfer,
    jsTransferBytes: jsTransfer,
    jsRequests: js.length,
  }
})

await browser.close()

const results = { ...metrics, authenticatedNavigationMs: wallMs }
const checks = [
  ['TTFB', results.ttfbMs, budgets.ttfbMs, 'ms'],
  ['LCP', results.lcpMs, budgets.lcpMs, 'ms'],
  ['CLS', results.cls, budgets.cls, ''],
  ['JS transfer', results.jsTransferBytes, budgets.jsTransferBytes, 'bytes'],
]

console.log(`Perf budget · ${baseUrl}/dashboard`)
for (const [label, actual, budget, unit] of checks) {
  const pass = actual !== null && actual <= budget
  const display = unit === 'bytes' ? `${(actual / 1024).toFixed(1)} kB` : `${actual}${unit}`
  const limit = unit === 'bytes' ? `${(budget / 1024).toFixed(0)} kB` : `${budget}${unit}`
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${label}: ${display} (budget ${limit})`)
}
console.log(
  `INFO  authenticated navigation: ${results.authenticatedNavigationMs} ms · ` +
    `${results.requests} requests · ${(results.transferBytes / 1024).toFixed(1)} kB total · ` +
    `${results.jsRequests} JS requests`
)

const failed = checks.filter(([, actual, budget]) => actual === null || actual > budget)
if (failed.length > 0) process.exitCode = 1
