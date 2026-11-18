import type { StyleSnapshot } from './axTree.js'

const isTransparent = (color: string | undefined): boolean =>
  color === undefined || color === 'transparent' || /^rgba\(\s*\d+,\s*\d+,\s*\d+,\s*0\s*\)$/.test(color)

const px = (value: string | undefined): number => Number.parseFloat(value ?? '0') || 0

const outlineShown = (s: StyleSnapshot): boolean =>
  s['outlineStyle'] !== undefined &&
  s['outlineStyle'] !== 'none' &&
  s['outlineStyle'] !== 'hidden' &&
  px(s['outlineWidth']) > 0 &&
  !isTransparent(s['outlineColor'])

const differs = (a: StyleSnapshot, b: StyleSnapshot, props: string[]): boolean =>
  props.some((p) => a[p] !== b[p])

const BORDER_COLORS = ['borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor']
const BORDER_WIDTHS = ['borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth']

/**
 * Decide whether a focused element looks different from the same element without focus (REQ-4.6).
 * It compares computed styles only: outline, box-shadow, border, background, text colour and decoration.
 * It cannot see an indicator drawn on another element, and it does not measure the indicator's contrast.
 *
 * `unfocused` is null when the element never lost focus (a self-loop trap). Then there is nothing to
 * compare with, so only an outline or box-shadow that is clearly drawn counts.
 */
export function decideFocusVisible(focused: StyleSnapshot, unfocused: StyleSnapshot | null): boolean {
  if (unfocused === null) {
    return outlineShown(focused) || (focused['boxShadow'] ?? 'none') !== 'none'
  }
  if (outlineShown(focused) && differs(focused, unfocused, ['outlineStyle', 'outlineWidth', 'outlineColor', 'outlineOffset'])) {
    return true
  }
  const shadow = focused['boxShadow'] ?? 'none'
  if (shadow !== 'none' && shadow !== unfocused['boxShadow']) return true
  if (differs(focused, unfocused, [...BORDER_COLORS, ...BORDER_WIDTHS])) {
    const drawn = BORDER_WIDTHS.some((w, i) => px(focused[w]) > 0 && !isTransparent(focused[BORDER_COLORS[i] ?? '']))
    if (drawn) return true
  }
  for (const p of ['backgroundColor', 'color']) {
    if (focused[p] !== unfocused[p] && !(isTransparent(focused[p]) && isTransparent(unfocused[p]))) return true
  }
  return focused['textDecorationLine'] !== unfocused['textDecorationLine']
}
