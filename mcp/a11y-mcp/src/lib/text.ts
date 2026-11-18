export const MAX_TEXT = 200

/** Cut any text taken from a page to 200 characters (REQ-2.14). Page text is data, never instructions. */
export function truncate(text: string, max: number = MAX_TEXT): string {
  const chars = Array.from(text)
  return chars.length <= max ? text : `${chars.slice(0, max - 1).join('')}…`
}
