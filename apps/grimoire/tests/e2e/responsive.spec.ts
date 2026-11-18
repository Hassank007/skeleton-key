import { test, expect, type Page } from '@playwright/test'

const ready = async (page: Page, url: string) => {
  await page.goto(url)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
}

const noHorizontalScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)

test.describe('Responsive and text spacing', () => {
  test.use({ viewport: { width: 320, height: 800 } })

  test('catalogue at 320px has no horizontal scroll [SC 1.4.10]', async ({ page }) => {
    await ready(page, '/')
    expect(await noHorizontalScroll(page)).toBe(true)
    await page.getByLabel('Search spellbooks').fill('zzzzzz')
    await expect(page.getByText('No spellbooks found.')).toBeVisible()
    expect(await noHorizontalScroll(page)).toBe(true)
  })

  test('a detail page at 320px has no horizontal scroll [SC 1.4.10]', async ({ page }) => {
    await ready(page, '/books/the-lantern-of-small-hours')
    expect(await noHorizontalScroll(page)).toBe(true)
  })

  test('the cards are one column at 320px [SC 1.4.10]', async ({ page }) => {
    await ready(page, '/')
    const lefts = await page.locator('li:has(h3)').evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().left)))
    expect(new Set(lefts).size).toBe(1)
  })

  test('the WCAG text-spacing overrides clip nothing and overlap nothing [SC 1.4.12]', async ({ page }) => {
    await ready(page, '/')
    await page.addStyleTag({
      content: `
        * { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; }
        p { margin-bottom: 2em !important; }
      `,
    })
    const clipped = await page.evaluate(() => {
      const out: string[] = []
      const targets = document.querySelectorAll<HTMLElement>('li h3, li h3 a, label, legend, p')
      for (const el of Array.from(targets)) {
        if (el.scrollHeight > el.clientHeight + 1 && getComputedStyle(el).display !== 'inline') out.push(`${el.tagName} ${el.textContent?.slice(0, 30)} (height)`)
        if (el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).display !== 'inline') out.push(`${el.tagName} ${el.textContent?.slice(0, 30)} (width)`)
      }
      return out
    })
    expect(clipped).toEqual([])
    expect(await noHorizontalScroll(page)).toBe(true)

    const overlaps = await page.evaluate(() => {
      const bad: string[] = []
      for (const label of Array.from(document.querySelectorAll<HTMLElement>('label[for^="school-"], label[for^="hazard-"]'))) {
        const box = document.getElementById(label.getAttribute('for')!)!.getBoundingClientRect()
        const text = label.getBoundingClientRect()
        if (box.right > text.left + 0.5 && box.left < text.right && box.bottom > text.top && box.top < text.bottom) bad.push(label.textContent ?? '')
      }
      return bad
    })
    expect(overlaps).toEqual([])
  })

  test('a card title is fully visible under text spacing [SC 1.4.12]', async ({ page }) => {
    await ready(page, '/')
    await page.addStyleTag({ content: '* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; }' })
    const card = page.locator('li:has(h3)').first()
    const h3 = card.locator('h3')
    const [cardBox, titleBox] = await Promise.all([card.boundingBox(), h3.boundingBox()])
    expect(titleBox!.y + titleBox!.height).toBeLessThanOrEqual(cardBox!.y + cardBox!.height + 1)
    expect(titleBox!.x + titleBox!.width).toBeLessThanOrEqual(cardBox!.x + cardBox!.width + 1)
  })

  test('targets are at least 24 by 24 CSS px [SC 2.5.8]', async ({ page }) => {
    await ready(page, '/')
    const small = await page.evaluate(() => {
      const bad: string[] = []
      for (const el of Array.from(document.querySelectorAll<HTMLElement>('main a, main button, main input, main label'))) {
        const r = el.getBoundingClientRect()
        if (r.width === 0 || r.height === 0) continue
        if (r.width < 24 || r.height < 24) bad.push(`${el.tagName} ${el.id || el.textContent?.slice(0, 20)} ${Math.round(r.width)}x${Math.round(r.height)}`)
      }
      return bad
    })
    expect(small).toEqual([])
  })
})
