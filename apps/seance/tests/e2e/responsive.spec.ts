import { test, expect, type Page } from '@playwright/test'
import { fixClock, h1 } from './support/keys'

/** Step 3 with its error summary showing. */
async function step3WithErrors(page: Page) {
  await fixClock(page)
  await page.goto('/book/spirit')
  await page.getByRole('radio', { name: 'Mara the Weeping Widow' }).check()
  await page.getByRole('button', { name: 'Next' }).click()
  await page.getByLabel(/^Date/).fill('2030-11-13')
  await page.getByLabel(/^Time/).fill('20:30')
  await page.getByRole('button', { name: 'Next' }).click()
  await expect(h1(page)).toHaveText('Your details')
  await page.getByLabel(/^Full name/).press('Enter')
  await expect(page.getByRole('heading', { name: 'There is a problem' })).toBeVisible()
}

/** Elements whose content is wider or taller than their box while their overflow hides it, or that stick out of the viewport. */
async function clipped(page: Page) {
  return page.evaluate(() => {
    const out: string[] = []
    const width = document.documentElement.clientWidth
    for (const el of Array.from(document.querySelectorAll<HTMLElement>('main *, header *, footer *'))) {
      if (el.closest('svg')) continue
      const style = getComputedStyle(el)
      const rect = el.getBoundingClientRect()
      if (rect.width === 0 && rect.height === 0) continue
      const hides = (v: string) => v === 'hidden' || v === 'clip'
      if (hides(style.overflowX) && el.scrollWidth > el.clientWidth + 1) out.push(`${el.tagName} ${el.textContent?.slice(0, 30)} clips horizontally`)
      if (hides(style.overflowY) && el.scrollHeight > el.clientHeight + 1) out.push(`${el.tagName} ${el.textContent?.slice(0, 30)} clips vertically`)
      if (rect.right > width + 1 || rect.left < -1) out.push(`${el.tagName} ${el.textContent?.slice(0, 30)} leaves the viewport`)
    }
    return out
  })
}

test.describe('Reflow and text spacing', () => {
  test('at 320 px wide, step 3 with errors has no horizontal scroll and nothing is clipped [SC 1.4.10]', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 })
    await step3WithErrors(page)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(0)
    expect(await clipped(page)).toEqual([])
    // Every control and button is still reachable and at least 24 px high and wide (SC 2.5.8).
    const small = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>('main input, main button, main a'))
        .map((el) => ({ name: el.textContent?.trim() || el.id, r: el.getBoundingClientRect() }))
        .filter(({ r }) => r.width < 24 || r.height < 24)
        .map(({ name }) => name),
    )
    expect(small).toEqual([])
  })

  test('with the WCAG text-spacing overrides, step 3 with errors loses no text and does not overlap [SC 1.4.12]', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await step3WithErrors(page)
    await page.addStyleTag({
      content: `* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; }
        p { margin-bottom: 2em !important; }`,
    })
    expect(await clipped(page)).toEqual([])
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(0)
    // Labels, hints and errors do not overlap the control that follows them.
    const overlaps = await page.evaluate(() => {
      const out: string[] = []
      for (const field of ['name', 'email', 'phone']) {
        const input = document.getElementById(`field-${field}`)!.getBoundingClientRect()
        const label = document.querySelector(`label[for="field-${field}"]`)!.getBoundingClientRect()
        const hint = document.getElementById(`field-${field}-hint`)!.getBoundingClientRect()
        if (label.bottom > hint.top + 1) out.push(`${field}: label overlaps hint`)
        if (hint.bottom > input.top + 1) out.push(`${field}: hint overlaps input`)
        const error = document.getElementById(`field-${field}-error`)?.getBoundingClientRect()
        if (error && input.bottom > error.top + 1) out.push(`${field}: input overlaps error`)
      }
      return out
    })
    expect(overlaps).toEqual([])
  })
})