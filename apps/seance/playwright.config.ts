import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright configuration for Seance.
 * Runs only Chromium, where `inert` is fully supported (the Dialog tests rely on it).
 * Port 5175 with --strictPort, so a running skeleton (5173) or Grimoire (5174) can never answer these tests.
 * Locale and time zone are fixed so typed date and time segments are the same on every machine.
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
    baseURL: 'http://localhost:5175',
    trace: 'on-first-retry',
    locale: 'en-US',
    timezoneId: 'UTC',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5175',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
