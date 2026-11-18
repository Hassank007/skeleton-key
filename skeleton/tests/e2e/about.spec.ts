import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('About page', () => {
  test('zero axe violations (WCAG 2.2 AA)', async ({ page }) => {
    await page.goto('/about')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze()
    expect(results.violations).toEqual([])
  })

  test('navigating Home → About moves focus to About h1 and updates title', async ({ page }) => {
    await page.goto('/')
    // Click the About nav link
    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'About' }).click()
    // Page title must update
    await expect(page).toHaveTitle(/about/i)
    // Focus must land on the About h1 (moved after a deferred tick)
    await expect(page.getByRole('heading', { level: 1, name: 'About' })).toBeFocused()
  })
})
