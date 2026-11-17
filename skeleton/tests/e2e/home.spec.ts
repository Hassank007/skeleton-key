import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Home page', () => {
  test('zero axe violations (WCAG 2.2 AA)', async ({ page }) => {
    await page.goto('/')
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze()
    expect(results.violations).toEqual([])
  })

  test('first Tab press focuses the skip link', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Tab')
    const focused = await page.evaluate(() => document.activeElement?.textContent?.trim())
    expect(focused).toMatch(/skip to main content/i)
  })

  test('Enter on skip link moves focus to main content', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Tab') // focus skip link
    await page.keyboard.press('Enter')
    // After activation the skip link target (#main-content) should be focused
    const focusedId = await page.evaluate(() => document.activeElement?.id)
    expect(focusedId).toBe('main-content')
  })
})
