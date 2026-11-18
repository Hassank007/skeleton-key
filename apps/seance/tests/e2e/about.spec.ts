import { test, expect } from '@playwright/test'
import { scanPage } from './support/axe'
import { focusStop, tabTo } from './support/keys'

test.describe('About page', () => {
  test('zero axe violations (WCAG 2.2 AA)', async ({ page }, testInfo) => {
    await page.goto('/about')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const results = await scanPage(page, testInfo)
    expect(results.violations).toEqual([])
  })

  test('navigating Intro → About moves focus to About h1 and updates title [SC 2.4.2, 2.4.3]', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'About' }).click()
    await expect(page).toHaveTitle('About — Seance')
    await expect(page.getByRole('heading', { level: 1, name: 'About' })).toBeFocused()
  })
})

test.describe('Introduction page and shell', () => {
  test('has the title, one h1, the landmarks, and says nothing is stored [SC 2.4.2, 1.3.1]', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle('Book a séance — Seance')
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
    for (const landmark of ['banner', 'main', 'contentinfo'] as const) await expect(page.getByRole(landmark)).toHaveCount(1)
    await expect(page.getByRole('navigation', { name: 'Main' })).toHaveCount(1)
    await expect(page.getByText(/nothing you type is stored or sent/i).first()).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  })

  test('first Tab press focuses the skip link, and Enter moves focus to main [SC 2.4.1]', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: /skip to main content/i })).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.locator('#main-content')).toBeFocused()
    await expect(page.locator('#main-content')).not.toHaveCSS('outline-style', 'none')
  })

  test('keyboard walk: logical Tab order and a visible focus ring on every stop [SC 2.4.3, 2.4.7]', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Tab')
    expect((await focusStop(page)).name).toBe('Skip to main content')
    for (const name of ['Book a séance', 'About', 'Reduce motion', 'Start booking']) {
      const visited = await tabTo(page, name, { max: 1 })
      expect(visited[0].name).toBe(name)
    }
  })

  test('the nav links are "Book a séance" then "About" [SC 3.2.3]', async ({ page }) => {
    await page.goto('/')
    const links = page.getByRole('navigation', { name: 'Main' }).getByRole('link')
    await expect(links).toHaveText(['Book a séance', 'About'])
    await expect(links.first()).toHaveAttribute('href', '/book/spirit')
  })
})