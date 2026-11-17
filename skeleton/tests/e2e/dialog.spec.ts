import { test, expect } from '@playwright/test'

/**
 * Dialog E2E tests — run on real Chromium where `inert` fully works.
 * Tests the demo Dialog on the About page.
 */
test.describe('Dialog (About page demo)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/about')
  })

  test('opens the dialog and focus moves inside', async ({ page }) => {
    await page.getByTestId('open-demo-dialog').click()
    // Dialog must be in the DOM
    await expect(page.getByRole('dialog')).toBeVisible()
    // Focus must be inside the dialog — the first focusable element is "Close dialog"
    const focusedLabel = await page.evaluate(() => {
      const el = document.activeElement
      return (el as HTMLElement)?.getAttribute('aria-label') ?? el?.textContent?.trim()
    })
    expect(focusedLabel).toMatch(/close dialog/i)
  })

  test('Tab cycles focus inside the dialog and does not escape', async ({ page }) => {
    await page.getByTestId('open-demo-dialog').click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // Collect all focusable button labels inside the dialog
    // Dialog has: "Close dialog" (header), "Done" (body)
    // Tab from Close → Done → wraps back to Close
    await page.keyboard.press('Tab')
    const afterFirst = await page.evaluate(() => {
      const el = document.activeElement
      return (el as HTMLElement)?.textContent?.trim()
    })
    expect(afterFirst).toMatch(/done/i)

    await page.keyboard.press('Tab')
    const afterSecond = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement
      return el?.getAttribute('aria-label') ?? el?.textContent?.trim()
    })
    expect(afterSecond).toMatch(/close dialog/i)
  })

  test('page behind the dialog is inert (background button cannot be focused)', async ({ page }) => {
    // Add a temporary button to the page behind the dialog so we can verify inert.
    // The About page "Open demo dialog" trigger is in the app root, which becomes inert.
    await page.getByTestId('open-demo-dialog').click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // The trigger button is in the #root element, which the Dialog marks inert.
    // A focused element in an inert subtree is not the document.activeElement.
    const triggerIsFocusable = await page.evaluate(() => {
      const trigger = document.querySelector('[data-testid="open-demo-dialog"]') as HTMLElement | null
      if (!trigger) return false
      // Try to focus it programmatically; inert prevents this.
      trigger.focus()
      return document.activeElement === trigger
    })
    expect(triggerIsFocusable).toBe(false)
  })

  test('Escape closes the dialog and returns focus to the trigger', async ({ page }) => {
    const triggerBtn = page.getByTestId('open-demo-dialog')
    await triggerBtn.click()
    await expect(page.getByRole('dialog')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).not.toBeVisible()

    // Focus must return to the trigger button
    const focusedText = await page.evaluate(() => document.activeElement?.textContent?.trim())
    expect(focusedText).toMatch(/open demo dialog/i)
  })
})
