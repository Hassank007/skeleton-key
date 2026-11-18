import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cell, buildRows, buildRemark, renderReport, countLevels, GENERATOR_VERSION } from '../render.mjs';
import { CRITERIA } from '../criteria.mjs';

const REVIEW = 'docs/trusted-tester-review-x.md';
const testItem = (criterion, over = {}) => ({
  criterion, kind: 'test', result: 'pass', source: 'tests/a.test.ts', label: `t ${criterion} [SC ${criterion}]`, ...over,
});
const axeItem = (criterion, over = {}) => ({
  criterion, kind: 'axe', result: 'pass', source: 'evidence/axe/a.json', label: 'rule-x', page: '/', ...over,
});
const rowFor = (id, items = [], findings = [], overrides = new Map()) =>
  buildRows(items, findings, overrides).rows.find((r) => r.criterion.id === id);
const finding = (over = {}) => ({ severity: 'Moderate', criteria: ['2.4.7'], status: 'OPEN', open: true, line: 1, text: 'Ring is missing.', ...over });

test('cell escapes pipe, newline, backtick and <script>', () => {
  const out = cell('a | b\nc `d` <script>alert(1)</script>');
  assert.ok(!out.includes('\n'));
  assert.ok(!out.includes('`'));
  assert.ok(!/<|>/.test(out));
  assert.equal(out, "a \\| b c 'd' &lt;script&gt;alert(1)&lt;/script&gt;");
  assert.ok(!/(?<!\\)\|/.test(out), 'every pipe is escaped');
});

test('cell cannot make a heading, a link or a table row break', () => {
  const out = cell('x\n## Fake heading | y\r\n[a](javascript:alert(1))');
  assert.ok(!out.includes('\n') && !out.includes('\r'));
  assert.ok(!out.includes(']('));
});

test('cell strips control characters and cuts at 200 characters with ...', () => {
  assert.equal(cell('a\u0000b\u0007c'), 'abc');
  assert.equal(cell('x'.repeat(200)), 'x'.repeat(200));
  const cut = cell('x'.repeat(500));
  assert.equal(cut, `${'x'.repeat(200)}...`);
  assert.equal(cell(undefined), '');
});

test('remarks: Supports cites tagged tests and axe pass counts', () => {
  const row = rowFor('2.4.2', [axeItem('2.4.2', { label: 'document-title' }), axeItem('2.4.2', { label: 'document-title', source: 'b' })]);
  assert.equal(row.decision.level, 'Supports');
  assert.equal(buildRemark(row, REVIEW), 'Passing: axe rule document-title passed on 2 of 2 scans.');
  const t = rowFor('2.4.1', [testItem('2.4.1')]);
  assert.equal(buildRemark(t, REVIEW), 'Passing: tests/a.test.ts "t 2.4.1 [SC 2.4.1]".');
});

test('remarks: more than three citations are cut to three plus "and N more"', () => {
  const items = ['d', 'c', 'b', 'a', 'e'].map((n) => testItem('2.4.1', { label: `t-${n}` }));
  const remark = buildRemark(rowFor('2.4.1', items), REVIEW);
  assert.equal(remark, 'Passing: tests/a.test.ts "t-a"; tests/a.test.ts "t-b"; tests/a.test.ts "t-c"; and 2 more.');
});

test('remarks: citations are sorted by source then label, so input order does not matter', () => {
  const a = testItem('2.4.1', { source: 'z.ts', label: 'one' });
  const b = testItem('2.4.1', { source: 'a.ts', label: 'two' });
  assert.equal(buildRemark(rowFor('2.4.1', [a, b]), REVIEW), buildRemark(rowFor('2.4.1', [b, a]), REVIEW));
  assert.match(buildRemark(rowFor('2.4.1', [a, b]), REVIEW), /^Passing: a\.ts "two"; z\.ts "one"\./);
});

test('remarks: failing evidence is listed in full, axe violations with page and nodes', () => {
  const items = [1, 2, 3, 4].map((n) => testItem('2.4.1', { result: 'fail', label: `f${n}` }));
  items.push(axeItem('2.4.1', { result: 'fail', page: '/about', nodes: 1 }));
  const remark = buildRemark(rowFor('2.4.1', items), REVIEW);
  assert.match(remark, /f1.*f2.*f3.*f4/);
  assert.match(remark, /axe rule rule-x failed on \/about \(1 node\)/);
  assert.match(remark, /no qualifying check passes/);
});

test('remarks: Partially Supports names passing, failing and the finding with severity, status, path, static review', () => {
  const row = rowFor('2.4.7', [testItem('2.4.7'), testItem('2.4.7', { result: 'fail', label: 'bad' })], [finding()]);
  assert.equal(row.decision.level, 'Partially Supports');
  const remark = buildRemark(row, REVIEW);
  assert.match(remark, /Passing: /);
  assert.match(remark, /Failing: /);
  assert.match(remark, /Open finding \(Moderate, static review, docs\/trusted-tester-review-x\.md, status "OPEN"\): "Ring is missing"/);
});

test('remarks: a finding without a status says so', () => {
  const remark = buildRemark(rowFor('2.4.7', [], [finding({ status: '' })]), REVIEW);
  assert.match(remark, /no status\)/);
});

