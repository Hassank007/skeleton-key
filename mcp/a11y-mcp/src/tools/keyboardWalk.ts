import type { CDPSession, Page } from 'playwright'
import { describeFocused, openSession, startWalk, styleOf, type FocusedElement, type StyleSnapshot } from '../lib/axTree.js'
import { withPage } from '../lib/browser.js'
import { ToolError } from '../lib/errors.js'
import { decideFocusVisible } from '../lib/focusStyle.js'

export interface WalkStep {
  index: number
  selector: string
  tag: string
  role: string
  name: string
  hasVisibleFocus: boolean
}

export type StopReason = 'wrapped' | 'left-document' | 'trap' | 'max-steps' | 'no-focusable'

export interface TrapRecord {
  kind: 'self-loop' | 'cycle'
  elements: WalkStep[]
  escapedWith: 'Shift+Tab' | 'Escape' | null
}

export interface WalkResult {
  url: string
  finalUrl: string
  steps: WalkStep[]
  summary: {
    stepCount: number
    distinctElements: number
    stoppedBecause: StopReason
    noVisibleFocus: { index: number; selector: string }[]
    noAccessibleName: { index: number; selector: string }[]
    trap: TrapRecord | null
  }
}

interface Pending {
  step: WalkStep
  key: number
  focused: FocusedElement
  decided: boolean
}

/**
 * Observed in headless Chromium (task 6.1): after the last focusable element, one more Tab puts focus
 * on <body> with document.hasFocus() false (focus has gone to the browser UI), and the next Tab returns
 * to the first element. So a page without a trap normally ends as `left-document`, and `wrapped` happens
 * only when a page itself moves focus back to its first element. Both are handled.
 */
export async function keyboardWalk(input: { url: string; maxSteps: number }): Promise<WalkResult> {
  if (!Number.isInteger(input.maxSteps) || input.maxSteps < 1 || input.maxSteps > 200) {
    throw new ToolError(`Invalid "maxSteps": ${String(input.maxSteps)}. It must be an integer from 1 to 200.`)
  }
  return withPage(input.url, async (page, info) => {
    const session = await openSession(page)
    await startWalk(page)
    const walk = await run(page, session, input.maxSteps)
    return { url: info.url, finalUrl: info.finalUrl, ...walk }
  })
}

async function run(page: Page, session: CDPSession, maxSteps: number): Promise<Omit<WalkResult, 'url' | 'finalUrl'>> {
  const pending: Pending[] = []
  const indexOfKey = new Map<number, number>()
  let stoppedBecause: StopReason = 'max-steps'
  let trap: TrapRecord | null = null

  /** Decide `hasVisibleFocus` for an element that has just lost focus (or, for a self-loop, still holds it). */
  const settle = async (p: Pending, stillFocused: boolean): Promise<void> => {
    if (p.decided) return
    const unfocused: StyleSnapshot | null = stillFocused ? null : await styleOf(page, p.key)
    p.step.hasVisibleFocus =
      p.focused.inViewport && p.focused.hasSize && decideFocusVisible(p.focused.style, unfocused)
    p.decided = true
  }

  const press = async (key: string): Promise<FocusedElement | null> => {
    await page.keyboard.press(key)
    return describeFocused(session)
  }

  let reachedMax = true
  for (let i = 1; i <= maxSteps; i++) {
    const current = await press('Tab')
    const previous = pending[pending.length - 1]
    if (current === null || current.isBody) {
      if (previous) await settle(previous, false)
      stoppedBecause = previous ? 'left-document' : 'no-focusable'
      reachedMax = false
      break
    }
    if (previous) await settle(previous, previous.key === current.key)
    if (pending[0] && current.key === pending[0].key) {
      stoppedBecause = 'wrapped'
      reachedMax = false
      break
    }
    if (previous && current.key === previous.key) {
      trap = await recordTrap(page, session, 'self-loop', [previous])
      stoppedBecause = 'trap'
      reachedMax = false
      break
    }
    const seenAt = indexOfKey.get(current.key)
    if (seenAt !== undefined) {
      trap = await recordTrap(page, session, 'cycle', pending.slice(seenAt))
      stoppedBecause = 'trap'
      reachedMax = false
      break
    }
    indexOfKey.set(current.key, pending.length)
    pending.push({
      key: current.key,
      focused: current,
      decided: false,
      step: {
        index: pending.length + 1,
        selector: current.selector,
        tag: current.tag,
        role: current.role,
        name: current.name,
        hasVisibleFocus: false,
      },
    })
  }

  if (reachedMax) {
    // The last element still holds focus. One more Tab shows whether its style changes when it loses focus.
    const last = pending[pending.length - 1]
    if (last) {
      const after = await press('Tab')
      await settle(last, after?.key === last.key)
    }
    stoppedBecause = 'max-steps'
  }

  const steps = pending.map((p) => p.step)
  return {
    steps,
    summary: {
      stepCount: steps.length,
      distinctElements: new Set(pending.map((p) => p.key)).size,
      stoppedBecause,
      noVisibleFocus: steps.filter((s) => !s.hasVisibleFocus).map((s) => ({ index: s.index, selector: s.selector })),
      noAccessibleName: steps.filter((s) => s.name === '').map((s) => ({ index: s.index, selector: s.selector })),
      trap,
    },
  }
}

/**
 * Try Shift+Tab, then Escape, and report which key (if any) moved focus out of the loop (REQ-4.10).
 * Every element in the loop is already settled by the walk loop.
 */
async function recordTrap(
  page: Page,
  session: CDPSession,
  kind: TrapRecord['kind'],
  loop: Pending[],
): Promise<TrapRecord> {
  const keys = new Set(loop.map((p) => p.key))
  let escapedWith: TrapRecord['escapedWith'] = null
  for (const key of ['Shift+Tab', 'Escape'] as const) {
    await page.keyboard.press(key)
    const now = await describeFocused(session)
    if (now === null || now.isBody || !keys.has(now.key)) {
      escapedWith = key
      break
    }
  }
  return { kind, elements: loop.map((p) => ({ ...p.step })), escapedWith }
}
