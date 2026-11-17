import { test, expect } from '@playwright/test'

test('renders the dashboard, task filters, and command palette in this browser', async ({ page }) => {
  await page.goto('/auth/login', { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  await page.getByLabel('Email').fill('demo@example.com')
  await page.getByLabel('Password').fill('password123')
  await page.getByRole('button', { name: /Sign in/ }).click()
  await expect(page).toHaveURL('/dashboard')
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible()
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(800)

  await page.getByRole('navigation', { name: 'Primary navigation' })
    .getByRole('link', { name: 'Projects', exact: true })
    .click()
  await expect(page).toHaveURL('/dashboard/projects')
  const rows = page.locator('tbody tr')
  await expect(rows).toHaveCount(20)

  await page.getByLabel('Search tasks').fill('Task 20 of')
  await expect(rows).toHaveCount(1)
  await page.getByRole('button', { name: 'Clear' }).click()
  await expect(rows).toHaveCount(20)

  await page.keyboard.press('Control+k')
  const palette = page.getByRole('dialog', { name: 'Command palette' })
  await expect(palette).toBeVisible()
  await page.getByLabel('Search commands').press('Escape')
  await expect(palette).not.toBeVisible()
})
