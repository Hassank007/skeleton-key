import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright configuration for Skeleton Key.
 * Runs only Chromium — where `inert` is fully supported, which the Dialog tests rely on.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // The JSON file feeds the ACR generator. It goes to evidence/, not outputDir, because Playwright empties outputDir on every run.
  reporter: [['list'], ['json', { outputFile: 'evidence/playwright.json' }]],
  globalSetup: './tests/e2e/support/global-setup.ts',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
