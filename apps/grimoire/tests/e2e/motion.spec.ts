import { test, expect, type Page } from '@playwright/test'

/** The animated part of the candle: its flame path. */
const flame = (page: Page) => page.getByTestId('candle').locator('path').first()

test.describe('Motion', () => {
  test('the candle is decorative and stops with OS reduced motion [SC 1.1.1]', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await expect(page.getByTestId('candle')).toHaveAttribute('aria-hidden', 'true')
    await expect(flame(page)).toHaveCSS('animation-name', 'none')
  })

  test('the candle animates when no preference is set', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto('/')
    await expect(flame(page)).not.toHaveCSS('animation-name', 'none')
  })

  test('the "Reduce motion" toggle stops the candle [SC 2.2.2]', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto('/')
    await expect(flame(page)).not.toHaveCSS('animation-name', 'none')
    const toggle = page.getByRole('button', { name: 'Reduce motion' })
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')
    await expect(flame(page)).toHaveCSS('animation-name', 'none')
  })
})
