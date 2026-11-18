import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { readEvidence, parseScTags, axeTagToCriterion, parsePlaywright, parseVitest, parseAxeScan } from '../evidence.mjs';
import { FIXTURES, copyFixture, makeTempRepo, put, touch } from './helpers.mjs';

const FIXTURE_APP = path.join(fs.realpathSync(FIXTURES), 'evidence-app');
const read = () => readEvidence(FIXTURE_APP, { repoRoot: fs.realpathSync(FIXTURES) });
const forCriterion = (ev, id) => ev.items.filter((i) => i.criterion === id);

test('SC tag syntax: lists, whitespace, unknown entries, no tag', () => {
  assert.deepEqual(parseScTags('Skip link [SC 2.4.1]'), { tagged: true, ids: ['2.4.1'], unknown: [] });
  assert.deepEqual(parseScTags('x [SC 3.3.1, 3.3.3]').ids, ['3.3.1', '3.3.3']);
  assert.deepEqual(parseScTags('x [SC  2.4.3 ,2.4.7 ]').ids, ['2.4.3', '2.4.7']);
  assert.deepEqual(parseScTags('x [SC 9.9.9, 2.4.3]'), { tagged: true, ids: ['2.4.3'], unknown: ['9.9.9'] });
  assert.deepEqual(parseScTags('x [SC 4.1.1]'), { tagged: true, ids: [], unknown: ['4.1.1'] });
  assert.deepEqual(parseScTags('no tag here'), { tagged: false, ids: [], unknown: [] });
});

test('wcag<digits> axe tags map to criteria; level and best-practice tags are ignored', () => {
  assert.equal(axeTagToCriterion('wcag111'), '1.1.1');
  assert.equal(axeTagToCriterion('wcag143'), '1.4.3');
  assert.equal(axeTagToCriterion('wcag1410'), '1.4.10');
  assert.equal(axeTagToCriterion('wcag2411'), '2.4.11');
  assert.equal(axeTagToCriterion('wcag258'), '2.5.8');
  for (const ignored of ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice', 'cat.color', 'wcag999', 'wcag411']) {
    assert.equal(axeTagToCriterion(ignored), null, ignored);
  }
});

test('Playwright fixture: pass, fail, skipped, flaky and nested suites', () => {
  const ev = read();
  const pw = ev.items.filter((i) => i.kind === 'test' && i.source === 'tests/e2e/home.spec.ts');
  const by = (id) => pw.filter((i) => i.criterion === id);
  assert.equal(by('2.4.1')[0].result, 'pass');
  assert.equal(by('1.4.10')[0].result, 'fail');
  assert.equal(by('2.4.5').length, 0, 'skipped tests are not evidence');
  assert.equal(by('2.4.7')[0].result, 'inconclusive', 'flaky is inconclusive');
  assert.equal(by('2.1.1')[0].label, 'Dialog > Escape closes [SC 2.1.1, 2.1.2]');
  assert.equal(by('2.1.2')[0].result, 'pass');
  assert.equal(by('2.4.3')[0].result, 'pass');
  assert.equal(by('9.9.9').length, 0);
  assert.ok(ev.warnings.some((w) => w.includes('"9.9.9"') && w.includes('bad tag')), 'unknown SC entry warns');
});

test('Vitest fixture: passed, failed, pending, untagged', () => {
  const ev = read();
  assert.equal(forCriterion(ev, '4.1.2').find((i) => i.kind === 'test').result, 'pass');
  assert.equal(forCriterion(ev, '3.3.1').find((i) => i.kind === 'test').result, 'fail');
  assert.equal(forCriterion(ev, '3.3.2').length, 0, 'pending tests are not evidence');
  assert.equal(forCriterion(ev, '3.3.1')[0].source, 'tests/unit/Button.test.tsx');
});

test('test counts: passed, failed, skipped, inconclusive, tagged, untagged', () => {
  const ev = read();
  assert.deepEqual(ev.runners.vitest, { passed: 2, failed: 1, skipped: 1, inconclusive: 0 });
  assert.deepEqual(ev.runners.playwright, { passed: 4, failed: 1, skipped: 1, inconclusive: 1 });
  assert.equal(ev.tests.passed, 6);
  assert.equal(ev.tests.failed, 2);
  assert.equal(ev.tests.skipped, 2);
  assert.equal(ev.tests.inconclusive, 1);
  assert.equal(ev.tests.tagged, 7);
  assert.equal(ev.tests.untagged, 2);
});

test('axe fixture: violations, passes, incomplete and inapplicable', () => {
  const ev = read();
  const contrast = forCriterion(ev, '1.4.3').filter((i) => i.kind === 'axe');
  assert.deepEqual(contrast.map((i) => i.result).sort(), ['fail', 'pass'], 'REQ-4.5: both are kept');
  const failing = contrast.find((i) => i.result === 'fail');
  assert.equal(failing.page, '/');
  assert.equal(failing.nodes, 2);
  assert.equal(failing.detail, '/, 2 nodes');
  assert.equal(forCriterion(ev, '2.4.2').filter((i) => i.result === 'pass').length, 2);
  assert.equal(forCriterion(ev, '2.5.8')[0].result, 'inconclusive');
  assert.equal(forCriterion(ev, '1.4.10').find((i) => i.kind === 'axe').label, 'reflow-rule');
  assert.equal(forCriterion(ev, '2.4.11')[0].label, 'reflow-rule');
  assert.ok(!ev.items.some((i) => i.label === 'region' || i.label === 'video-caption'));
  assert.deepEqual(ev.scans, { count: 2, axeVersions: ['4.10.3'], pages: ['/', '/about'], schemes: ['dark', 'light'] });
});

