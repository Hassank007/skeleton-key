import { ToolError } from './errors.js'

export interface Rgba {
  r: number
  g: number
  b: number
  /** 0 to 1 */
  a: number
}

export const ACCEPTED_FORMATS = '#rgb, #rgba, #rrggbb, #rrggbbaa, rgb(r, g, b), rgba(r, g, b, a)'

const HEX = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/
const NUM = String.raw`(\d+(?:\.\d+)?|\.\d+)`
const FN = new RegExp(
  String.raw`^rgba?\(\s*${NUM}(%?)\s*,\s*${NUM}(%?)\s*,\s*${NUM}(%?)\s*(?:,\s*${NUM}(%?)\s*)?\)$`,
)

function fail(parameter: string, value: string): never {
  throw new ToolError(
    `Cannot read the colour in "${parameter}": "${value}". Accepted formats: ${ACCEPTED_FORMATS}.`,
  )
}

const channel = (value: string, percent: string): number => {
  const n = Number(value)
  return percent === '%' ? (n / 100) * 255 : n
}

/** Parse a CSS colour (hex, rgb(), rgba()) and throw a ToolError naming the parameter (REQ-5.2, 5.3). */
export function parseColor(parameter: string, input: string): Rgba {
  const text = input.trim().toLowerCase()
  const hex = HEX.exec(text)
  if (hex?.[1] !== undefined) {
    let digits = hex[1]
    if (digits.length <= 4) digits = Array.from(digits, (c) => c + c).join('')
    const byte = (i: number): number => parseInt(digits.slice(i, i + 2), 16)
    return { r: byte(0), g: byte(2), b: byte(4), a: digits.length === 8 ? byte(6) / 255 : 1 }
  }
  const fn = FN.exec(text)
  if (fn) {
    const [, r, rp, g, gp, b, bp, a, ap] = fn
    if (r === undefined || g === undefined || b === undefined) return fail(parameter, input)
    const rgb = [channel(r, rp ?? ''), channel(g, gp ?? ''), channel(b, bp ?? '')]
    if (rgb.some((c) => c > 255)) return fail(parameter, input)
    let alpha = 1
    if (a !== undefined) {
      alpha = ap === '%' ? Number(a) / 100 : Number(a)
      if (alpha > 1) return fail(parameter, input)
    }
    return { r: rgb[0] ?? 0, g: rgb[1] ?? 0, b: rgb[2] ?? 0, a: alpha }
  }
  return fail(parameter, input)
}

/** Blend a translucent foreground over an opaque background (REQ-5.5). */
export function blend(fg: Rgba, bg: Rgba): Rgba {
  // Rounded to whole channels so the reported hex colour reproduces the reported ratio.
  const mix = (f: number, b: number): number => Math.round(fg.a * f + (1 - fg.a) * b)
  return { r: mix(fg.r, bg.r), g: mix(fg.g, bg.g), b: mix(fg.b, bg.b), a: 1 }
}

export function toHex(c: Rgba): string {
  const h = (n: number): string => Math.round(n).toString(16).padStart(2, '0')
  return `#${h(c.r)}${h(c.g)}${h(c.b)}`
}
