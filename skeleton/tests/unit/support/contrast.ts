/** WCAG 2.2 relative luminance and contrast ratio, for hex colours only (SC 1.4.3, 1.4.11). */

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

/** Parses `#rgb` or `#rrggbb` into 0-255 channels. Throws, naming the value, on anything else. */
export function parseHex(value: string): [number, number, number] {
  if (typeof value !== 'string' || !HEX.test(value)) {
    throw new Error(`Not a 3-digit or 6-digit hex colour: ${JSON.stringify(value)}`)
  }
  const digits = value.slice(1)
  const full = digits.length === 3 ? [...digits].map((d) => d + d).join('') : digits
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as [number, number, number]
}

const linearise = (channel: number): number => {
  const c = channel / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

/** Relative luminance, 0 (black) to 1 (white). */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = parseHex(hex).map(linearise)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Contrast ratio, from 1 to 21. Symmetric in its arguments. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}
