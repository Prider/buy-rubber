import { defineConfig, devices } from '@playwright/test'

// Use a dedicated port so e2e tests don't hit a stale app on :3000 (e.g. Electron).
const e2ePort = process.env.PLAYWRIGHT_PORT ?? '3099'
const e2eBaseURL = `http://localhost:${e2ePort}`

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  timeout: 30_000,
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: e2eBaseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'chromium',
      testIgnore: /auth\/login\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/admin.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'chromium-no-auth',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /auth\/login\.spec\.ts/,
    },
  ],

  webServer: {
    command: `PORT=${e2ePort} npm run dev`,
    url: e2eBaseURL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
