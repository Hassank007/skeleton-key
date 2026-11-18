import { describe, expect, it } from 'vitest'
import { hueDistance, hueOf } from './support/hue'

describe('hueOf', () => {
  it('returns the primary hues', () => {
    expect(hueOf('#ff0000')).toBe(0)
    expect(hueOf('#00ff00')).toBe(120)
    expect(hueOf('#0000ff')).toBe(240)
  })

  it('returns the secondary hues', () => {
    expect(hueOf('#ffff00')).toBe(60)
    expect(hueOf('#00ffff')).toBe(180)
    expect(hueOf('#ff00ff')).toBe(300)
  })

  it('returns 0 for greys, black and white', () => {
    expect(hueOf('#808080')).toBe(0)
    expect(hueOf('#000000')).toBe(0)
    expect(hueOf('#ffffff')).toBe(0)
  })

  it('is case-insensitive', () => {
    expect(hueOf('#00FF00')).toBe(120)
  })

  it('rejects anything but #rrggbb', () => {
    expect(() => hueOf('red')).toThrow()
    expect(() => hueOf('#fff')).toThrow()
  })
})

describe('hueDistance', () => {
  it('takes the short way round the wheel', () => {
    expect(hueDistance(10, 350)).toBe(20)
    expect(hueDistance(0, 180)).toBe(180)
    expect(hueDistance(90, 90)).toBe(0)
    expect(hueDistance(30, 200)).toBe(170)
  })
})
