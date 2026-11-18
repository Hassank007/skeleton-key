import { test, expect, type Page } from '@playwright/test'
import { activeStop, assertive, fixClock, focusStop, h1, polite, tabTo, typeDate, typeTime } from './support/keys'

/** Keyboard only (REQ-16.1). Invented data, fixed clock. */
const summary = (page: Page) => page.locator('[aria-labelledby="error-summary-title"]')

/** The text that the described-by ids of the focused control resolve to. */
const describedText = (page: Page, id: string) =>
  page.evaluate((fieldId) => {
    const el = document.getElementById(fieldId)!
    return (el.getAttribute('aria-describedby') ?? '')
      .split(/\s+/)
      .map((i) => document.getElementById(i)?.textContent ?? '')
      .join(' ')
  }, id)

test.describe('Booking: error path with the keyboard only', () => {
  test.beforeEach(async ({ page }) => {
    await fixClock(page)
  })

  test('errors are found, linked, fixed and the booking is finished [SC 2.1.1, 2.4.3, 3.3.1, 3.3.3, 4.1.3]', async ({ page }) => {
    // Step 1: Next with nothing selected.
    await page.goto('/book/spirit')
    await tabTo(page, 'Next')
    await page.keyboard.press('Enter')
    await expect(summary(page)).toBeFocused()
    await expect(summary(page).getByRole('link')).toHaveText(['Choose a spirit to continue.'])
    await expect(assertive(page)).toHaveText('1 problem found. Fix it to continue.')
    const group = page.getByRole('radiogroup')
    await expect(group).toHaveAttribute('aria-invalid', 'true')
    const groupDescribedBy = await group.getAttribute('aria-describedby')
    await expect(page.locator(`#${groupDescribedBy}`)).toHaveText('Error: Choose a spirit to continue.')
    await page.keyboard.press('Tab')
    await focusStop(page)
    await page.keyboard.press('Enter')
    await expect(page.locator('#field-spirit')).toBeFocused()
    await page.keyboard.press('Space')
    await expect(page.locator('#field-spirit')).toBeChecked()
    await tabTo(page, 'Next')
    await page.keyboard.press('Enter')

    // Step 2: both fields empty.
    await expect(h1(page)).toHaveText('Pick a date and time')
    await expect(h1(page)).toBeFocused()
    await tabTo(page, 'Next')
    await page.keyboard.press('Enter')
    await expect(summary(page)).toBeFocused()
    await expect(summary(page).getByRole('link')).toHaveText(['Enter a date.', 'Enter a time.'])
    await expect(assertive(page)).toHaveText('2 problems found. Fix them to continue.')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')
    await expect(page.locator('#field-date')).toBeFocused()

    // A date before the window: the field error appears when the field is left.
    await page.keyboard.type('11132025')
    await tabTo(page, 'field-time')
    await expect(page.locator('#field-date-error')).toContainText('Choose a date from tomorrow onwards.')
    expect(await describedText(page, 'field-date')).toContain('Error: Choose a date from tomorrow onwards.')
    await expect(page.locator('#field-date')).toHaveAttribute('aria-invalid', 'true')

    // Go back to the year segment and fix it: the error disappears.
    await tabTo(page, 'field-date', { back: true })
    await page.keyboard.press('Shift+Tab')
    expect((await activeStop(page)).id).toBe('field-date')
    await typeDate(page, '2030', '2030-11-13')
    await expect(page.locator('#field-date-error')).toHaveCount(0)
    await expect(page.locator('#field-date')).not.toHaveAttribute('aria-invalid', 'true')

    // Time: fix it and continue.
    await tabTo(page, 'field-time')
    await typeTime(page, '0830P', '20:30')
    await tabTo(page, 'Next')
    await page.keyboard.press('Enter')

    // Step 3: invalid e-mail and phone.
    await expect(h1(page)).toHaveText('Your details')
    await tabTo(page, 'field-name')
    await page.keyboard.type('Ada Example')
    await tabTo(page, 'field-email')
    await page.keyboard.type('ada-at-example')
    await tabTo(page, 'field-phone')
    await expect(page.locator('#field-email-error')).toContainText('Enter an email address in the form name@example.com.')
    await page.keyboard.type('555-CALL-NOW')
    await tabTo(page, 'Back')
    await expect(page.locator('#field-phone-error')).toContainText('Use only digits, spaces, plus, hyphens, dots and brackets.')
    await tabTo(page, 'Review and book')
    await page.keyboard.press('Enter')
    await expect(summary(page)).toBeFocused()
    await expect(summary(page).getByRole('link')).toHaveText([
      'Enter an email address in the form name@example.com.',
      'Use only digits, spaces, plus, hyphens, dots and brackets.',
    ])
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(assertive(page)).toHaveText('2 problems found. Fix them to continue.')

    // Fix each by keyboard. The summary link moves focus to the field.
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')
    await expect(page.locator('#field-email')).toBeFocused()
    await page.keyboard.press('Control+A')
    await page.keyboard.type('ada@example.com')
    await expect(page.locator('#field-email-error')).toHaveCount(0)
    await tabTo(page, 'field-phone')
    await page.keyboard.press('Control+A')
    await page.keyboard.type('+44 20 7946 0000')
    await expect(page.locator('#field-phone-error')).toHaveCount(0)
    await expect(summary(page)).toHaveCount(0)

    // Finish the booking.
    await tabTo(page, 'Review and book')
    await page.keyboard.press('Enter')
    await expect(page.getByRole('dialog', { name: 'Confirm your séance' })).toBeVisible()
    await tabTo(page, 'Book my séance')
    await page.keyboard.press('Enter')
    await expect(h1(page)).toHaveText('Your séance is booked')
    await expect(h1(page)).toBeFocused()
    await expect(polite(page)).toContainText('Séance booked with')
  })

  test('the guard sends a visit to step 3 back to step 1 and focus follows [SC 3.3.1, 2.4.3]', async ({ page }) => {
    await page.goto('/book/details')
    await expect(page).toHaveURL(/\/book\/spirit$/)
    await expect(h1(page)).toHaveText('Choose a spirit')
  })
})

