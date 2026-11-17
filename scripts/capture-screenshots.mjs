import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'

const baseUrl = process.env.SCREENSHOT_BASE_URL || 'http://localhost:3000'
const output = 'docs/screenshots'
await mkdir(output, { recursive: true })

const browser = await chromium.launch()

async function signIn(page) {
  await page.goto(`${baseUrl}/auth/login`, { waitUntil: 'networkidle' })
  await page.fill('input[type="email"]', 'demo@example.com')
  await page.fill('input[type="password"]', 'password123')
  await page.locator('#login-form button').first().click()
  await page.waitForURL('**/dashboard', { timeout: 30_000 })
  await page.waitForTimeout(1_200)
}

const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await desktop.newPage()
await page.goto(`${baseUrl}/auth/login`, { waitUntil: 'networkidle' })
await page.waitForTimeout(500)
await page.screenshot({ path: `${output}/01-login.png` })
await signIn(page)

await page.screenshot({ path: `${output}/02-dashboard.png` })
await page.keyboard.press('Control+k')
await page.waitForTimeout(350)
await page.screenshot({ path: `${output}/03-command-palette.png` })
await page.keyboard.press('Escape')

await page.goto(`${baseUrl}/dashboard/projects`, { waitUntil: 'networkidle' })
await page.waitForTimeout(900)
const firstStatus = page.locator('tbody tr select').first()
const current = await firstStatus.inputValue()
await firstStatus.selectOption(current === 'done' ? 'in_progress' : 'done')
await page.waitForTimeout(1_200)
await page.screenshot({ path: `${output}/04-projects.png` })

await page.goto(`${baseUrl}/dashboard/audit`, { waitUntil: 'networkidle' })
await page.waitForTimeout(700)
await page.screenshot({ path: `${output}/05-audit.png` })

await page.goto(`${baseUrl}/dashboard/members`, { waitUntil: 'networkidle' })
await page.waitForTimeout(700)
await page.screenshot({ path: `${output}/06-team.png` })

await page.goto(`${baseUrl}/dashboard/settings`, { waitUntil: 'networkidle' })
await page.waitForTimeout(700)
await page.screenshot({ path: `${output}/07-settings.png` })
await desktop.close()

const mobile = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
})
const phone = await mobile.newPage()
await signIn(phone)
await phone.screenshot({ path: `${output}/08-mobile-dashboard.png` })
await phone.goto(`${baseUrl}/dashboard/projects`, { waitUntil: 'networkidle' })
await phone.waitForTimeout(800)
await phone.screenshot({ path: `${output}/09-mobile-projects.png` })
await phone.keyboard.press('Control+k')
await phone.waitForTimeout(350)
await phone.screenshot({ path: `${output}/10-mobile-command-palette.png` })
await mobile.close()

await browser.close()
console.log(`Saved screenshots to ${output}`)
