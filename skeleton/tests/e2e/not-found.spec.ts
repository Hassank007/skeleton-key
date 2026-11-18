import { test, expect } from '@playwright/test'
import { scanPage } from './support/axe'

test.describe('Not found page', () => {
  test('zero axe violations (WCAG 2.2 AA)', async ({ page }, testInfo) => {
    await page.goto('/no/such/page')
    await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible()
    const results = await scanPage(page, testInfo)
    expect(results.violations).toEqual([])
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
