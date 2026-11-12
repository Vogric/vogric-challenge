import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: [
      '**/__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      '**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
    exclude: [
      '**/tests/e2e/**',
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
    ],
    setupFiles: ['./tests/setup.ts'],
    alias: {
      '@': path.resolve(__dirname, './'),
    },
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: 'coverage',
      include: ['lib/**/*.ts', 'hooks/useTasks.ts', 'hooks/useNotifications.ts'],
      exclude: ['**/__tests__/**', 'lib/db.ts', 'lib/query.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },
  },
})
