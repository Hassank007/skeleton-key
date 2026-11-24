import { test, expect } from '@playwright/test'

const TEXT = 'the lantern of small hours'

// A slow device: the browser's CPU is throttled, so React Router applies each URL write late, after newer keystrokes.
test.describe('Typing quickly on a slow device', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const cdp = await page.context().newCDPSession(page)
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 })
  })

  test('loses no characters and ends with the full text in the box and in the address', async ({ page }) => {
    const input = page.getByLabel('Search spellbooks')
    await input.pressSequentially(TEXT)
    await expect(input).toHaveValue(TEXT)
    await expect(page).toHaveURL(/\/\?q=the\+lantern\+of\+small\+hours$/)
    // Still the same after everything has settled.
    await page.waitForTimeout(500)
    await expect(input).toHaveValue(TEXT)
  })

  test('the box shows every keystroke as it is typed, never an older value', async ({ page }) => {
    const input = page.getByLabel('Search spellbooks')
    await input.evaluate((el) => {
      const seen: string[] = []
      ;(window as unknown as { __seen: string[] }).__seen = seen
      el.addEventListener('input', () => seen.push((el as HTMLInputElement).value))
    })
    await input.pressSequentially(TEXT)
    await expect(input).toHaveValue(TEXT)
    const seen = await page.evaluate(() => (window as unknown as { __seen: string[] }).__seen)
    // Each input event extends the one before it: no character was dropped in between.
    for (let i = 0; i < seen.length; i++) expect(seen[i]).toBe(TEXT.slice(0, i + 1))
    expect(seen).toHaveLength(TEXT.length)
  })

  test('Back returns to an address this page wrote earlier, and the box follows it', async ({ page }) => {
    await page.goto('/?q=ember')
    const input = page.getByLabel('Search spellbooks')
    await expect(input).toHaveValue('ember')
    await input.press('End')
    await input.pressSequentially('xyz')
    await expect(input).toHaveValue('emberxyz')
    await expect(page).toHaveURL(/\/\?q=emberxyz$/)
    await page.getByRole('link', { name: 'About' }).click()
    await expect(page).toHaveURL(/\/about$/)
    await page.goBack()
    await expect(page).toHaveURL(/\/\?q=emberxyz$/)
    await expect(input).toHaveValue('emberxyz')
  })

  test('typing and then pressing Back at once leaves the box matching the address after Forward', async ({ page }) => {
    await page.goto('/about')
    await page.getByRole('link', { name: 'Catalogue' }).first().click()
    const input = page.getByLabel('Search spellbooks')
    await expect(input).toBeVisible()
    await input.pressSequentially('lantern')
    await page.goBack()
    await expect(page).toHaveURL(/\/about$/)
    await page.goForward()
    await expect(input).toBeVisible()
    const q = new URL(page.url()).searchParams.get('q') ?? ''
    await expect(input).toHaveValue(q)
  })
})
