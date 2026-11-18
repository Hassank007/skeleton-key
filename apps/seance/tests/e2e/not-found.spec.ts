import { test, expect } from '@playwright/test'
import { scanPage } from './support/axe'

test.describe('Not found page', () => {
  test('zero axe violations (WCAG 2.2 AA)', async ({ page }, testInfo) => {
    await page.goto('/no/such/page')
    await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible()
    const results = await scanPage(page, testInfo)
    expect(results.violations).toEqual([])
  })

  test('has the title and exactly one h1 [SC 2.4.2, 1.3.1]', async ({ page }) => {
    await page.goto('/no/such/page')
    await expect(page).toHaveTitle('Page not found — Seance')
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
  })

  test('following the way back moves focus to the new h1 [SC 2.4.3]', async ({ page }) => {
    await page.goto('/no/such/page')
    await page.getByRole('link', { name: 'Go to the home page' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Book a séance with a spirit' })).toBeFocused()
    await expect(page).toHaveTitle('Book a séance — Seance')
  })

  test.describe('dark scheme', () => {
    test.use({ colorScheme: 'dark' })

    test('zero axe violations (dark)', async ({ page }, testInfo) => {
      await page.goto('/no/such/page')
      await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible()
      const results = await scanPage(page, testInfo, 'dark')
      expect(results.violations).toEqual([])
    })
  })
})