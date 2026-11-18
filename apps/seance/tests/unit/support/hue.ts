/** Hue helpers for the theme identity test (REQ-13.3). Pure functions, no colour values stored here. */

/** Hue of a `#rrggbb` colour in degrees, 0 to 359. Greys (no saturation) return 0. */
export function hueOf(hex: string): number {
  const match = /^#([0-9a-f]{6})$/i.exec(hex)
  if (!match) throw new Error(`hueOf expects a #rrggbb colour, got ${JSON.stringify(hex)}`)
  const n = parseInt(match[1], 16)
  const r = ((n >> 16) & 255) / 255
  const g = ((n >> 8) & 255) / 255
  const b = (n & 255) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min
  if (delta === 0) return 0
  let h: number
  if (max === r) h = ((g - b) / delta) % 6
  else if (max === g) h = (b - r) / delta + 2
  else h = (r - g) / delta + 4
  const degrees = Math.round(h * 60)
  return (degrees + 360) % 360
}

/** Shortest distance between two hues on the colour wheel, 0 to 180 degrees. */
export function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}
