import AxeBuilder from '@axe-core/playwright'
import type { Result } from 'axe-core'
import { compareCriteria, criterionFromTag, CRITERIA, tagsFor, type WcagLevel } from '../lib/axeTags.js'
import { withPage } from '../lib/browser.js'
import { truncate } from '../lib/text.js'

export interface AuditInput {
  url: string
  wcagLevel: WcagLevel
}

export interface AuditNode {
  selector: string
  html: string
  failureSummary: string
}

export interface AuditViolation {
  ruleId: string
  impact: string
  help: string
  helpUrl: string
  nodes: AuditNode[]
}

export interface AuditCriterion {
  criterion: string
  name: string
  level: string
  violations: AuditViolation[]
}

export interface AuditResult {
  url: string
  finalUrl: string
  wcagLevel: WcagLevel
  tags: string[]
  axeVersion: string
  counts: { violations: number; nodes: number; incomplete: number }
  criteria: AuditCriterion[]
  incomplete: { ruleId: string; nodeCount: number }[]
  note: string
}

const IMPACT_RANK: Record<string, number> = { critical: 0, serious: 1, moderate: 2, minor: 3 }
const rank = (impact: string): number => IMPACT_RANK[impact] ?? 4
const UNMAPPED = 'unmapped'

/** Flatten axe's target (strings, or arrays for shadow roots and frames) to one path (REQ-3.10). */
function selectorOf(target: unknown[]): string {
  const parts: string[] = []
  const walk = (value: unknown): void => {
    if (Array.isArray(value)) value.forEach(walk)
    else if (typeof value === 'string') parts.push(value)
  }
  walk(target)
  return truncate(parts.join(' >> '))
}

function toViolation(v: Result): AuditViolation {
  return {
    ruleId: v.id,
    impact: v.impact ?? 'unknown',
    help: truncate(v.help),
    helpUrl: v.helpUrl,
    nodes: v.nodes.map((n) => ({
      selector: selectorOf(n.target),
      html: truncate(n.html),
      failureSummary: truncate(n.failureSummary ?? ''),
    })),
  }
}

/** Run axe-core against a running page and group the violations by WCAG criterion. */
export async function auditPage(input: AuditInput): Promise<AuditResult> {
  const tags = tagsFor(input.wcagLevel)
  return withPage(input.url, async (page, info) => {
    const results = await new AxeBuilder({ page }).withTags(tags).analyze()

    const groups = new Map<string, AuditViolation[]>()
    const uniqueNodes = new Set<string>()
    for (const raw of results.violations) {
      const violation = toViolation(raw)
      const criteria = [...new Set(raw.tags.map(criterionFromTag).filter((c): c is string => c !== null))]
      for (const node of violation.nodes) uniqueNodes.add(`${violation.ruleId}\u0000${node.selector}`)
      for (const criterion of criteria.length > 0 ? criteria : [UNMAPPED]) {
        const list = groups.get(criterion) ?? []
        list.push(violation)
        groups.set(criterion, list)
      }
    }

    const criteria: AuditCriterion[] = [...groups.entries()]
      .sort(([a], [b]) =>
        a === UNMAPPED ? 1 : b === UNMAPPED ? -1 : compareCriteria(a, b),
      )
      .map(([criterion, violations]) => ({
        criterion,
        name: CRITERIA[criterion]?.name ?? 'Not mapped to a WCAG criterion',
        level: CRITERIA[criterion]?.level ?? 'unknown',
        violations: violations.sort(
          (x, y) => rank(x.impact) - rank(y.impact) || x.ruleId.localeCompare(y.ruleId),
        ),
      }))

    const incomplete = results.incomplete
      .map((i) => ({ ruleId: i.id, nodeCount: i.nodes.length }))
      .sort((x, y) => x.ruleId.localeCompare(y.ruleId))

    return {
      url: info.url,
      finalUrl: info.finalUrl,
      wcagLevel: input.wcagLevel,
      tags,
      axeVersion: results.testEngine.version,
      counts: {
        violations: results.violations.length,
        nodes: uniqueNodes.size,
        incomplete: incomplete.length,
      },
      criteria,
      incomplete,
      note: 'Automated checks cannot prove conformance. Items under incomplete need manual review.',
    }
  })
}
