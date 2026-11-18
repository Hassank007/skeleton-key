import { openSession, readLandmarksAndHeadings } from '../lib/axTree.js'
import { withPage } from '../lib/browser.js'
import { truncate } from '../lib/text.js'

export interface Landmark {
  role: string
  name: string
  selector: string
}

export interface Heading {
  level: number
  text: string
  selector: string
}

export interface OutlineIssue {
  id: string
  criterion: string
  message: string
  selector?: string
}

export interface OutlineFacts {
  title: string
  lang: string
  landmarks: Landmark[]
  headings: Heading[]
}

export interface PageOutlineResult extends OutlineFacts {
  url: string
  finalUrl: string
  issues: OutlineIssue[]
}

/** Pure check of the page's structure. Issues come in a fixed order (REQ-6.6, 6.7). */
export function findOutlineIssues(facts: OutlineFacts): OutlineIssue[] {
  const issues: OutlineIssue[] = []
  const add = (id: string, criterion: string, message: string, selector?: string): void => {
    issues.push(selector === undefined || selector === '' ? { id, criterion, message } : { id, criterion, message, selector })
  }

  if (facts.title.trim() === '') {
    add('missing-title', '2.4.2', 'The page has no title, or an empty title. Add a unique, descriptive <title>.')
  }
  if (facts.lang.trim() === '') {
    add('missing-lang', '3.1.1', 'The root element has no lang attribute, or an empty one. Add lang="en" (or the page language).')
  }

  const mains = facts.landmarks.filter((l) => l.role === 'main')
  if (mains.length === 0) {
    add('no-main', '1.3.1', 'The page has no main landmark. Wrap the main content in <main>.')
  } else if (mains.length > 1) {
    add('multiple-main', '1.3.1', `The page has ${mains.length} main landmarks. Use exactly one.`, mains[1]?.selector)
  }

  const navs = facts.landmarks.filter((l) => l.role === 'navigation')
  if (navs.length > 1) {
    const seen = new Set<string>()
    const duplicate = navs.find((n) => {
      const name = n.name.trim().toLowerCase()
      if (seen.has(name)) return true
      seen.add(name)
      return false
    })
    if (duplicate) {
      add(
        'duplicate-nav-name',
        '1.3.1',
        'Two or more navigation landmarks have no distinct name. Give each <nav> its own aria-label.',
        duplicate.selector,
      )
    }
  }

  const h1s = facts.headings.filter((h) => h.level === 1)
  if (h1s.length === 0) {
    add('no-h1', '1.3.1', 'The page has no level 1 heading. Add one <h1> that names the page.')
  } else if (h1s.length > 1) {
    add('multiple-h1', '1.3.1', `The page has ${h1s.length} level 1 headings. Use exactly one.`, h1s[1]?.selector)
  }

  const first = facts.headings[0]
  if (first && first.level !== 1) {
    add('first-heading-not-h1', '1.3.1', `The first heading is level ${first.level}, not level 1.`, first.selector)
  }

  facts.headings.forEach((h, i) => {
    const previous = facts.headings[i - 1]
    if (previous && h.level > previous.level + 1) {
      add(
        'skipped-heading-level',
        '1.3.1',
        `A level ${h.level} heading follows a level ${previous.level} heading. Do not skip heading levels.`,
        h.selector,
      )
    }
  })

  for (const h of facts.headings) {
    if (h.text.trim() === '') {
      add('empty-heading', '2.4.6', `A level ${h.level} heading is empty. Give it text or remove it.`, h.selector)
    }
  }
  return issues
}

/** Read title, language, landmarks and headings from a running page. */
export async function pageOutline(input: { url: string }): Promise<PageOutlineResult> {
  return withPage(input.url, async (page, info) => {
    const session = await openSession(page)
    const { landmarks, headings } = await readLandmarksAndHeadings(session)
    const title = truncate(await page.title())
    const lang = truncate(
      await page.evaluate<string>("document.documentElement.getAttribute('lang') ?? ''"),
    )
    const facts: OutlineFacts = {
      title,
      lang,
      landmarks: landmarks.map((l) => ({ role: l.role, name: l.name, selector: l.selector })),
      headings: headings.map((h) => ({ level: h.level, text: h.name, selector: h.selector })),
    }
    return { url: info.url, finalUrl: info.finalUrl, ...facts, issues: findOutlineIssues(facts) }
  })
}