test('remarks: a fixed finding is history and does not change the Level', () => {
  const row = rowFor('2.4.7', [testItem('2.4.7')], [finding({ open: false, status: 'FIXED' })]);
  assert.equal(row.decision.level, 'Supports');
  assert.match(buildRemark(row, REVIEW), /Fixed finding, history only \(Moderate, static review/);
});

test('remarks: Not Applicable carries the reason and "owner-stated, not tested"', () => {
  const row = rowFor('1.2.1', [], [], new Map([['1.2.1', { level: 'Not Applicable', reason: 'No media.' }]]));
  assert.equal(buildRemark(row, REVIEW), 'No media (owner-stated, not tested).');
});

test('remarks: an ignored Not Applicable override is mentioned and warned about', () => {
  const overrides = new Map([['2.4.1', { level: 'Not Applicable', reason: 'Nope' }]]);
  const { rows, warnings } = buildRows([testItem('2.4.1', { result: 'fail' })], [], overrides);
  const row = rows.find((r) => r.criterion.id === '2.4.1');
  assert.equal(row.decision.level, 'Does Not Support');
  assert.match(buildRemark(row, REVIEW), /override Not Applicable \("Nope"\) was ignored/);
  assert.deepEqual(warnings, ['Ignored the Not Applicable override for 2.4.1: it has failing evidence or an open finding.']);
});

test('remarks: Not Evaluated says why in a plain sentence', () => {
  assert.equal(buildRemark(rowFor('1.4.2'), REVIEW), 'No evidence found for this criterion.');
  assert.match(buildRemark(rowFor('1.3.3'), REVIEW), /^Needs human judgement: A person must check/);
  const flaky = rowFor('2.4.7', [testItem('2.4.7', { result: 'inconclusive', label: 'wobbly' })]);
  assert.match(buildRemark(flaky, REVIEW), /^Inconclusive: tests\/a\.test\.ts "wobbly" \(flaky\)\./);
  const weak = rowFor('1.1.1', [axeItem('1.1.1', { label: 'image-alt' })]);
  assert.match(buildRemark(weak, REVIEW), /No test tagged.*axe rule image-alt passed on 1 of 1 scans \(not enough on its own/);
});

test('remarks: a human-only criterion with an open finding keeps the human-judgement note', () => {
  const row = rowFor('1.3.3', [], [finding({ criteria: ['1.3.3'] })]);
  assert.equal(row.decision.level, 'Partially Supports');
  assert.match(buildRemark(row, REVIEW), /Open finding .*Also needs human judgement: A person must check that instructions/);
});
test('remarks: a Not Evaluated override replaces only the no-evidence text', () => {
  const ne = new Map([['1.4.2', { level: 'Not Evaluated', reason: 'Later.' }]]);
  assert.equal(buildRemark(rowFor('1.4.2', [], [], ne), REVIEW), 'Later.');
  const withEvidence = rowFor('1.4.2', [testItem('1.4.2')], [], ne);
  assert.equal(withEvidence.decision.level, 'Supports');
  assert.match(buildRemark(withEvidence, REVIEW), /^Passing: .* Owner note: Later\.$/);
});

test('remarks: hostile titles stay inside the cell', () => {
  const evil = testItem('2.4.1', { label: 'x | y `z` <script>1</script>\n## H' });
  const remark = buildRemark(rowFor('2.4.1', [evil]), REVIEW);
  assert.ok(!remark.includes('\n') && !remark.includes('`') && !remark.includes('<'));
  assert.ok(!/(?<!\\)\|/.test(remark));
});

test('every remark is non-empty for all Levels', () => {
  const { rows } = buildRows([], [], new Map());
  assert.ok(rows.every((r) => buildRemark(r, REVIEW).length > 0));
});

test('rows are in catalogue order and counts add up to 55', () => {
  const { rows } = buildRows([], [], new Map());
  assert.deepEqual(rows.map((r) => r.criterion.id), CRITERIA.map((c) => c.id));
  const counts = countLevels(rows);
  assert.equal(Object.values(counts).reduce((a, b) => a + b, 0), 55);
});

test('renderReport ends with one newline, uses \\n, and names the generator version', () => {
  const { rows } = buildRows([], [], new Map());
  const text = renderReport({
    date: '2025-01-01',
    product: { name: 'p', version: '1', description: 'd' },
    rows,
    evidence: {
      files: [], missing: [], warnings: [], tests: { passed: 0, failed: 0, skipped: 0, inconclusive: 0, tagged: 0, untagged: 0 },
      runners: { vitest: null, playwright: null }, scans: { count: 0, axeVersions: [], pages: [], schemes: [] }, anyRead: false, stale: null,
    },
    review: { path: REVIEW, read: false, findings: [] },
    warnings: [],
  });
  assert.ok(text.endsWith('\n') && !text.endsWith('\n\n'));
  assert.ok(!text.includes('\r'));
  assert.ok(text.includes(`**Generator version:** ${GENERATOR_VERSION}`));
  assert.match(text, /Notice: no evidence was read/);
});
