import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

export interface BookRecord {
  slug: string
  title: string
  author: string
  school: string
  hazard: string
  summary: string
  tags: string[]
}

/** The real data file, read from disk (the e2e project is not bundled by Vite). Sorted like the app: alphabetical by title. */
export const BOOKS: BookRecord[] = (
  JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src', 'data', 'books.json'), 'utf8')) as BookRecord[]
).sort((a, b) => a.title.localeCompare(b.title, 'en'))

const normalise = (text: string): string => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

/** How many books match the search words (AND over title, author, summary and tags). Computed, never hard-coded. */
export function countMatching(q: string): number {
  const words = normalise(q).split(/\s+/).filter(Boolean)
  return BOOKS.filter((b) => {
    const hay = normalise([b.title, b.author, b.summary, ...b.tags].join(' '))
    return words.every((w) => hay.includes(w))
  }).length
}

export const countText = (n: number): string => `${n} ${n === 1 ? 'spellbook' : 'spellbooks'}`
export const messageText = (n: number): string =>
  n === 0 ? 'No spellbooks found. Try a shorter search or clear some filters.' : n === 1 ? '1 spellbook found' : `${n} spellbooks found`