test.describe('Keyboard trap check', () => {
  test.beforeEach(async ({ page }) => {
    await fixClock(page)
  })

  test('Tab forward and back through every step never traps focus and never lands on body [SC 2.1.2, 2.4.3]', async ({ page }) => {
    /** Presses `key` until focus leaves the page content (lands on body), checking the ring at every stop. */
    const untilBody = async (key: 'Tab' | 'Shift+Tab') => {
      const seen: string[] = []
      for (let i = 0; i < 40; i++) {
        await page.keyboard.press(key)
        const stop = await activeStop(page)
        if (stop.tag === 'BODY') return seen
        await focusStop(page)
        seen.push(`${stop.tag}#${stop.id}:${stop.name}`)
      }
      throw new Error(`${key} never left the page content; visited ${seen.join(' > ')}`)
    }

    const walk = async () => {
      const forward = await untilBody('Tab')
      // One more Tab wraps to the first element, the skip link: the page is not a trap.
      await page.keyboard.press('Tab')
      expect((await focusStop(page)).name).toBe('Skip to main content')
      // Backward: Shift+Tab leaves the content, then comes back in from the end and leaves again.
      expect(await untilBody('Shift+Tab')).toHaveLength(0)
      const backward = await untilBody('Shift+Tab')
      expect(backward.length).toBeGreaterThan(4)
      await page.keyboard.press('Tab')
      expect((await focusStop(page)).name).toBe('Skip to main content')
      return forward
    }
    await page.goto('/book/spirit')
    expect((await walk()).length).toBeGreaterThan(4)
    // The browser remembers where focus last was in the radio group, so any radio will do.
    await tabTo(page, /^(field-spirit|spirit-)/, { skipBody: true })
    await page.keyboard.press('Space')
    await tabTo(page, 'Next')
    await page.keyboard.press('Enter')
    await expect(h1(page)).toHaveText('Pick a date and time')
    expect((await walk()).length).toBeGreaterThan(4)
    await tabTo(page, 'field-date', { skipBody: true })
    await typeDate(page, '11132030', '2030-11-13')
    await tabTo(page, 'field-time')
    await typeTime(page, '0830P', '20:30')
    await tabTo(page, 'Next')
    await page.keyboard.press('Enter')
    await expect(h1(page)).toHaveText('Your details')
    expect((await walk()).length).toBeGreaterThan(4)
  })
})