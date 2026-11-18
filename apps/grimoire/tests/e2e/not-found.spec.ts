import { test, expect, type Page } from '@playwright/test'
import { scanPage } from './support/axe'
import { focusStop } from './support/focus'

const ready = async (page: Page, url = '/no/such/page') => {
  await page.goto(url)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
}

test.describe('Not found page', () => {
  test('zero axe violations (WCAG 2.2 AA)', async ({ page }, testInfo) => {
    await ready(page)
    const results = await scanPage(page, testInfo)
    expect(results.violations).toEqual([])
  })

  test.describe('dark scheme', () => {
    test.use({ colorScheme: 'dark' })

    test('zero axe violations (dark)', async ({ page }, testInfo) => {
      await ready(page)
      const results = await scanPage(page, testInfo, 'dark')
      expect(results.violations).toEqual([])
    })
  })

  test('has its own title and h1 [SC 2.4.2]', async ({ page }) => {
    await ready(page)
    await expect(page).toHaveTitle('Page not found — Grimoire')
    await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible()
  })

  test('client-side navigation to an unknown address moves focus to the h1 [SC 2.4.3]', async ({ page }) => {
    await ready(page, '/about')
    await page.evaluate(() => {
      window.history.pushState({}, '', '/nothing-here')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeFocused()
  })

  test('Tab order: skip link, Catalogue, About, Reduce motion, the way back [SC 2.4.3, 2.4.7]', async ({ page }) => {
    await ready(page)
    for (const name of ['Skip to main content', 'Catalogue', 'About', 'Reduce motion', 'Go to the catalogue']) {
      await page.keyboard.press('Tab')
      const stop = await focusStop(page)
      expect(stop.text).toBe(name)
      expect(stop.ring).toBeGreaterThanOrEqual(2)
    }
  })

  test('no keyboard trap: Tab leaves the page and Shift+Tab comes back [SC 2.1.2]', async ({ page }) => {
    await ready(page)
    let left = false
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press('Tab')
      const stop = await focusStop(page)
      if (stop.tag === 'BODY' || (i > 3 && stop.text === 'Skip to main content')) {
        left = true
        break
      }
    }
    expect(left).toBe(true)
  })
})
