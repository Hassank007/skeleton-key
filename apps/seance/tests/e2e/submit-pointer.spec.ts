import { test, expect, type Page } from '@playwright/test'
import { fixClock } from './support/keys'

/**
 * Pointer press on the submit button after a field was focused (SC 3.3.1, 2.4.3).
 * Blurring the field must not show an inline error that moves the button before the click lands.
 */
const summary = (page: Page) => page.locator('[aria-labelledby="error-summary-title"]')

test.describe('Submit by pointer from a focused field', () => {
  test.beforeEach(async ({ page }) => {
    await fixClock(page)
  })

  test('step 1: clicking Next with a focused, unchosen radio shows and focuses the summary', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Start booking' }).click()
    await page.locator('input[name=spirit]').first().focus()
    await page.getByRole('button', { name: 'Next' }).click()
    await expect(summary(page)).toBeVisible()
    await expect(summary(page)).toBeFocused()
    await expect(summary(page).getByRole('link')).toHaveText(['Choose a spirit to continue.'])
  })

  test('step 3: clicking Review and book with a focused, empty Full name shows and focuses the summary', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Start booking' }).click()
    await page.locator('input[name=spirit]').first().check()
    await page.getByRole('button', { name: 'Next' }).click()
    await page.locator('input[type=date]').fill('2030-11-13')
    await page.locator('input[type=time]').fill('20:30')
    await page.getByRole('button', { name: 'Next' }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Your details')
    await page.getByLabel('Full name').focus()
    await page.getByRole('button', { name: 'Review and book' }).click()
    await expect(summary(page)).toBeVisible()
    await expect(summary(page)).toBeFocused()
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })

  test('leaving a field for something else still shows its inline error', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Start booking' }).click()
    await page.locator('input[name=spirit]').first().check()
    await page.getByRole('button', { name: 'Next' }).click()
    await page.locator('input[type=date]').fill('2030-11-13')
    await page.locator('input[type=time]').fill('20:30')
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByLabel('Full name').focus()
    await page.getByRole('heading', { level: 1 }).click()
    await expect(page.locator('#field-name-error')).toBeVisible()
  })
})
