import { test, expect } from '@playwright/test'

test.use({ storageState: { cookies: [], origins: [] } })

test.describe('Authentication', () => {
  test('Happy path: valid login redirects to /dashboard and shows sidebar and navbar', async ({ page }) => {
    await test.step('Go to /auth/login', async () => {
      await page.goto('/auth/login')
      await expect(page).toHaveURL('/auth/login')
    })

    await test.step('Fill in valid credentials', async () => {
      await page.getByLabel('Email').fill('demo@example.com')
      await page.getByLabel('Password').fill('password123')
      await page.getByRole('button', { name: /Sign in/ }).click()
    })

    await test.step('Expect redirect to /dashboard', async () => {
      await expect(page).toHaveURL('/dashboard')
    })

    await test.step('Verify sidebar and authenticated user', async () => {
      await expect(page.getByRole('link', { name: 'Dashboard' }).first()).toBeVisible()
      await expect(page.getByText('SaaS')).toBeVisible()
      await expect(page.getByText('demo@example.com')).toBeVisible()
    })

    await test.step('Verify the session cookie is present and HttpOnly', async () => {
      const session = (await page.context().cookies()).find((cookie) => cookie.name === 'session')
      expect(session).toBeTruthy()
      expect(session?.httpOnly).toBe(true)
      expect(session?.path).toBe('/')
    })

    await test.step('Verify /api/auth/me returns the authenticated user', async () => {
      const response = await page.request.get('/api/auth/me')
      expect(response.status()).toBe(200)
      const body = await response.json()
      expect(body.user.email).toBe('demo@example.com')
    })

    await test.step('Verify the session survives a full reload', async () => {
      await page.reload({ waitUntil: 'networkidle' })
      await expect(page).toHaveURL('/dashboard')
      await expect(page.getByText('demo@example.com')).toBeVisible()
      await expect(page.getByTestId('stat-projects')).toHaveText('5')
    })
  })

  test('Invalid credentials: shows error and does not redirect', async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByLabel('Email').fill('bad@example.com')
    await page.getByLabel('Password').fill('wrongpassword')
    await page.getByRole('button', { name: /Sign in/ }).click()

    await expect(page).toHaveURL('/auth/login')
    await expect(page.getByText('Invalid credentials')).toBeVisible()
  })

  test('Zod validation: empty fields or invalid email shows field errors without submitting', async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByRole('button', { name: /Sign in/ }).click()

    await expect(page.getByLabel('Email')).toBeFocused()
    await expect(page.locator('#login-error')).toContainText('Invalid email')

    await page.getByLabel('Email').fill('not-an-email')
    await page.getByLabel('Password').fill('password123')
    await page.getByRole('button', { name: /Sign in/ }).click()

    await expect(page.locator('#login-error')).toContainText('Invalid email')
    await expect(page).toHaveURL('/auth/login')
  })

  test('Middleware: accessing /dashboard without session redirects to /auth/login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/auth/login')
  })

  test('Logout: signing out and returning to /dashboard redirects to login', async ({ page }) => {
    await test.step('Sign in with valid credentials', async () => {
      await page.goto('/auth/login')
      await page.getByLabel('Email').fill('demo@example.com')
      await page.getByLabel('Password').fill('password123')
      await page.getByRole('button', { name: /Sign in/ }).click()
      await expect(page).toHaveURL('/dashboard')
    })

    await test.step('Sign out', async () => {
      await page.getByRole('button', { name: 'Sign out', exact: true }).click()
    })

    await test.step('Redirects to /auth/login', async () => {
      await expect(page).toHaveURL('/auth/login')
    })

    await test.step('Cannot access /dashboard after logout', async () => {
      await page.goto('/dashboard')
      await expect(page).toHaveURL('/auth/login')
    })
  })
})
