import { defineConfig, devices } from '@playwright/test'
import { getTestDatabaseUrl, TEST_SERVER_PORT } from './tests/env'

const testDatabaseUrl = getTestDatabaseUrl()

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  globalSetup: './tests/global-setup.ts',
  use: {
    baseURL: `http://localhost:${TEST_SERVER_PORT}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: `http://localhost:${TEST_SERVER_PORT}`,
    // Never reuse the developer server: it points at DATABASE_URL, not at the
    // isolated test database.
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      ...process.env,
      PORT: String(TEST_SERVER_PORT),
      DATABASE_URL: testDatabaseUrl,
      NODE_ENV: 'test',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
