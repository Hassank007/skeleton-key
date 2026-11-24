import { test, expect } from '@playwright/test'
import { openPage } from './support/keys'

/** The drifting mist is the only moving art. Its group carries the animation. */
const drift = 'main svg[aria-hidden="true"] g'

test.describe('Mist art and motion', () => {
  test('the mist is aria-hidden and has no title [SC 1.1.1]', async ({ page }) => {
    await page.goto('/')
    const svg = page.locator('main svg[aria-hidden="true"]')
    await expect(svg).toHaveCount(1)
    await expect(svg.locator('title')).toHaveCount(0)
  })

  test('with the OS reduced-motion setting the mist does not animate [SC 2.2.2]', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await expect(page.locator(drift)).toHaveCSS('animation-name', 'none')
  })

  test('without the OS setting the mist drifts, and the in-app "Reduce motion" toggle stops it [SC 2.2.2]', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto('/')
    await expect(page.locator(drift)).not.toHaveCSS('animation-name', 'none')
    const toggle = page.getByRole('button', { name: 'Reduce motion' })
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator(drift)).toHaveCSS('animation-name', 'none')
  })

  test('the toggle works from the keyboard [SC 2.1.1, 2.2.2]', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await openPage(page, '/')
    const toggle = page.getByRole('button', { name: 'Reduce motion' })
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('Tab')
      if (await toggle.evaluate((el) => el === document.activeElement)) break
    }
    await expect(toggle).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.locator(drift)).toHaveCSS('animation-name', 'none')
  })
})