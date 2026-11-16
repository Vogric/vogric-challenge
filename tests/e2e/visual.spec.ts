import { test, expect } from '@playwright/test'

async function settle(page: import('@playwright/test').Page) {
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(250)
}

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
    })
  })
})
