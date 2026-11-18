import { test, expect } from '@playwright/test'
import { assertive, fixClock, focusStop, h1, polite, tabTo, typeDate, typeTime } from './support/keys'

/** Keyboard only: page.keyboard drives everything (REQ-16.1). Invented data, fixed clock (REQ-16.2). */
test.describe('Booking: happy path with the keyboard only', () => {
  test.beforeEach(async ({ page }) => {
    await fixClock(page)
  })

  test('books a séance from the introduction to the success view [SC 2.1.1, 2.4.3, 2.4.7, 3.3.7, 4.1.3]', async ({ page }) => {
    const labels: string[] = []
    const noteControls = async () => {
      const names = await page.evaluate(() =>
        Array.from(document.querySelectorAll<HTMLInputElement>('main input')).map((i) => {
          const ids = i.getAttribute('aria-labelledby')
          const text = ids ? document.getElementById(ids)?.textContent : i.labels?.[0]?.textContent
          return (text ?? '').replace(/\s*\(required\)\s*$/, '').trim()
        }),
      )
      labels.push(...names)
    }

    // Introduction: the skip link is the first Tab stop, then "Start booking".
    await page.goto('/')
    await expect(h1(page)).toHaveText('Book a séance with a spirit')
    await page.keyboard.press('Tab')
    const first = await focusStop(page)
    expect(first.name).toBe('Skip to main content')
    await tabTo(page, 'Start booking')
    await page.keyboard.press('Enter')

    // Step 1
    await expect(h1(page)).toBeFocused()
    await expect(h1(page)).toHaveText('Choose a spirit')
    await expect(page).toHaveTitle('Step 1 of 3: Choose a spirit — Seance')
    await expect(polite(page)).toHaveText('Step 1 of 3: Choose a spirit — Seance')
    await expect(page.getByText('Step 1 of 3', { exact: true })).toBeVisible()
    await tabTo(page, 'field-spirit')
    await page.keyboard.press('ArrowDown')
    const chosen = await page.evaluate(() => (document.querySelector('input[name="spirit"]:checked') as HTMLInputElement).value)
    expect(chosen).toBe('old-tobias-the-lamplighter')
    await noteControls()
    await tabTo(page, 'Next')
    await page.keyboard.press('Enter')

    // Step 2
    await expect(h1(page)).toBeFocused()
    await expect(h1(page)).toHaveText('Pick a date and time')
    await expect(page).toHaveTitle('Step 2 of 3: Pick a date and time — Seance')
    await expect(page.getByText('Step 2 of 3', { exact: true })).toBeVisible()
    await expect(polite(page)).toHaveText('Step 2 of 3: Pick a date and time — Seance')
    await tabTo(page, 'field-date')
    await typeDate(page, '11132030', '2030-11-13')
    await tabTo(page, 'field-time')
    await typeTime(page, '0830P', '20:30')
    await noteControls()
    await tabTo(page, 'Next')
    await page.keyboard.press('Enter')

    // Step 3
    await expect(h1(page)).toBeFocused()
    await expect(h1(page)).toHaveText('Your details')
    await expect(page).toHaveTitle('Step 3 of 3: Your details — Seance')
    await tabTo(page, 'field-name')
    await page.keyboard.type('Ada Example')
    await tabTo(page, 'field-email')
    await page.keyboard.type('ada@example.com')
    await tabTo(page, 'field-phone')
    await page.keyboard.type('+44 20 7946 0000')
    await expect(page.locator('#field-name')).toHaveAttribute('autocomplete', 'name')
    await expect(page.locator('#field-email')).toHaveAttribute('autocomplete', 'email')
    await expect(page.locator('#field-phone')).toHaveAttribute('autocomplete', 'tel')
    await noteControls()
    await expect(page.locator('main input[type="text"], main input[type="email"], main input[type="tel"]')).toHaveCount(3)

    // Back keeps the date and time (REQ-16.4), and Next brings the details back.
    await tabTo(page, 'Back')
    await page.keyboard.press('Enter')
    await expect(h1(page)).toHaveText('Pick a date and time')
    await expect(page.locator('#field-date')).toHaveValue('2030-11-13')
    await expect(page.locator('#field-time')).toHaveValue('20:30')
    await tabTo(page, 'Next')
    await page.keyboard.press('Enter')
    await expect(h1(page)).toHaveText('Your details')
    await expect(page.locator('#field-email')).toHaveValue('ada@example.com')

    // No label repeats across the steps.
    expect(new Set(labels).size, `labels: ${labels.join(', ')}`).toBe(labels.length)

    // Review: dialog, focus trap, Escape returns focus.
    await tabTo(page, 'Review and book')
    await page.keyboard.press('Enter')
    const dialog = page.getByRole('dialog', { name: 'Confirm your séance' })
    await expect(dialog).toBeVisible()
    await expect(dialog.locator('dd')).toHaveText([
      'Old Tobias the Lamplighter',
      'Wednesday, November 13, 2030',
      '8:30 PM',
      'Ada Example',
      'ada@example.com',
      '+44 20 7946 0000',
    ])
    const inside = () => page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))
    await expect.poll(inside).toBe(true)
    await focusStop(page)
    await page.keyboard.press('Shift+Tab')
    expect(await inside()).toBe(true)
    await page.keyboard.press('Tab')
    expect(await inside()).toBe(true)
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('Tab')
      expect(await inside()).toBe(true)
    }
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(page.getByRole('button', { name: 'Review and book' })).toBeFocused()

    // Book.
    await page.keyboard.press('Enter')
    await expect(dialog).toBeVisible()
    await tabTo(page, 'Book my séance')
    await page.keyboard.press('Enter')
    // The loading message is announced after the dialog has closed (no setTimeout fallback was needed).
    await expect(polite(page)).toHaveText('Booking your séance…')
    await expect(polite(page)).toContainText('Séance booked with Old Tobias the Lamplighter on Wednesday, November 13, 2030 at 8:30 PM.')
    await expect(h1(page)).toHaveText('Your séance is booked')
    await expect(h1(page)).toBeFocused()
    await expect(page).toHaveTitle('Séance booked — Seance')
    await expect(assertive(page)).toHaveText('')
  })
})