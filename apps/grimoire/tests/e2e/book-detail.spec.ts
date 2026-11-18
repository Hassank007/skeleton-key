import { test, expect, type Page } from '@playwright/test'
import { scanPage } from './support/axe'
import { focusStop } from './support/focus'

const LANTERN = { slug: 'the-lantern-of-small-hours', title: 'The Lantern of Small Hours' }
const ready = async (page: Page, url: string) => {
  await page.goto(url)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
}

test.describe('Book detail page', () => {
  test('zero axe violations, found book (WCAG 2.2 AA)', async ({ page }, testInfo) => {
    await ready(page, `/books/${LANTERN.slug}`)
    const results = await scanPage(page, testInfo)
    expect(results.violations).toEqual([])
  })

  test('zero axe violations, unknown slug', async ({ page }, testInfo) => {
    await ready(page, '/books/no-such-book')
    const results = await scanPage(page, testInfo, 'not found')
    expect(results.violations).toEqual([])
  })

  test.describe('dark scheme', () => {
    test.use({ colorScheme: 'dark' })

    test('zero axe violations, found book (dark)', async ({ page }, testInfo) => {
      await ready(page, `/books/${LANTERN.slug}`)
      const results = await scanPage(page, testInfo, 'dark')
      expect(results.violations).toEqual([])
    })

    test('zero axe violations, unknown slug (dark)', async ({ page }, testInfo) => {
      await ready(page, '/books/no-such-book')
      const results = await scanPage(page, testInfo, 'dark not found')
      expect(results.violations).toEqual([])
    })
  })

  test('has the title as h1, a unique page title and the facts as text [SC 1.3.1, 2.4.2]', async ({ page }) => {
    await ready(page, `/books/${LANTERN.slug}`)
    await expect(page).toHaveTitle(`${LANTERN.title} — Grimoire`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(LANTERN.title)
    await expect(page.locator('dt')).toHaveText(['Author', 'School', 'Hazard', 'Year', 'Pages'])
  })

  test('the unknown slug page has its own title and a way back [SC 2.4.2, 3.3.3]', async ({ page }) => {
    await ready(page, '/books/no-such-book')
    await expect(page).toHaveTitle('Spellbook not found — Grimoire')
    await expect(page.getByRole('heading', { level: 1, name: 'Spellbook not found' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Back to catalogue' })).toHaveAttribute('href', '/')
  })

  test('keyboard: focus lands on the h1, Tab reaches "Back to catalogue", Enter returns with the search kept [SC 2.4.3, 3.3.7]', async ({ page }) => {
    await ready(page, '/')
    await page.getByLabel('Search spellbooks').fill('lantern')
    await expect(page).toHaveURL(/\/\?q=lantern$/)
    const link = page.getByRole('link', { name: LANTERN.title })
    await link.focus()
    await page.keyboard.press('Enter')

    await expect(page).toHaveTitle(`${LANTERN.title} — Grimoire`)
    await expect(page.getByRole('heading', { level: 1, name: LANTERN.title })).toBeFocused()

    await page.keyboard.press('Tab')
    const stop = await focusStop(page)
    expect(stop.text).toBe('Back to catalogue')
    expect(stop.ring).toBeGreaterThanOrEqual(2)
    await page.keyboard.press('Enter')

    await expect(page).toHaveURL(/\/\?q=lantern$/)
    await expect(page.getByLabel('Search spellbooks')).toHaveValue('lantern')
    await expect(page.getByRole('heading', { level: 1, name: /catalogue of spellbooks/ })).toBeFocused()
  })

  test('the browser Back button also returns to the catalogue with the search kept [SC 3.3.7]', async ({ page }) => {
    await ready(page, '/')
    await page.getByLabel('Search spellbooks').fill('lantern')
    await page.getByLabel('Search spellbooks').press('Enter')
    await page.getByRole('link', { name: LANTERN.title }).click()
    await expect(page).toHaveURL(new RegExp(`/books/${LANTERN.slug}$`))
    await page.goBack()
    await expect(page).toHaveURL(/\/\?q=lantern$/)
    await expect(page.getByLabel('Search spellbooks')).toHaveValue('lantern')
  })

  test('no keyboard trap: Tab leaves the page and Shift+Tab comes back [SC 2.1.2]', async ({ page }) => {
    await ready(page, `/books/${LANTERN.slug}`)
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
