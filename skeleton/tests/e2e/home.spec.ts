import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Home page', () => {
  test('zero axe violations (WCAG 2.2 AA)', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze()
    expect(results.violations).toEqual([])
  })

  test('first Tab press focuses the skip link', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: /skip to main content/i })).toBeFocused()
  })

  test('Enter on skip link moves focus to main content', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await page.keyboard.press('Tab') // focus skip link
    await expect(page.getByRole('link', { name: /skip to main content/i })).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.locator('#main-content')).toBeFocused()
  })

  test('keyboard walk: logical Tab order and a visible focus ring on every stop', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const expected = ['Skip to main content', 'Home', 'About', 'Reduce motion']
    for (const name of expected) {
      await page.keyboard.press('Tab')
      const stop = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement
        const style = getComputedStyle(el)
        return { text: el.textContent?.trim(), outline: style.outlineStyle, width: parseFloat(style.outlineWidth) }
      })
      expect(stop.text).toBe(name)
      expect(stop.outline).not.toBe('none')
      expect(stop.width).toBeGreaterThanOrEqual(2)
    }
  })

  test('decorative ghost is aria-hidden and stops animating with OS reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    const ghost = page.locator('main svg[aria-hidden="true"]')
    await expect(ghost).toHaveCount(1)
    await expect(ghost).toHaveCSS('animation-name', 'none')
  })

  test('the in-app "Reduce motion" toggle stops the ghost animation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto('/')
    const ghost = page.locator('main svg[aria-hidden="true"]')
    await expect(ghost).not.toHaveCSS('animation-name', 'none')
    const toggle = page.getByRole('button', { name: 'Reduce motion' })
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')
    await expect(ghost).toHaveCSS('animation-name', 'none')
  })
})
