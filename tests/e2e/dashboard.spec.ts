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
    await expect(page.locator('header').getByText('demo@example.com')).toBeVisible()
  })

  test('moves focus to the dashboard content after navigation', async ({ page }) => {
    await signIn(page)
    await page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link', { name: 'Projects' }).click()
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

  test('has no serious accessibility violations on the tasks page and one h1', async ({ page }) => {
    await signIn(page)
    await page.goto('/dashboard/projects')

    // Regression guard: the page used to render two <h1> elements ("Projects"
    // and "Tasks"), which breaks heading navigation for screen readers.
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
    await expect(page.getByRole('heading', { level: 1, name: 'Projects' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeVisible()

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
    await expect(content.getByRole('heading', { name: 'Team members' })).toBeVisible()
    await expect(content.getByText('demo@example.com')).toBeVisible()
    await expect(content.getByLabel('Role for demo@example.com')).toHaveValue('ADMIN')
  })

  test('records a task status change in the audit log', async ({ page }) => {
    await signIn(page)
    await page.goto('/dashboard/projects')
    const firstStatus = page.locator('tbody tr select').first()
    const currentStatus = await firstStatus.inputValue()
    await firstStatus.selectOption(currentStatus === 'done' ? 'in_progress' : 'done')
    await page.waitForTimeout(300)

    await page.goto('/dashboard/audit')
    await expect(page.getByRole('heading', { name: 'Audit log' })).toBeVisible()
    await expect(page.getByText('Task status changed').first()).toBeVisible()
  })

  test('shows the account and organization settings', async ({ page }) => {
    await signIn(page)
    await page.goto('/dashboard/settings')

    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
    const content = page.getByRole('region', { name: 'Dashboard content' })
    await expect(content.getByText('demo@example.com')).toBeVisible()
    await expect(content.getByText('Acme Corp')).toBeVisible()
    await expect(content.getByText('ADMIN', { exact: true })).toBeVisible()
  })

  test('exposes navigation on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await signIn(page)

    const mobileNav = page.getByRole('navigation', { name: 'Mobile navigation' })
    await expect(mobileNav).toBeVisible()
    await expect(mobileNav.getByRole('link', { name: 'Projects' })).toBeVisible()
    await expect(mobileNav.getByRole('link', { name: 'Team' })).toBeVisible()
    await expect(mobileNav.getByRole('link', { name: 'Audit' })).toBeVisible()
    await expect(mobileNav.getByRole('link', { name: 'Settings' })).toBeVisible()
  })

  test('opens the command palette and navigates without a mouse', async ({ page }) => {
    await signIn(page)

    await page.keyboard.press('Control+k')
    const dialog = page.getByRole('dialog', { name: 'Command palette' })
    await expect(dialog).toBeVisible()
    await expect(page.getByRole('option', { name: /Projects/ })).toBeVisible()

    await page.getByLabel('Search commands').fill('team')
    await expect(page.getByRole('option', { name: /Team/ })).toBeVisible()
    await page.getByLabel('Search commands').press('Enter')

    await expect(page).toHaveURL(/\/dashboard\/members/)
    await expect(page.getByRole('heading', { name: 'Team members' })).toBeVisible()
  })

  test('filters tasks by search, status, and project and shows the page range', async ({ page }) => {
    await signIn(page)
    await page.goto('/dashboard/projects')

    const content = page.getByRole('region', { name: 'Dashboard content' })
    const rows = content.locator('tbody tr')
    await expect(rows).toHaveCount(20)
    await expect(content.getByText('Showing 1–20 of 20')).toBeVisible()

    await content.getByLabel('Search tasks').fill('Task 20 of')
    await expect(rows).toHaveCount(1)
    await expect(content.getByText('1 task', { exact: true })).toBeVisible()

    await content.getByRole('button', { name: 'Clear' }).click()
    await expect(rows).toHaveCount(20)

    await content.getByLabel('Filter by status').selectOption('done')
    await expect(rows).toHaveCount(7)

    await content.getByLabel('Filter by project').selectOption({ label: 'API Gateway' })
    await expect(rows).toHaveCount(1)
    await expect(rows.first().getByText('Task 9 of API Gateway')).toBeVisible()
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
