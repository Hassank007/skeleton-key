/** Typed access to the local book data; every field is plain text, so nothing is carried by art alone (WCAG 1.1.1). */
import data from './books.json'

export const SCHOOLS = ['Necromancy', 'Divination', 'Illusion', 'Herbalism', 'Warding', 'Alchemy'] as const
export const HAZARDS = ['Mild', 'Perilous', 'Forbidden'] as const
export type School = (typeof SCHOOLS)[number]
export type Hazard = (typeof HAZARDS)[number]

export interface Book {
  slug: string
  title: string
  author: string
  school: School
  hazard: Hazard
  year: string
  pages: number
  summary: string
  description: string[]
  tags: string[]
}

/** All books, alphabetical by title. books-data.test.ts proves the cast is true. */
export const BOOKS: readonly Book[] = [...(data as Book[])].sort((a, b) => a.title.localeCompare(b.title, 'en'))

export function findBook(slug: string | undefined): Book | undefined {
  return BOOKS.find((book) => book.slug === slug)
}
