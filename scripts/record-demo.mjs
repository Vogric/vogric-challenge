import { chromium } from 'playwright'

const baseUrl = process.env.DEMO_BASE_URL || 'http://localhost:3000'
const output = 'demo/saas-dashboard-demo.webm'

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  recordVideo: { dir: 'demo/raw', size: { width: 1280, height: 720 } },
})
const page = await context.newPage()

async function caption(title, subtitle = '') {
  await page.evaluate(
    ({ title, subtitle }) => {
      let overlay = document.getElementById('demo-caption')
      if (!overlay) {
        overlay = document.createElement('div')
        overlay.id = 'demo-caption'
        overlay.style.cssText =
          'position:fixed;left:24px;bottom:24px;z-index:2147483647;max-width:720px;' +
          'background:rgba(15,23,42,.94);color:#fff;padding:14px 18px;border-radius:12px;' +
          'font:500 15px/1.35 system-ui,-apple-system,Segoe UI,sans-serif;' +
          'box-shadow:0 12px 30px rgba(0,0,0,.28);pointer-events:none;border:1px solid rgba(255,255,255,.12)'
        document.body.appendChild(overlay)
      }
      overlay.innerHTML =
        `<div style="font-weight:700;margin-bottom:2px">${title}</div>` +
        (subtitle ? `<div style="opacity:.8;font-size:13px">${subtitle}</div>` : '')
    },
    { title, subtitle }
  )
}

await page.goto(`${baseUrl}/auth/login`, { waitUntil: 'networkidle' })
await page.waitForTimeout(800)
await caption('1 / Login', 'Explicit pending state, HttpOnly session')
await page.fill('input[type="email"]', 'demo@example.com')
await page.fill('input[type="password"]', 'password123')
await page.locator('#login-form button').first().click()
await page.waitForURL('**/dashboard', { timeout: 30000 })
await page.waitForTimeout(1600)
await caption('2 / Multi-tenant overview', 'Acme Corp · ADMIN · server-derived tenant')
await page.waitForTimeout(1800)

await page.getByLabel('Organization', { exact: true }).selectOption({ label: 'Globex' })
await caption('3 / Organization switch', 'Cookie validated against membership; cache cleared')
await page.waitForTimeout(2200)
await caption('2 / Multi-tenant overview', 'Globex · MANAGER · same user, different role')
await page.waitForTimeout(1400)

await page.getByLabel('Organization', { exact: true }).selectOption({ label: 'Acme Corp' })
await page.waitForTimeout(1400)

await page.getByRole('link', { name: 'Projects' }).click()
await page.waitForTimeout(1600)
await caption('4 / Cursor pagination + optimistic UI', 'Opaque cursor · rollback on 403 · composite index')
const firstStatus = page.locator('tbody tr select').first()
await firstStatus.selectOption('done')
await page.waitForTimeout(1800)

await page.getByRole('link', { name: 'Audit' }).click()
await page.waitForTimeout(1400)
await caption('5 / Tenant-scoped audit trail', 'Who changed what, inside this organization')
await page.waitForTimeout(1800)

await page.getByRole('link', { name: 'Members' }).click()
await page.waitForTimeout(1400)
await caption('6 / RBAC', 'ADMIN-only role controls · last admin protected')
await page.waitForTimeout(1800)

await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1000)
await caption('106 tests · 92% coverage · p95 180 ms', 'Live: vogric-challenge.vercel.app')
await page.waitForTimeout(2400)

const video = page.video()
await context.close()
await video.saveAs(output)
await browser.close()
console.log(`Saved ${output}`)
