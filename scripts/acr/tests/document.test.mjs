import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateGolden } from './helpers.mjs';
import { DISCLAIMER, REPORT_TITLE } from '../render.mjs';
import { CRITERIA, LEVELS } from '../criteria.mjs';

const { text } = generateGolden();
const lines = text.split('\n');

/** Split a pipe-table row on unescaped pipes. */
const cells = (line) =>
  line
    .replace(/^\|\s*/, '')
    .replace(/\s*\|$/, '')
    .split(/\s+(?<!\\)\|\s+/);

const tableRows = (heading) => {
  const start = lines.findIndex((l) => l === heading);
  assert.ok(start >= 0, heading);
  const rows = [];
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].startsWith('## ')) break;
    if (/^\| \d\.\d+\.\d+ /.test(lines[i])) rows.push(lines[i]);
  }
  return rows;
};

test('one h1 with the required title, and headings never skip a level', () => {
  const headings = lines.filter((l) => /^#{1,6} /.test(l));
  assert.equal(headings.filter((h) => h.startsWith('# ')).length, 1);
  assert.equal(headings[0], `# ${REPORT_TITLE}`);
  let prev = 1;
  for (const h of headings) {
    const level = h.match(/^#+/)[0].length;
    assert.ok(level <= prev + 1, `heading skips a level: ${h}`);
    prev = level;
  }
});

test('the h2 sections come in the designed order', () => {
  assert.deepEqual(lines.filter((l) => l.startsWith('## ')), [
    '## Product information',
    '## Disclaimer',
    '## Evaluation methods',
    '## Terms',
    '## Summary',
    '## Table 1: Success Criteria, Level A',
    '## Table 2: Success Criteria, Level AA',
    '## Evidence summary',
  ]);
});

test('header fields: name, version, date, description, standard, generator and version', () => {
  for (const field of [
    '- **Product name:** Golden App',
    '- **Product version:** 1.2.3',
    '- **Report date:** 2025-01-01',
    '- **Product description:** A fixture app',
    '- **Applicable standard:** WCAG 2.2 Level A and Level AA',
    '- **Generator:** ',
    '- **Generator version:** ',
  ]) {
    assert.ok(lines.some((l) => l.startsWith(field)), field);
  }
});

test('the ITI statement is present and the report claims no official VPAT', () => {
  assert.match(text, /follows the style of the Information Technology Industry Council \(ITI\) VPAT 2\.5 WCAG edition/);
  assert.match(text, /not an official VPAT/);
});

test('the disclaimer text is verbatim and comes before Table 1', () => {
  const at = text.indexOf(DISCLAIMER);
  assert.ok(at > 0);
  assert.ok(at < text.indexOf('## Table 1'));
});

test('evaluation methods name all three methods, and terms define all five Levels', () => {
  for (const m of ['Playwright page tests with axe-core', 'Vitest unit and property tests', 'Trusted Tester static review']) {
    assert.ok(text.includes(`**${m}:**`), m);
  }
  for (const level of LEVELS) assert.ok(text.includes(`- **${level}:**`), level);
});

test('31 Level A rows and 24 Level AA rows, in catalogue order', () => {
  const a = tableRows('## Table 1: Success Criteria, Level A');
  const aa = tableRows('## Table 2: Success Criteria, Level AA');
  assert.equal(a.length, 31);
  assert.equal(aa.length, 24);
  const ids = [...a, ...aa].map((r) => r.match(/^\| (\S+) /)[1]);
  assert.deepEqual(ids, [...CRITERIA.filter((c) => c.level === 'A'), ...CRITERIA.filter((c) => c.level === 'AA')].map((c) => c.id));
});

test('every row has a valid Level and a non-empty remark; tables have the three required columns', () => {
  assert.equal(lines.filter((l) => l === '| Criteria | Conformance Level | Remarks and Explanations |').length, 2);
  for (const row of [...tableRows('## Table 1: Success Criteria, Level A'), ...tableRows('## Table 2: Success Criteria, Level AA')]) {
    const c = cells(row);
    assert.equal(c.length, 3, row);
    assert.ok(LEVELS.includes(c[1]), `bad Level in: ${row}`);
    assert.ok(c[2].trim().length > 0, `empty remark in: ${row}`);
  }
});

test('the summary counts add up to 55 and match the tables', () => {
  const rows = [...tableRows('## Table 1: Success Criteria, Level A'), ...tableRows('## Table 2: Success Criteria, Level AA')];
  for (const level of LEVELS) {
    const expected = rows.filter((r) => cells(r)[1] === level).length;
    const line = lines.find((l) => l.startsWith(`| ${level} | `));
    assert.equal(Number(line.match(/\| (\d+) \|$/)[1]), expected, level);
  }
});

test('no row says Supports without a "Passing:" citation, or Not Applicable without the owner-stated words', () => {
  for (const row of [...tableRows('## Table 1: Success Criteria, Level A'), ...tableRows('## Table 2: Success Criteria, Level AA')]) {
    const [, level, remark] = cells(row);
    if (level === 'Supports') assert.match(remark, /^Passing: /, row);
    if (level === 'Not Applicable') assert.match(remark, /owner-stated, not tested/, row);
  }
});

test('forbidden words are absent outside the disclaimer, criterion names and quoted evidence', () => {
  let body = text.replace(DISCLAIMER, '');
  // WCAG's own criterion name 3.3.8 "Accessible Authentication" is a title, not a claim about the product.
  body = body.replace(/^\| \d\.\d+\.\d+ [^|]*\|/gm, '|');
  // Quoted evidence (test titles and finding text) is copied, not claimed.
  body = body.replace(/"[^"]*"/g, '""');
  assert.doesNotMatch(body, /\b(accessible|compliant|conforms|conformant|certified)\b/i);
});

test('the report uses only \\n line endings and ends with one newline', () => {
  assert.ok(!text.includes('\r'));
  assert.ok(text.endsWith('\n') && !text.endsWith('\n\n'));
});
