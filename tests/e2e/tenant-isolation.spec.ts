import { test, expect } from '@playwright/test'
import { PrismaClient } from '@prisma/client'
import { loadEnvFile } from '../env'

test('a user cannot mutate a task from another tenant', async ({ page }) => {
  loadEnvFile()
  const databaseUrl = process.env.DATABASE_URL_TEST
  if (!databaseUrl) throw new Error('DATABASE_URL_TEST is required')

  const db = new PrismaClient({ datasources: { db: { url: databaseUrl } } })
  const acme = await db.organization.findUnique({ where: { slug: 'acme-corp' } })
  if (!acme) throw new Error('Acme organization missing')
  const acmeTask = await db.task.findFirst({
    where: { project: { organizationId: acme.id } },
    select: { id: true, status: true },
  })
  await db.$disconnect()
  if (!acmeTask) throw new Error('Acme task missing')

  await page.goto('/auth/login')
  await page.getByLabel('Email').fill('viewer@example.com')
  await page.getByLabel('Password').fill('password123')
  await page.getByRole('button', { name: /Sign in/ }).click()
  await expect(page).toHaveURL('/dashboard')

  const response = await page.request.patch(`/api/dashboard/tasks/${acmeTask.id}`, {
    data: { status: acmeTask.status },
  })

  expect(response.status()).toBe(403)
})
