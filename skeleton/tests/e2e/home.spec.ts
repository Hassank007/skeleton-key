import { test, expect } from '@playwright/test'
import { scanPage } from './support/axe'

test.describe('Home page', () => {
  test('zero axe violations (WCAG 2.2 AA)', async ({ page }, testInfo) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const results = await scanPage(page, testInfo)
    expect(results.violations).toEqual([])
  })

  test('first Tab press focuses the skip link [SC 2.4.1]', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: /skip to main content/i })).toBeFocused()
  })

  test('Enter on skip link moves focus to main content [SC 2.4.1]', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await page.keyboard.press('Tab') // focus skip link
    await expect(page.getByRole('link', { name: /skip to main content/i })).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.locator('#main-content')).toBeFocused()
    // The skip link moved focus by keyboard, so the ring must show (2.4.7)
    await expect(page.locator('#main-content')).not.toHaveCSS('outline-style', 'none')
  })

  test('keyboard walk: logical Tab order and a visible focus ring on every stop [SC 2.4.3, 2.4.7]', async ({ page }) => {
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

  test('the in-app "Reduce motion" toggle stops the ghost animation [SC 2.2.2]', async ({ page }) => {
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
