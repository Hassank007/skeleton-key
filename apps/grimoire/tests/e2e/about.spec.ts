import { test, expect, type Page } from '@playwright/test'
import { scanPage } from './support/axe'
import { focusStop } from './support/focus'

const ready = async (page: Page, url = '/about') => {
  await page.goto(url)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
}

test.describe('About page', () => {
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

  test('navigating Catalogue → About moves focus to the About h1 and updates the title [SC 2.4.2, 2.4.3]', async ({ page }) => {
    await ready(page, '/')
    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'About' }).click()
    await expect(page).toHaveTitle('About — Grimoire')
    await expect(page.getByRole('heading', { level: 1, name: 'About' })).toBeFocused()
  })

  test('Tab order: skip link, Catalogue, About, Reduce motion, then the dialog button [SC 2.4.3, 2.4.7]', async ({ page }) => {
    await ready(page)
    for (const name of ['Skip to main content', 'Catalogue', 'About', 'Reduce motion', 'Open demo dialog']) {
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
    await page.keyboard.press('Shift+Tab')
    expect((await focusStop(page)).tag).not.toBe('BODY')
  })
})
