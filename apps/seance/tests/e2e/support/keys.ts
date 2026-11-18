import { expect, type Locator, type Page } from '@playwright/test'

/** The fixed "now" for the keyboard specs: 2030-10-30 12:00. The booking window is 2030-10-31 to 2031-01-28. */
export const FIXED_NOW = new Date('2030-10-30T12:00:00')

/** Fixes Date for the page. Call before `page.goto`. Locale and time zone come from playwright.config.ts (en-US, UTC). */
export async function fixClock(page: Page): Promise<void> {
  await page.clock.setFixedTime(FIXED_NOW)
}

export interface Stop {
  tag: string
  id: string
  name: string
  outlineStyle: string
  outlineWidth: number
}

/** Describes the focused element: its accessible-ish name and its focus ring. */
export async function activeStop(page: Page): Promise<Stop> {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement
    const byId = (ids: string | null) =>
      ids ? ids.split(/\s+/).map((i) => document.getElementById(i)?.textContent ?? '').join(' ') : null
    const labelled = byId(el.getAttribute('aria-labelledby'))
    const label = (el as HTMLInputElement).labels?.[0]?.textContent ?? null
    const name = (el.getAttribute('aria-label') ?? labelled ?? label ?? el.textContent ?? '').replace(/\s+/g, ' ').trim()
    const style = getComputedStyle(el)
    return { tag: el.tagName, id: el.id, name, outlineStyle: style.outlineStyle, outlineWidth: parseFloat(style.outlineWidth) }
  })
}

/** Asserts the focused element shows a focus ring of at least 2 px (SC 2.4.7) and returns its description. */
export async function focusStop(page: Page): Promise<Stop> {
  const stop = await activeStop(page)
  expect(stop.tag, 'focus is on the page, not on body').not.toBe('BODY')
  expect(stop.outlineStyle, `focus ring style on "${stop.name}"`).not.toBe('none')
  expect(stop.outlineWidth, `focus ring width on "${stop.name}"`).toBeGreaterThanOrEqual(2)
  return stop
}

/**
 * Presses Tab (or Shift+Tab) until the focused element has this id or a name that matches, checking the focus ring at
 * every stop. Fails if it is not reached within `max` presses. Returns the stops visited.
 */
export async function tabTo(page: Page, target: string | RegExp, options: { back?: boolean; max?: number; skipBody?: boolean } = {}): Promise<Stop[]> {
  const visited: Stop[] = []
  const key = options.back ? 'Shift+Tab' : 'Tab'
  for (let i = 0; i < (options.max ?? 15); i++) {
    await page.keyboard.press(key)
    // Chromium parks focus on the document for one press when it re-enters the page from the browser UI.
    if (options.skipBody && (await activeStop(page)).tag === 'BODY') continue
    const stop = await focusStop(page)
    visited.push(stop)
    const hit = typeof target === 'string' ? stop.id === target || stop.name === target : target.test(stop.name) || target.test(stop.id)
    if (hit) return visited
  }
  throw new Error(`Did not reach ${String(target)} with ${key}. Visited: ${visited.map((s) => s.name || s.id).join(' > ')}`)
}

/** The value of the focused input. */
export function activeValue(page: Page): Promise<string> {
  return page.evaluate(() => (document.activeElement as HTMLInputElement).value)
}

/** Types month, day and year segments into a focused en-US date input, then checks the value. `11132030` gives 2030-11-13. */
export async function typeDate(page: Page, mmddyyyy: string, expectedIso: string): Promise<void> {
  await page.keyboard.type(mmddyyyy)
  expect(await activeValue(page), `date input value after typing ${mmddyyyy}`).toBe(expectedIso)
}

/** Types hour, minute and AM/PM segments into a focused en-US time input, then checks the value. `0830P` gives 20:30. */
export async function typeTime(page: Page, hhmmAp: string, expected24h: string): Promise<void> {
  await page.keyboard.type(hhmmAp)
  expect(await activeValue(page), `time input value after typing ${hhmmAp}`).toBe(expected24h)
}

/** The shared live regions. */
export const polite = (page: Page): Locator => page.locator('[aria-live="polite"]')
export const assertive = (page: Page): Locator => page.locator('[aria-live="assertive"]')

/** The current page h1. */
export const h1 = (page: Page): Locator => page.getByRole('heading', { level: 1 })