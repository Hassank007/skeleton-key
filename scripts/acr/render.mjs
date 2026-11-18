// Turn decided rows into the Markdown report. Every value copied from evidence goes through cell().
import { CRITERIA, LEVELS } from './criteria.mjs';
import { decide } from './decide.mjs';

export const GENERATOR_VERSION = '1.0.0';
export const GENERATOR_NAME = 'Skeleton Key ACR generator (scripts/acr.mjs)';
export const REPORT_TITLE = 'Accessibility Conformance Report: WCAG Edition (VPAT 2.5 style)';
export const MAX_CELL = 200;

export const DISCLAIMER =
  'This report is generated from automated test results and a static code review. It is not a legal certification, an audit by an accredited body, or a statement of compliance with any law. Automated tools find only a part of the accessibility problems that exist; criteria marked Not Evaluated need testing by a person, including with assistive technology.';

/**
 * Make a copied value safe for a Markdown table cell: strip control characters, cut to 200 characters,
 * escape `|`, `<`, `>`, replace backticks, and break `](` so a link cannot be formed.
 */
export function cell(value) {
  let s = String(value ?? '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\r\n\t]+/g, ' ')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/g, '')
    .trim();
  if (s.length > MAX_CELL) s = `${s.slice(0, MAX_CELL)}...`;
  return s
    .replace(/\|/g, '\\|')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/`/g, "'")
    .replace(/\]\(/g, '] (');
}

const sentence = (s) => (/[.!?]$/.test(s) ? s : `${s}.`);
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

function byCite(a, b) {
  return (
    a.criterion.localeCompare(b.criterion) ||
    a.source.localeCompare(b.source) ||
    a.label.localeCompare(b.label) ||
    (a.page ?? '').localeCompare(b.page ?? '')
  );
}

/** Cite tagged tests as `source "title"`, and axe rules as `axe rule x passed on n of m scans`. */
function citePassing(items, limit = 3) {
  const cites = [];
  const tests = items.filter((i) => i.kind === 'test').sort(byCite);
  for (const t of tests) cites.push(`${cell(t.source)} "${cell(t.label)}"`);
  cites.push(...axePassCites(items));
  return cutList(cites, limit);
}

function axePassCites(items) {
  const out = [];
  const rules = new Map();
  for (const i of items) {
    if (i.kind !== 'axe') continue;
    const r = rules.get(i.label) ?? { passed: 0, total: 0 };
    r.total++;
    if (i.result === 'pass') r.passed++;
    rules.set(i.label, r);
  }
  for (const id of [...rules.keys()].sort()) {
    const r = rules.get(id);
    if (r.passed > 0) out.push(`axe rule ${cell(id)} passed on ${r.passed} of ${r.total} scans`);
  }
  return out;
}

function cutList(list, limit) {
  if (limit === null || list.length <= limit) return list.join('; ');
  return `${list.slice(0, limit).join('; ')}; and ${list.length - limit} more`;
}

function citeFailing(items) {
  return items
    .slice()
    .sort(byCite)
    .map((i) =>
      i.kind === 'axe'
        ? `axe rule ${cell(i.label)} failed on ${cell(i.page)}${i.nodes !== undefined ? ` (${plural(i.nodes, 'node')})` : ''}`
        : `${cell(i.source)} "${cell(i.label)}"`,
    )
    .join('; ');
}

function citeInconclusive(items) {
  return items
    .slice()
    .sort(byCite)
    .map((i) =>
      i.kind === 'axe'
        ? `axe rule ${cell(i.label)} was incomplete on ${cell(i.page)}${i.nodes !== undefined ? ` (${plural(i.nodes, 'node')})` : ''}`
        : `${cell(i.source)} "${cell(i.label)}" (flaky)`,
    )
    .join('; ');
}

/**
 * Decide every criterion.
 * @returns {{ rows: object[], warnings: string[] }}
 */
export function buildRows(evidenceItems, findings, overrides) {
  const rows = [];
  const warnings = [];
  for (const criterion of CRITERIA) {
    const items = evidenceItems.filter((i) => i.criterion === criterion.id);
    const fs = findings.filter((f) => f.criteria.includes(criterion.id));
    const override = overrides.get(criterion.id) ?? null;
    const decision = decide(criterion, items, fs, override);
    if (decision.overrideIgnored) {
      warnings.push(
        `Ignored the Not Applicable override for ${criterion.id}: it has failing evidence or an open finding.`,
      );
    }
    const qualifies = (i) => i.result === 'pass' && (i.kind === 'test' || criterion.tier === 'axe');
    rows.push({
      criterion,
      decision,
      override,
      qualifying: items.filter(qualifies),
      weakPasses: items.filter((i) => i.result === 'pass' && !qualifies(i)),
      failing: items.filter((i) => i.result === 'fail'),
      inconclusive: items.filter((i) => i.result === 'inconclusive'),
      openFindings: fs.filter((f) => f.open),
      fixedFindings: fs.filter((f) => !f.open),
      hasItems: items.length > 0,
    });
  }
  return { rows, warnings };
}

function findingCite(f, kind, reviewPath) {
  const status = f.status === '' ? 'no status' : `status "${cell(f.status)}"`;
  return `${kind} (${f.severity}, static review, ${cell(reviewPath)}, ${status}): "${cell(f.text.replace(/[.]+$/, ''))}"`;
}

/** The Remarks cell for one row. Never empty. */
export function buildRemark(row, reviewPath) {
  const { decision, criterion } = row;
  const parts = [];

  const passing = citePassing(row.qualifying);
  const weakAxe = cutList(axePassCites(row.weakPasses), 3);

  switch (decision.level) {
    case 'Supports':
      parts.push(`Passing: ${passing}.`);
      break;
    case 'Partially Supports':
    case 'Does Not Support': {
      if (row.qualifying.length > 0) parts.push(`Passing: ${passing}.`);
      if (row.failing.length > 0) parts.push(`Failing: ${citeFailing(row.failing)}.`);
      for (const f of row.openFindings) parts.push(`${findingCite(f, 'Open finding', reviewPath)}.`);
      parts.push(
        {
          mixed: 'Some checks pass while others fail or are still open, so the criterion is only partly supported.',
          failing: 'At least one check fails and no qualifying check passes.',
          'open-serious-finding': 'A Critical or Serious finding from the static review is still open and no qualifying check passes.',
          'open-minor-finding': 'A Moderate or Minor finding from the static review is still open.',
        }[decision.reasonCode],
      );
      break;
    }
    case 'Not Applicable':
      parts.push(`${cell(row.override.reason).replace(/[.!?]+$/, '')} (owner-stated, not tested).`);
      break;
    default: // Not Evaluated
      if (decision.reasonCode === 'human-only') {
        parts.push(`Needs human judgement: ${criterion.note}`);
        if (row.qualifying.length > 0) parts.push(`Passing evidence is cited but does not change this Level: ${passing}.`);
      } else if (decision.reasonCode === 'inconclusive') {
        parts.push(`Inconclusive: ${citeInconclusive(row.inconclusive)}.`);
        parts.push('A flaky test or an incomplete axe check blocks a rating until it is stable or a person checks it.');
      } else if (row.override?.level === 'Not Evaluated') {
        parts.push(sentence(cell(row.override.reason)));
      } else if (!row.hasItems) {
        parts.push('No evidence found for this criterion.');
      } else {
        parts.push('No test tagged for this criterion was found.');
      }
  }

  if (criterion.humanOnly && decision.level !== 'Not Evaluated' && decision.level !== 'Not Applicable') {
    parts.push(`Also needs human judgement: ${criterion.note}`);
  }
  if (decision.reasonCode !== 'human-only' && row.qualifying.length === 0 && weakAxe && decision.level !== 'Not Applicable') {
    parts.push(`${weakAxe} (not enough on its own for this criterion).`);
  }
  if (decision.overrideIgnored) {
    parts.push(`Owner override Not Applicable ("${cell(row.override.reason)}") was ignored because evidence fails or a finding is open.`);
  }
  if (row.override?.level === 'Not Evaluated' && decision.reasonCode !== 'no-evidence') {
    parts.push(`Owner note: ${sentence(cell(row.override.reason))}`);
  }
  for (const f of row.fixedFindings) parts.push(`${findingCite(f, 'Fixed finding, history only', reviewPath)}.`);
  return parts.join(' ');
}

function table(rows, reviewPath) {
  const lines = ['| Criteria | Conformance Level | Remarks and Explanations |', '| --- | --- | --- |'];
  for (const r of rows) {
    lines.push(`| ${r.criterion.id} ${cell(r.criterion.name)} | ${r.decision.level} | ${buildRemark(r, reviewPath)} |`);
  }
  return lines;
}

/** Count rows per Level. */
export function countLevels(rows) {
  const counts = Object.fromEntries(LEVELS.map((l) => [l, 0]));
  for (const r of rows) counts[r.decision.level]++;
  return counts;
}

/**
 * @param {object} m
 * @param {string} m.date
 * @param {{ name: string, version: string, description: string }} m.product
 * @param {object[]} m.rows
 * @param {object} m.evidence      result of readEvidence()
 * @param {{ path: string, read: boolean, findings: object[] }} m.review
 * @param {string[]} m.warnings
 */
export function renderReport(m) {
  const { evidence: ev, review, rows } = m;
  const L = [];
  const add = (...lines) => L.push(...lines);

  add(`# ${REPORT_TITLE}`, '');
  add('## Product information', '');
  add(
    `- **Product name:** ${cell(m.product.name)}`,
    `- **Product version:** ${cell(m.product.version)}`,
    `- **Report date:** ${m.date}`,
    `- **Product description:** ${cell(m.product.description)}`,
    '- **Applicable standard:** WCAG 2.2 Level A and Level AA',
    `- **Generator:** ${GENERATOR_NAME}`,
    `- **Generator version:** ${GENERATOR_VERSION}`,
    '',
    'The layout follows the style of the Information Technology Industry Council (ITI) VPAT 2.5 WCAG edition. This is not an official VPAT and does not use the ITI template or logo.',
    '',
  );

  add('## Disclaimer', '', DISCLAIMER, '');

  const noEvidence = !ev.anyRead && !review.read;
  if (noEvidence) {
    add(
      '> **Notice: no evidence was read.** No test, scan or review file could be read, so every criterion is Not Evaluated unless the owner recorded a Not Applicable override. Run the tests first, then generate this report again.',
      '',
    );
  }
  if (ev.stale) {
    add(
      `> **Notice: possibly stale evidence.** The oldest evidence file (${cell(ev.stale.oldest)}) is older than the newest source file (${cell(ev.stale.newestSource)}). Run the tests again before relying on this report.`,
      '',
    );
  }

  add('## Evaluation methods', '');
  const pw = ev.runners.playwright;
  const vt = ev.runners.vitest;
  const counts = (c) => `${c.passed} passed, ${c.failed} failed, ${c.skipped} skipped, ${c.inconclusive} inconclusive`;
  const axeText =
    ev.scans.count > 0
      ? `axe-core ${ev.scans.axeVersions.map(cell).join(', ') || 'version not recorded'}, ${plural(ev.scans.count, 'scan')}, pages: ${ev.scans.pages.map(cell).join(', ')}; colour schemes: ${ev.scans.schemes.map(cell).join(', ') || 'not recorded'}`
      : 'no axe scan files were read';
  add(
    `- **Playwright page tests with axe-core:** ${pw ? `read; ${counts(pw)}` : 'not available (no readable Playwright results)'}; ${axeText}.`,
    `- **Vitest unit and property tests:** ${vt ? `read; ${counts(vt)}` : 'not available (no readable Vitest results)'}.`,
    `- **Trusted Tester static review:** ${review.read ? `read from ${cell(review.path)}` : 'not available'}.`,
    '',
  );

  add('## Terms', '');
  add(
    '- **Supports:** The evidence listed in the remarks shows the criterion is met, and none of it shows otherwise.',
    '- **Partially Supports:** Some checks pass while others fail, or a known problem is still open.',
    '- **Does Not Support:** A check fails or a serious problem is open, and no qualifying check passes.',
    '- **Not Applicable:** The app owner states the criterion does not apply and gives a reason. The generator did not test it.',
    '- **Not Evaluated:** There is not enough evidence either way, or a person must judge it.',
    '',
  );

  const counts5 = countLevels(rows);
  add('## Summary', '', '| Conformance Level | Criteria |', '| --- | --- |');
  for (const l of LEVELS) add(`| ${l} | ${counts5[l]} |`);
  add('');

  add('## Table 1: Success Criteria, Level A', '', ...table(rows.filter((r) => r.criterion.level === 'A'), review.path), '');
  add('## Table 2: Success Criteria, Level AA', '', ...table(rows.filter((r) => r.criterion.level === 'AA'), review.path), '');

  add('## Evidence summary', '');
  add('### Files', '');
  const read = ev.files.filter((f) => f.status === 'read');
  if (read.length === 0) add('- No evidence file was read.');
  for (const f of read) add(`- Read: ${cell(f.path)} (modified ${new Date(f.mtimeMs).toISOString()})`);
  for (const f of ev.files.filter((x) => x.status === 'unreadable')) add(`- Unreadable: ${cell(f.path)} (${cell(f.problem)})`);
  for (const p of ev.missing) add(`- Missing: ${cell(p)}`);
  if (review.read) add(`- Read: ${cell(review.path)} (Trusted Tester review)`);
  else add(`- Missing: ${cell(review.path)}`);
  add('');

  const t = ev.tests;
  const open = review.findings.filter((f) => f.open && f.criteria.length > 0).length;
  const fixed = review.findings.filter((f) => !f.open && f.criteria.length > 0).length;
  const unmapped = review.findings.filter((f) => f.criteria.length === 0).length;
  add('### Counts', '');
  add(
    `- **Tests:** ${t.passed} passed, ${t.failed} failed, ${t.skipped} skipped, ${t.inconclusive} inconclusive. Of the tests that ran, ${t.tagged} carry an SC tag and ${t.untagged} do not.`,
    `- **axe scans:** ${ev.scans.count}`,
    `- **Trusted Tester findings:** ${open} open, ${fixed} fixed, ${unmapped} unmapped`,
    '',
  );

  add('### Warnings', '');
  if (m.warnings.length === 0) add('- None.');
  for (const w of m.warnings) add(`- ${cell(w)}`);
  add('');

  return `${L.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd()}\n`;
}
