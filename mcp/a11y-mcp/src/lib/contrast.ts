import type { Rgba } from './color.js'

const linear = (channel: number): number => {
  const s = channel / 255
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

/** Relative luminance as WCAG 2.2 defines it (REQ-5.6). */
export function luminance(c: Rgba): number {
  return 0.2126 * linear(c.r) + 0.7152 * linear(c.g) + 0.0722 * linear(c.b)
}

/** Contrast ratio, from 1 to 21. The lighter colour is always the numerator. */
export function contrastRatio(a: Rgba, b: Rgba): number {
  const la = luminance(a)
  const lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/** Large text starts at 24 px, or at 14 pt (18.666 px) when bold (REQ-5.9). */
export const LARGE_PX = 24
export const LARGE_BOLD_PX = (14 * 96) / 72

export const isLargeText = (px: number, bold: boolean): boolean =>
  px >= LARGE_PX || (bold && px >= LARGE_BOLD_PX)

/**
 * Pass decision on the unrounded ratio. The 1e-9 epsilon only absorbs floating-point error for a
 * ratio that is mathematically exactly on the threshold (for example 4.5).
 */
export const meets = (ratio: number, required: number): boolean => ratio + 1e-9 >= required

/** Round down to two places so 4.499 is never shown as 4.5 (REQ-5.7). */
export const floorTwo = (ratio: number): number => Math.floor(ratio * 100 + 1e-9) / 100
