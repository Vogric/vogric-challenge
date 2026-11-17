import { test, expect, type Page } from '@playwright/test'

async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(250)
}

async function signIn(page: Page) {
  await page.goto('/auth/login', { waitUntil: 'networkidle' })
  await page.getByLabel('Email').fill('demo@example.com')
  await page.getByLabel('Password').fill('password123')
  await page.getByRole('button', { name: /Sign in/ }).click()
  await expect(page).toHaveURL('/dashboard')
  await settle(page)
}

const dynamicMasks = (page: Page) => [
  page.locator('time'),
  page.locator('[data-visual-mask="activity-list"]'),
]

test.describe('Visual snapshots', () => {
  test('login desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/auth/login', { waitUntil: 'networkidle' })
    await settle(page)

    await expect(page).toHaveScreenshot('login-desktop.png', {
      fullPage: true,
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.03,
      maskColor: '#ffffff',
    })
  })

  test('login mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/auth/login', { waitUntil: 'networkidle' })
    await settle(page)

    await expect(page).toHaveScreenshot('login-mobile.png', {
      fullPage: true,
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.03,
      maskColor: '#ffffff',
    })
  })
})


test.describe('Authenticated product screens', () => {
  test('dashboard', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signIn(page)

    await expect(page).toHaveScreenshot('dashboard.png', {
      fullPage: true,
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.04,
      maskColor: '#ffffff',
      mask: dynamicMasks(page),
    })
  })

  test('projects', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signIn(page)
    await page.goto('/dashboard/projects', { waitUntil: 'networkidle' })
    await settle(page)

    await expect(page).toHaveScreenshot('projects.png', {
      fullPage: true,
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.04,
      maskColor: '#ffffff',
      mask: [page.locator('time')],
    })
  })

  test('team', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signIn(page)
    await page.goto('/dashboard/members', { waitUntil: 'networkidle' })
    await settle(page)

    await expect(page).toHaveScreenshot('team.png', {
      fullPage: true,
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.04,
      maskColor: '#ffffff',
    })
  })

  test('audit', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signIn(page)
    await page.goto('/dashboard/audit', { waitUntil: 'networkidle' })
    await settle(page)

    await expect(page).toHaveScreenshot('audit.png', {
      fullPage: true,
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.04,
      maskColor: '#ffffff',
      mask: [page.locator('time')],
    })
  })

  test('settings', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signIn(page)
    await page.goto('/dashboard/settings', { waitUntil: 'networkidle' })
    await settle(page)

    await expect(page).toHaveScreenshot('settings.png', {
      fullPage: true,
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.04,
      maskColor: '#ffffff',
    })
  })
})
