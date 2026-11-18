import type { Page } from '@playwright/test'

export interface FocusStop {
  tag: string
  id: string
  text: string
  /** Widest visible outline on the element or on its ::after (the card ring), in px. 0 means none. */
  ring: number
}

/** Describes the element that has focus now. The card link draws its ring on ::after, so both are read. */
export async function focusStop(page: Page): Promise<FocusStop> {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement
    const width = (style: CSSStyleDeclaration): number =>
      style.outlineStyle === 'none' || style.outlineStyle === 'hidden' ? 0 : parseFloat(style.outlineWidth)
    return {
      tag: el.tagName,
      id: el.id,
      text: (el.textContent ?? '').trim(),
      ring: Math.max(width(getComputedStyle(el)), width(getComputedStyle(el, '::after'))),
    }
  })
}
