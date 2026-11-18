import { describe, expect, it } from 'vitest'
import { hueOf } from './support/hue'

describe('hueOf', () => {
  it('returns the primary hues', () => {
    expect(hueOf('#ff0000')).toBe(0)
    expect(hueOf('#00ff00')).toBe(120)
    expect(hueOf('#0000ff')).toBe(240)
  })

  it('returns 0 for greys, black and white', () => {
    expect(hueOf('#808080')).toBe(0)
    expect(hueOf('#000000')).toBe(0)
    expect(hueOf('#ffffff')).toBe(0)
  })

  it('handles secondary colours and short hex', () => {
    expect(hueOf('#ffff00')).toBe(60)
    expect(hueOf('#00ffff')).toBe(180)
    expect(hueOf('#f0f')).toBe(300)
  })

  it('stays in 0 to 360 for a magenta-red', () => {
    const h = hueOf('#ff0080')
    expect(h).toBeGreaterThanOrEqual(0)
    expect(h).toBeLessThan(360)
    expect(h).toBeCloseTo(330, 0)
  })

  it('rejects a value that is not hex', () => {
    expect(() => hueOf('red')).toThrow()
  })
})
