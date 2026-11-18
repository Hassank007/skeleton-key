import { test, expect, type Page } from '@playwright/test'
import { scanPage } from './support/axe'
import { BOOKS, countMatching, countText, messageText } from './support/books'
import { focusStop } from './support/focus'

const search = (page: Page) => page.getByLabel('Search spellbooks')
const polite = (page: Page) => page.locator('[aria-live="polite"]')
const assertive = (page: Page) => page.locator('[aria-live="assertive"]')
const ready = async (page: Page, url = '/') => {
  await page.goto(url)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
}

test.describe('Catalogue page', () => {
  test('zero axe violations, default state (WCAG 2.2 AA)', async ({ page }, testInfo) => {
    await ready(page)
    const results = await scanPage(page, testInfo)
    expect(results.violations).toEqual([])
  })

  test('zero axe violations, filtered state', async ({ page }, testInfo) => {
    await ready(page, '/?q=ash&school=herbalism&hazard=mild')
    await expect(page.getByRole('heading', { level: 3 }).first()).toBeVisible()
    const results = await scanPage(page, testInfo, 'filtered')
    expect(results.violations).toEqual([])
  })

  test('zero axe violations, empty state', async ({ page }, testInfo) => {
    await ready(page, '/?q=zzzzzz')
    await expect(page.getByText('No spellbooks found.')).toBeVisible()
    const results = await scanPage(page, testInfo, 'empty')
    expect(results.violations).toEqual([])
  })

  test.describe('dark scheme', () => {
    test.use({ colorScheme: 'dark' })

    test('zero axe violations, default state (dark)', async ({ page }, testInfo) => {
      await ready(page)
      const results = await scanPage(page, testInfo, 'dark')
      expect(results.violations).toEqual([])
    })

    test('zero axe violations, empty state (dark)', async ({ page }, testInfo) => {
      await ready(page, '/?q=zzzzzz')
      await expect(page.getByText('No spellbooks found.')).toBeVisible()
      const results = await scanPage(page, testInfo, 'dark empty')
      expect(results.violations).toEqual([])
    })
  })

  test('keyboard: the skip link moves focus to main and the ring shows [SC 2.4.1, 2.4.7]', async ({ page }) => {
    await ready(page)
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')
    await expect(page.locator('#main-content')).toBeFocused()
    await expect(page.locator('#main-content')).not.toHaveCSS('outline-style', 'none')
  })

  test('the first Tab press focuses the skip link [SC 2.4.1]', async ({ page }) => {
    await ready(page)
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: /skip to main content/i })).toBeFocused()
  })

  test('keyboard walk: logical Tab order and a visible ring of at least 2px on every stop [SC 2.4.3, 2.4.7]', async ({ page }) => {
    await ready(page)
    const expected = [
      'Skip to main content',
      'Catalogue',
      'About',
      'Reduce motion',
      'catalogue-search',
      'school-necromancy',
      'school-divination',
      'school-illusion',
      'school-herbalism',
      'school-warding',
      'school-alchemy',
      'hazard-mild',
      'hazard-perilous',
      'hazard-forbidden',
      BOOKS[0].title,
    ]
    for (const name of expected) {
      await page.keyboard.press('Tab')
      const stop = await focusStop(page)
      expect(stop.id || stop.text, `Tab stop ${name}`).toBe(name)
      expect(stop.ring, `ring on ${name}`).toBeGreaterThanOrEqual(2)
    }
  })

  test('typing changes the visible count as the user types', async ({ page }) => {
    await ready(page)
    await expect(page.getByText(countText(24), { exact: true })).toBeVisible()
    await search(page).pressSequentially('hollow index')
    const n = countMatching('hollow index')
    await expect(page.getByText(countText(n), { exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { level: 3 })).toHaveCount(n)
  })

  test('the polite region gets the new count after the debounce and the assertive region stays empty [SC 4.1.3]', async ({ page }) => {
    await ready(page)
    await expect(polite(page)).toHaveText('')
    await search(page).pressSequentially('ash')
    await expect(polite(page)).toHaveText(messageText(countMatching('ash')))
    await expect(assertive(page)).toHaveText('')
  })

  test('Space toggles a filter checkbox and narrows the list [SC 2.1.1, 4.1.2]', async ({ page }) => {
    await ready(page)
    const box = page.getByRole('checkbox', { name: 'Warding' })
    await box.focus()
    await page.keyboard.press('Space')
    await expect(box).toBeChecked()
    const warding = BOOKS.filter((b) => b.school === 'Warding').length
    await expect(page.getByRole('heading', { level: 3 })).toHaveCount(warding)
    await page.keyboard.press('Space')
    await expect(box).not.toBeChecked()
    await expect(page.getByRole('heading', { level: 3 })).toHaveCount(24)
  })

  test('Enter in the search box neither reloads nor navigates', async ({ page }) => {
    await ready(page)
    await search(page).fill('lantern')
    await search(page).press('Enter')
    await expect(page).toHaveURL(/\/\?q=lantern$/)
    await expect(search(page)).toHaveValue('lantern')
    await expect(search(page)).toBeFocused()
  })

  test('the empty state offers a fix, and Enter on "Clear search and filters" returns focus to the search box [SC 2.4.3, 3.3.3]', async ({ page }) => {
    await ready(page)
    await search(page).fill('zzzzzz')
    await expect(page.getByText('No spellbooks found.')).toBeVisible()
    await expect(page.getByText('Try a shorter search or clear some filters.')).toBeVisible()
    await expect(page.getByRole('alert')).toHaveCount(0)
    const clear = page.getByRole('button', { name: 'Clear search and filters' }).last()
    await clear.focus()
    await page.keyboard.press('Enter')
    await expect(search(page)).toBeFocused()
    await expect(search(page)).toHaveValue('')
    await expect(page.getByRole('heading', { level: 3 })).toHaveCount(24)
    await expect(page.getByRole('button', { name: 'Clear search and filters' })).toHaveCount(0)
  })

  test('Enter on a focused card link opens the detail page [SC 2.1.1]', async ({ page }) => {
    await ready(page)
    const link = page.getByRole('link', { name: BOOKS[0].title })
    await link.focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(new RegExp(`/books/${BOOKS[0].slug}$`))
    await expect(page.getByRole('heading', { level: 1, name: BOOKS[0].title })).toBeFocused()
  })

  test('each card has exactly one link and one tab stop [SC 2.4.4, 4.1.2]', async ({ page }) => {
    await ready(page)
    await expect(page.locator('li:has(h3) a')).toHaveCount(24)
    await expect(page.locator('li:has(h3) button, li:has(h3) input')).toHaveCount(0)
  })

  test('the card ring is drawn on the whole card and is not hidden under the sticky header [SC 2.4.7, 2.4.11]', async ({ page }) => {
    await ready(page)
    const link = page.getByRole('link', { name: BOOKS[10].title })
    await link.focus()
    const ring = await link.evaluate((el) => {
      const after = getComputedStyle(el, '::after')
      const card = el.closest('li')!.getBoundingClientRect()
      const header = document.querySelector('header')!.getBoundingClientRect()
      return { width: parseFloat(after.outlineWidth), style: after.outlineStyle, cardTop: card.top, headerBottom: header.bottom }
    })
    expect(ring.style).toBe('solid')
    expect(ring.width).toBeGreaterThanOrEqual(3)
    expect(ring.cardTop).toBeGreaterThanOrEqual(ring.headerBottom)
  })

  test('no keyboard trap: Tab leaves the page and Shift+Tab comes back [SC 2.1.2]', async ({ page }) => {
    await ready(page)
    let leftPage = false
    for (let i = 0; i < 80; i++) {
      await page.keyboard.press('Tab')
      const stop = await focusStop(page)
      // Leaving means focus went to the document (browser UI) or wrapped round to the skip link.
      if (stop.tag === 'BODY' || (i > 5 && stop.text === 'Skip to main content')) {
        leftPage = true
        break
      }
    }
    expect(leftPage, 'Tab never left the page within 80 presses').toBe(true)
    await page.keyboard.press('Shift+Tab')
    const back = await focusStop(page)
    expect(back.tag).not.toBe('BODY')
    expect(back.text).not.toBe('')
  })
})
