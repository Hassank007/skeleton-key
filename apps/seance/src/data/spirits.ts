/** Typed access to the four bookable spirits. All content is text, so no information depends on an image (WCAG 1.1.1). */
import spiritsJson from './spirits.json'

export interface Spirit {
  id: string
  name: string
  blurb: string
  speciality: string
}

export const SPIRITS: readonly Spirit[] = spiritsJson

/** Returns the spirit with this id, or undefined. */
export function findSpirit(id: string): Spirit | undefined {
  return SPIRITS.find((s) => s.id === id)
}
