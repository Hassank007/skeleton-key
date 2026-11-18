import { describe, expect, it } from 'vitest'
import { checkContrast, type CheckContrastInput } from '../src/tools/checkContrast.js'
import { ToolError } from '../src/lib/errors.js'
import { floorTwo, meets } from '../src/lib/contrast.js'
import { parseColor } from '../src/lib/color.js'

const run = (over: Partial<CheckContrastInput> = {}): ReturnType<typeof checkContrast> =>
  checkContrast({ foreground: '#000', background: '#fff', fontSizePx: 16, bold: false, ...over })

describe('ratios', () => {
  it('gives 21 for black on white', () => {
    expect(run().ratio).toBe(21)
  })
  it('gives 1 for identical colours', () => {
    expect(run({ foreground: '#336699', background: '#336699' }).ratio).toBe(1)
  })
  it('passes a pair just over 4.5', () => {
    const r = run({ foreground: '#767676' })
    expect(r.ratio).toBe(4.54)
    expect(r.results.aaNormalText.pass).toBe(true)
  })
  it('fails a pair just under 4.5 and shows it rounded down', () => {
    const r = run({ foreground: '#777777' })
    expect(r.ratio).toBe(4.47)
    expect(r.results.aaNormalText.pass).toBe(false)
    expect(r.results.aaLargeText.pass).toBe(true)
  })
  it('decides on the unrounded ratio and never shows 4.499 as 4.5', () => {
    expect(floorTwo(4.499)).toBe(4.49)
    expect(meets(4.499, 4.5)).toBe(false)
    expect(meets(4.5, 4.5)).toBe(true)
    expect(meets(2.9999, 3)).toBe(false)
    expect(floorTwo(4.5)).toBe(4.5)
  })
})

describe('text size classification', () => {
  it.each([
    [23.99, false, 'normal'],
    [24, false, 'large'],
    [18.66, true, 'normal'],
    [18.67, true, 'large'],
    [18.67, false, 'normal'],
  ] as const)('%s px, bold %s is %s', (fontSizePx, bold, size) => {
    const r = run({ fontSizePx, bold })
    expect(r.textSize).toBe(size)
    expect(r.applicable).toBe(size === 'large' ? 'aaLargeText' : 'aaNormalText')
  })
  it('reports the non-text threshold of 3:1 for 1.4.11', () => {
    const r = run({ foreground: '#949494' })
    expect(r.results.nonText).toEqual({ criterion: '1.4.11', required: 3, pass: true })
  })
})

describe('colour formats', () => {
  it.each([
    ['#abc', 170, 187, 204, 1],
    ['#ABCD', 170, 187, 204, 221 / 255],
    ['#aabbcc', 170, 187, 204, 1],
    ['#AABBCC80', 170, 187, 204, 128 / 255],
    ['rgb(170, 187, 204)', 170, 187, 204, 1],
    ['  RGBA(170,187,204,0.5) ', 170, 187, 204, 0.5],
    ['rgb(100%, 0%, 0%)', 255, 0, 0, 1],
    ['rgba(0 0 0 / 1)', NaN, 0, 0, 0],
  ])('parses %s', (text, r, g, b, a) => {
    if (Number.isNaN(r)) {
      expect(() => parseColor('foreground', text)).toThrow(ToolError)
      return
    }
    const c = parseColor('foreground', text)
    expect([c.r, c.g, c.b]).toEqual([r, g, b])
    expect(c.a).toBeCloseTo(a, 6)
  })
})

describe('alpha', () => {
  it('blends a translucent foreground over the background and reports the result', () => {
    const r = run({ foreground: 'rgba(0, 0, 0, 0.5)' })
    expect(r.foreground.blendedOverBackground).toBe(true)
    expect(r.foreground.hex).toBe('#808080')
    expect(r.ratio).toBe(3.94)
  })
  it('does not blend an opaque foreground', () => {
    expect(run().foreground.blendedOverBackground).toBe(false)
  })
})

describe('errors', () => {
  it('names the parameter and value of an unreadable colour and lists formats', () => {
    expect(() => run({ foreground: 'banana' })).toThrow(/"foreground": "banana".*#rrggbb/)
    expect(() => run({ background: 'rgb(300,0,0)' })).toThrow(/"background"/)
    expect(() => run({ foreground: '#12' })).toThrow(ToolError)
  })
  it.each([0, -4, Infinity, NaN])('rejects fontSizePx %s', (fontSizePx) => {
    expect(() => run({ fontSizePx })).toThrow(/fontSizePx/)
  })
  it('rejects a translucent background', () => {
    expect(() => run({ background: 'rgba(255,255,255,0.5)' })).toThrow(/background must be opaque/)
    expect(() => run({ background: '#ffffff80' })).toThrow(/opaque/)
  })
  it('needs no browser and is fast', () => {
    const start = performance.now()
    run()
    expect(performance.now() - start).toBeLessThan(100)
  })
})
