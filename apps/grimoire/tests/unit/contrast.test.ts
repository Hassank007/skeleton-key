import { describe, expect, it } from 'vitest'
import { contrastRatio, parseHex, relativeLuminance } from './support/contrast'

describe('contrast utility', () => {
  it('black on white is 21:1', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 10)
  })

  it('a colour on itself is 1:1', () => {
    expect(contrastRatio('#6b21a8', '#6b21a8')).toBe(1)
  })

  it('#767676 on white passes 4.5:1 and #777777 does not', () => {
    expect(contrastRatio('#767676', '#ffffff')).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio('#777777', '#ffffff')).toBeLessThan(4.5)
  })

  it('has the published luminance for pure red, green and blue', () => {
    expect(relativeLuminance('#ff0000')).toBeCloseTo(0.2126, 10)
    expect(relativeLuminance('#00ff00')).toBeCloseTo(0.7152, 10)
    expect(relativeLuminance('#0000ff')).toBeCloseTo(0.0722, 10)
  })

  it('treats 3-digit and 6-digit forms of a colour the same', () => {
    expect(contrastRatio('#fff', '#369')).toBe(contrastRatio('#ffffff', '#336699'))
    expect(parseHex('#abc')).toEqual([0xaa, 0xbb, 0xcc])
  })

  it('does not depend on argument order', () => {
    expect(contrastRatio('#1a0033', '#f5f0ff')).toBe(contrastRatio('#f5f0ff', '#1a0033'))
  })

  it('throws, naming the value, on non-hex input', () => {
    for (const bad of ['rgb(0,0,0)', 'red', 'var(--x)', '#12345', '#11223344', '', '123456']) {
      expect(() => parseHex(bad)).toThrow(JSON.stringify(bad))
      expect(() => contrastRatio(bad, '#ffffff')).toThrow()
    }
  })

  // Threshold note (WCAG 2.2 uses 0.04045; WCAG 2.0 printed 0.03928). The smallest 8-bit channel
  // value above either threshold is 11/255 = 0.0431, and the largest at or below both is
  // 10/255 = 0.0392, so every 8-bit channel falls on the same side of both thresholds.
  it('gives identical results for the 0.04045 and 0.03928 thresholds on every 8-bit channel', () => {
    for (let v = 0; v <= 255; v++) {
      const c = v / 255
      expect(c <= 0.04045).toBe(c <= 0.03928)
    }
  })

  it('uses the linear branch for dark channels (10/255) and the power branch above (11/255)', () => {
    expect(relativeLuminance('#0a0a0a')).toBeCloseTo(10 / 255 / 12.92, 10)
    expect(relativeLuminance('#0b0b0b')).toBeCloseTo(((11 / 255 + 0.055) / 1.055) ** 2.4, 10)
  })
})