test('evidence files are listed with a repository-relative path and mtime', () => {
  const ev = read();
  const paths = ev.files.map((f) => f.path).sort();
  assert.ok(paths.includes('evidence-app/evidence/vitest.json'));
  assert.ok(paths.includes('evidence-app/evidence/axe/home.json'));
  assert.ok(ev.files.every((f) => f.status === 'read' && typeof f.mtimeMs === 'number'));
  assert.deepEqual(ev.missing, []);
});

test('parsers reject files that lack the fields they read', () => {
  assert.throws(() => parsePlaywright({}, '/x'), /suites/);
  assert.throws(() => parsePlaywright({ suites: [{ title: 'a', specs: [{ title: 't' }] }] }, '/x'), /tests/);
  assert.throws(() => parseVitest({ testResults: [{ name: 'a' }] }, '/x'), /assertionResults/);
  assert.throws(() => parseVitest([], '/x'), /testResults/);
  assert.throws(() => parseAxeScan({ schema: 2 }), /schema/);
  assert.throws(() => parseAxeScan({ schema: 1, violations: [], passes: [] }), /incomplete/);
});

test('missing, malformed and valid-but-wrong evidence files do not crash and are reported', () => {
  const { root, cleanup } = makeTempRepo();
  try {
    const app = path.join(root, 'app');
    put(path.join(app, 'package.json'), '{"name":"app"}');
    put(path.join(app, 'evidence', 'vitest.json'), '{ not json');
    put(path.join(app, 'evidence', 'playwright.json'), '{"hello": 1}');
    put(path.join(app, 'evidence', 'axe', 'a.json'), '{"schema":1,"violations":[],"passes":[],"incomplete":[]}');
    put(path.join(app, 'evidence', 'axe', 'b.json'), '[]');
    const ev = readEvidence(app, { repoRoot: root });
    assert.equal(ev.files.filter((f) => f.status === 'unreadable').length, 3);
    assert.equal(ev.warnings.length, 3);
    assert.ok(ev.warnings.some((w) => w.includes('vitest.json') && /valid JSON/.test(w)));
    assert.ok(ev.warnings.some((w) => w.includes('playwright.json') && /suites/.test(w)));
    assert.equal(ev.items.length, 0, 'unreadable files are never evidence');
    assert.equal(ev.scans.count, 1);
    assert.equal(ev.anyRead, true);

    fs.rmSync(path.join(app, 'evidence'), { recursive: true });
    const none = readEvidence(app, { repoRoot: root });
    assert.equal(none.anyRead, false);
    assert.deepEqual(none.missing.map((m) => m.replace(/^app\//, '')).sort(), [
      'evidence/axe/*.json',
      'evidence/playwright.json',
      'evidence/vitest.json',
    ]);
  } finally {
    cleanup();
  }
});

test('a file over the size cap is unreadable', () => {
  const { root, cleanup } = makeTempRepo();
  try {
    const app = path.join(root, 'app');
    put(path.join(app, 'package.json'), '{"name":"app"}');
    put(path.join(app, 'evidence', 'vitest.json'), JSON.stringify({ testResults: [], pad: 'x'.repeat(200) }));
    const ev = readEvidence(app, { repoRoot: root, cap: 100 });
    assert.equal(ev.files[0].status, 'unreadable');
    assert.match(ev.warnings[0], /larger than/);
  } finally {
    cleanup();
  }
});

test('stale evidence: an evidence file older than the newest source file is flagged', () => {
  const { root, cleanup } = makeTempRepo();
  try {
    const app = path.join(root, 'app');
    copyFixture('evidence-app', app);
    for (const f of ['evidence/vitest.json', 'evidence/playwright.json', 'evidence/axe/home.json', 'evidence/axe/about.json']) {
      touch(path.join(app, f), 2_000_000_000 / 1000 + 500);
    }
    touch(path.join(app, 'evidence/vitest.json'), 1_000_000);
    touch(path.join(app, 'src/main.ts'), 2_000_000);
    const stale = readEvidence(app, { repoRoot: root }).stale;
    assert.deepEqual(stale, { oldest: 'app/evidence/vitest.json', newestSource: 'app/src/main.ts' });

    touch(path.join(app, 'src/main.ts'), 500_000);
    assert.equal(readEvidence(app, { repoRoot: root }).stale, null);
  } finally {
    cleanup();
  }
});

test('a symlink in evidence/ that leaves the repository is not read', (t) => {
  const { root, cleanup } = makeTempRepo();
  const outside = makeTempRepo();
  try {
    const app = path.join(root, 'app');
    put(path.join(app, 'package.json'), '{"name":"app"}');
    put(path.join(outside.root, 'vitest.json'), '{"testResults":[]}');
    fs.mkdirSync(path.join(app, 'evidence'), { recursive: true });
    try {
      fs.symlinkSync(path.join(outside.root, 'vitest.json'), path.join(app, 'evidence', 'vitest.json'), 'file');
    } catch {
      t.skip('symlinks are not permitted on this machine');
      return;
    }
    const ev = readEvidence(app, { repoRoot: root });
    assert.equal(ev.files[0].status, 'unreadable');
    assert.match(ev.warnings[0], /outside the repository root/);
  } finally {
    cleanup();
    outside.cleanup();
  }
});
