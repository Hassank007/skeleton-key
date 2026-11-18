import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { closeBrowser } from '../src/lib/browser.js'
import { decideFocusVisible } from '../src/lib/focusStyle.js'
import { keyboardWalk } from '../src/tools/keyboardWalk.js'
import { startFixtureServer, type FixtureServer } from './helpers/fixture-server.js'

let fixtures: FixtureServer

beforeAll(async () => {
  fixtures = await startFixtureServer()
})

afterAll(async () => {
  await fixtures.close()
  await closeBrowser()
})

const walk = (page: string, maxSteps = 50): ReturnType<typeof keyboardWalk> =>
  keyboardWalk({ url: `${fixtures.baseUrl}/${page}`, maxSteps })

describe('clean fixture', () => {
  it('follows the focus order with roles and names', async () => {
    const r = await walk('clean.html')
    expect(r.steps.map((s) => [s.index, s.role, s.name])).toEqual([
      [1, 'link', 'Skip to main content'],
      [2, 'link', 'Home'],
      [3, 'link', 'About'],
      [4, 'textbox', 'Your name'],
      [5, 'button', 'Send'],
      [6, 'link', 'Read more'],
    ])
    expect(r.steps.map((s) => s.tag)).toEqual(['a', 'a', 'a', 'input', 'button', 'a'])
    expect(r.steps[3]?.selector).toBe('#name')
  })

  it('shows a visible focus indicator on every element', async () => {
    const r = await walk('clean.html')
    expect(r.steps.every((s) => s.hasVisibleFocus)).toBe(true)
    expect(r.summary.noVisibleFocus).toEqual([])
    expect(r.summary.noAccessibleName).toEqual([])
  })

  it('stops when Tab leaves the document, and reports the summary', async () => {
    const r = await walk('clean.html')
    expect(r.summary).toMatchObject({ stepCount: 6, distinctElements: 6, stoppedBecause: 'left-document', trap: null })
  })

  it('stops at maxSteps', async () => {
    const r = await walk('clean.html', 3)
    expect(r.summary.stoppedBecause).toBe('max-steps')
    expect(r.steps).toHaveLength(3)
    expect(r.steps.every((s) => s.hasVisibleFocus)).toBe(true)
  })

  it('returns the same steps in the same order when walked twice', async () => {
    expect(await walk('clean.html')).toEqual(await walk('clean.html'))
  })
})

describe('transition fixture', () => {
  it('measures a skip link that slides in at rest, not mid-transition', async () => {
    const r = await walk('transition.html')
    expect(r.steps.map((s) => [s.name, s.hasVisibleFocus])).toEqual([
      ['Skip to main content', true],
      ['Go to the clean page', true],
    ])
  })
})

describe('no-focus fixture', () => {
  it('reports hasVisibleFocus false for every element', async () => {
    const r = await walk('no-focus.html')
    expect(r.steps.map((s) => s.name)).toEqual(['First link', 'A button', 'Second link'])
    expect(r.steps.map((s) => s.hasVisibleFocus)).toEqual([false, false, false])
    expect(r.summary.noVisibleFocus.map((n) => n.index)).toEqual([1, 2, 3])
  })
})

describe('trap fixture', () => {
  it('detects the trap and lists the loop', async () => {
    const r = await walk('trap.html')
    expect(r.summary.stoppedBecause).toBe('trap')
    expect(r.summary.trap?.kind).toBe('cycle')
    expect(r.summary.trap?.elements.map((e) => e.name)).toEqual(['Two', 'Three'])
    expect(r.summary.trap?.escapedWith).toBeNull()
    expect(r.steps.map((s) => s.name)).toEqual(['One', 'Two', 'Three'])
  })
})

describe('maxSteps range', () => {
  it.each([0, 201, 1.5, -1, Number.NaN])('rejects %s and names the range', async (maxSteps) => {
    await expect(walk('clean.html', maxSteps)).rejects.toThrow(/"maxSteps".*integer from 1 to 200/)
  })
})

describe('decideFocusVisible', () => {
  const none = {
    outlineStyle: 'none', outlineWidth: '0px', outlineColor: 'rgb(0, 0, 0)', outlineOffset: '0px', boxShadow: 'none',
    borderTopColor: 'rgb(0, 0, 0)', borderRightColor: 'rgb(0, 0, 0)', borderBottomColor: 'rgb(0, 0, 0)', borderLeftColor: 'rgb(0, 0, 0)',
    borderTopWidth: '0px', borderRightWidth: '0px', borderBottomWidth: '0px', borderLeftWidth: '0px',
    backgroundColor: 'rgba(0, 0, 0, 0)', color: 'rgb(0, 0, 0)', textDecorationLine: 'none', textDecorationColor: 'rgb(0, 0, 0)',
  }
  it('is false when nothing changes', () => {
    expect(decideFocusVisible(none, none)).toBe(false)
  })
  it('is true for an outline, a shadow, a border, a background, a text colour or an underline', () => {
    expect(decideFocusVisible({ ...none, outlineStyle: 'solid', outlineWidth: '3px' }, none)).toBe(true)
    expect(decideFocusVisible({ ...none, boxShadow: 'rgb(0, 0, 255) 0px 0px 0px 3px' }, none)).toBe(true)
    expect(decideFocusVisible({ ...none, borderTopWidth: '2px', borderTopColor: 'rgb(0, 0, 255)' }, none)).toBe(true)
    expect(decideFocusVisible({ ...none, backgroundColor: 'rgb(255, 255, 0)' }, none)).toBe(true)
    expect(decideFocusVisible({ ...none, color: 'rgb(255, 0, 0)' }, none)).toBe(true)
    expect(decideFocusVisible({ ...none, textDecorationLine: 'underline' }, none)).toBe(true)
  })
  it('ignores an outline of zero width or a transparent colour', () => {
    expect(decideFocusVisible({ ...none, outlineStyle: 'solid', outlineWidth: '0px' }, none)).toBe(false)
    expect(decideFocusVisible({ ...none, outlineStyle: 'solid', outlineWidth: '3px', outlineColor: 'rgba(0, 0, 0, 0)' }, none)).toBe(false)
  })
  it('judges an element that never lost focus by its drawn outline or shadow', () => {
    expect(decideFocusVisible({ ...none, outlineStyle: 'solid', outlineWidth: '3px' }, null)).toBe(true)
    expect(decideFocusVisible(none, null)).toBe(false)
  })
})
