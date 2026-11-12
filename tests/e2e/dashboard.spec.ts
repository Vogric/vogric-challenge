import { test, expect, type Page } from '@playwright/test'

test.use({ storageState: { cookies: [], origins: [] } })

async function signIn(page: Page) {
  await page.goto('/auth/login')
  await page.getByLabel('Email').fill('demo@example.com')
  await page.getByLabel('Password').fill('password123')
  await page.getByRole('button', { name: /Sign in/ }).click()
  await expect(page).toHaveURL('/dashboard')
}

test.describe('Dashboard with isolated fixtures', () => {
  test('shows real counts from the test database, not production', async ({ page }) => {
    await signIn(page)

    // The E2E seed creates exactly 5 projects, 1 member and 20 tasks
    // (7 todo + 7 in_progress + 6 done) for Acme Corp. Production has 1.348
    // pending tasks, so these assertions also prove the test DB is isolated.
    await expect(page.getByTestId('stat-projects')).toHaveText('5')
    await expect(page.getByTestId('stat-pending')).toHaveText('14')
    await expect(page.getByTestId('stat-members')).toHaveText('1')
    await expect(page.getByText('demo@example.com')).toBeVisible()
  })

  test('loads the paginated tasks table from the API', async ({ page }) => {
    await signIn(page)
    await page.goto('/dashboard/projects')

    const rows = page.locator('tbody tr')
    await expect(rows).toHaveCount(20)
    await expect(page.getByRole('table')).toBeVisible()
    await expect(page.getByText('20 tasks')).toBeVisible()
  })
})
