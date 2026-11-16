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
          'background:rgba(23,23,21,.95);color:#f6f4ee;padding:14px 18px;border-radius:12px;' +
          'font:500 15px/1.35 Geist,system-ui,-apple-system,Segoe UI,sans-serif;' +
          'box-shadow:0 12px 30px rgba(0,0,0,.28);pointer-events:none;border:1px solid rgba(255,255,255,.12)'
        document.body.appendChild(overlay)
      }
      overlay.innerHTML =
        `<div style="font-weight:650;margin-bottom:2px">${title}</div>` +
        (subtitle ? `<div style="opacity:.74;font-size:13px">${subtitle}</div>` : '')
    },
    { title, subtitle }
  )
}

await page.goto(`${baseUrl}/auth/login`, { waitUntil: 'networkidle' })
await page.waitForTimeout(800)
await caption('1 / Sign in', 'Explicit pending state · HttpOnly, revocable session')
await page.fill('input[type="email"]', 'demo@example.com')
await page.fill('input[type="password"]', 'password123')
await page.locator('#login-form button').first().click()
await page.waitForURL('**/dashboard', { timeout: 30_000 })
await page.waitForTimeout(1_600)

await caption('2 / Multi-tenant overview', 'Acme Corp · ADMIN · server-derived tenant')
await page.waitForTimeout(1_800)

await page.getByLabel('Organization', { exact: true }).selectOption({ label: 'Globex' })
await caption('3 / Organization switch', 'HttpOnly cookie validated against membership')
await page.waitForTimeout(2_200)
await caption('2 / Multi-tenant overview', 'Globex · MANAGER · same user, different role')
await page.waitForTimeout(1_400)
await page.getByLabel('Organization', { exact: true }).selectOption({ label: 'Acme Corp' })
await page.waitForTimeout(700)
await caption('2 / Multi-tenant overview', 'Acme Corp · ADMIN · back to the original tenant')
await page.waitForTimeout(1_200)

await page.getByRole('link', { name: 'Projects', exact: true }).click()
await page.waitForTimeout(1_500)
await caption('4 / Server-side filters', 'Search, status, and project filters share one cursor query')
await page.getByLabel('Search tasks').fill('Bulk Task 1954')
await page.waitForTimeout(1_600)
await page.getByRole('button', { name: 'Clear' }).click()
await page.waitForTimeout(500)

const firstStatus = page.locator('tbody tr select').first()
const currentStatus = await firstStatus.inputValue()
await firstStatus.selectOption(currentStatus === 'done' ? 'in_progress' : 'done')
await caption('5 / Optimistic status update', 'Rollback on 403 · KPI cache invalidated server-side')
await page.waitForTimeout(1_800)

await page.keyboard.press('Control+k')
await page.waitForTimeout(400)
await caption('6 / Keyboard-first navigation', '⌘K palette · focus contained · tenant-aware')
await page.getByLabel('Search commands').fill('audit')
await page.waitForTimeout(600)
await page.getByLabel('Search commands').press('Enter')
await page.waitForURL('**/dashboard/audit', { timeout: 15_000 })
await page.waitForTimeout(1_200)
await caption('7 / Tenant-scoped audit trail', 'Who changed what, inside this organization')
await page.waitForTimeout(1_800)

await page.goto(`${baseUrl}/dashboard/members`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1_200)
await caption('8 / RBAC', 'ADMIN-only role controls · last admin protected')
await page.waitForTimeout(1_800)

await page.goto(`${baseUrl}/dashboard/settings`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1_200)
await caption('9 / Account, workspace, and security posture', 'Read-only by design · no dead controls')
await page.waitForTimeout(1_800)

await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1_000)
await caption('118 tests · 93.18% coverage · p95 180 ms', 'Live: vogric-challenge.vercel.app')
await page.waitForTimeout(2_400)

const video = page.video()
await context.close()
await video.saveAs(output)
await browser.close()
console.log(`Saved ${output}`)
