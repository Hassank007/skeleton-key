import { blend, parseColor, toHex } from '../lib/color.js'
import { contrastRatio, floorTwo, isLargeText, meets } from '../lib/contrast.js'
import { ToolError } from '../lib/errors.js'

export interface CheckContrastInput {
  foreground: string
  background: string
  fontSizePx: number
  bold: boolean
}

interface Threshold {
  criterion: string
  required: number
  pass: boolean
}

export interface CheckContrastResult {
  foreground: { input: string; hex: string; blendedOverBackground: boolean }
  background: { input: string; hex: string }
  ratio: number
  textSize: 'normal' | 'large'
  applicable: 'aaNormalText' | 'aaLargeText'
  results: { aaNormalText: Threshold; aaLargeText: Threshold; nonText: Threshold }
}

/** Check a colour pair against the WCAG 1.4.3 and 1.4.11 thresholds. Needs no browser. */
export function checkContrast(input: CheckContrastInput): CheckContrastResult {
  if (!Number.isFinite(input.fontSizePx) || input.fontSizePx <= 0) {
    throw new ToolError(
      `Invalid "fontSizePx": ${String(input.fontSizePx)}. It must be a finite number greater than 0.`,
    )
  }
  const fg = parseColor('foreground', input.foreground)
  const bg = parseColor('background', input.background)
  if (bg.a < 1) {
    throw new ToolError(
      `The "background" colour "${input.background}" is translucent. The background must be opaque, because its colour depends on what is behind it.`,
    )
  }
  const blended = fg.a < 1
  const effective = blended ? blend(fg, bg) : fg
  const ratio = contrastRatio(effective, bg)
  const large = isLargeText(input.fontSizePx, input.bold)
  const t = (criterion: string, required: number): Threshold => ({
    criterion,
    required,
    pass: meets(ratio, required),
  })
  return {
    foreground: { input: input.foreground, hex: toHex(effective), blendedOverBackground: blended },
    background: { input: input.background, hex: toHex(bg) },
    ratio: floorTwo(ratio),
    textSize: large ? 'large' : 'normal',
    applicable: large ? 'aaLargeText' : 'aaNormalText',
    results: {
      aaNormalText: t('1.4.3', 4.5),
      aaLargeText: t('1.4.3', 3),
      nonText: t('1.4.11', 3),
    },
  }
}
