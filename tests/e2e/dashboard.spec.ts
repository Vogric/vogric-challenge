import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

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

  test('moves focus to the dashboard content after navigation', async ({ page }) => {
    await signIn(page)
    await page.getByRole('link', { name: 'Projects' }).click()
    await expect(page).toHaveURL('/dashboard/projects')
    await expect(page.getByRole('region', { name: 'Dashboard content' })).toBeFocused()
  })

  test('switches the active organization and reloads server data', async ({ page }) => {
    await signIn(page)
    await expect(page.getByText('Acme Corp · signed in as admin')).toBeVisible()

    await page.route('**/api/organizations/select', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 400))
      await route.continue()
    })

    await page.getByLabel('Organization', { exact: true }).selectOption({ label: 'Globex' })
    await expect(page.getByText('Updating workspace...')).toBeVisible()
    await expect(page.getByText('Globex · signed in as manager')).toBeVisible()
    await expect(page.getByTestId('stat-projects')).toHaveText('5')

    await page.getByLabel('Organization', { exact: true }).selectOption({ label: 'Acme Corp' })
    await expect(page.getByText('Acme Corp · signed in as admin')).toBeVisible()
  })

  test('has no serious accessibility violations on the dashboard', async ({ page }) => {
    await signIn(page)

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    const serious = results.violations
      .filter((violation) => violation.impact === 'critical' || violation.impact === 'serious')
      .map((violation) => ({ id: violation.id, impact: violation.impact, help: violation.help }))

    expect(serious).toEqual([])
  })

  test('shows real members and a role control for admins', async ({ page }) => {
    await signIn(page)
    await page.goto('/dashboard/members')

    const content = page.getByRole('region', { name: 'Dashboard content' })
    await expect(content.getByRole('heading', { name: 'Team Members' })).toBeVisible()
    await expect(content.getByText('demo@example.com')).toBeVisible()
    await expect(content.getByLabel('Role for demo@example.com')).toHaveValue('ADMIN')
  })

  test('shows the account and organization settings', async ({ page }) => {
    await signIn(page)
    await page.goto('/dashboard/settings')

    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
    const content = page.getByRole('region', { name: 'Dashboard content' })
    await expect(content.getByText('demo@example.com')).toBeVisible()
    await expect(content.getByText('Acme Corp')).toBeVisible()
    await expect(content.getByText('ADMIN')).toBeVisible()
  })

  test('exposes navigation on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await signIn(page)

    const mobileNav = page.getByRole('navigation', { name: 'Mobile navigation' })
    await expect(mobileNav).toBeVisible()
    await expect(mobileNav.getByRole('link', { name: 'Projects' })).toBeVisible()
    await expect(mobileNav.getByRole('link', { name: 'Members' })).toBeVisible()
  })

  test('loads the paginated tasks table from the API', async ({ page }) => {
    await signIn(page)
    await page.goto('/dashboard/projects')

    const content = page.getByRole('region', { name: 'Dashboard content' })
    const rows = content.locator('tbody tr')
    await expect(rows).toHaveCount(20)
    await expect(content.getByRole('table')).toBeVisible()
    await expect(content.getByText('20 tasks')).toBeVisible()
  })
})
