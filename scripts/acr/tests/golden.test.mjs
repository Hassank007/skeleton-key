import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { FIXTURES, generateGolden } from './helpers.mjs';

test('golden file: the fixture folder produces the expected ACR.md byte for byte', () => {
  const { code, text } = generateGolden();
  assert.equal(code, 0);
  const expected = fs.readFileSync(path.join(FIXTURES, 'golden', 'expected-ACR.md'), 'utf8');
  assert.equal(text, expected);
});

test('golden file: the expected report shows the cases the fixture was built for', () => {
  const expected = fs.readFileSync(path.join(FIXTURES, 'golden', 'expected-ACR.md'), 'utf8');
  const row = (id) => expected.split('\n').find((l) => l.startsWith(`| ${id} `));
  assert.match(row('1.2.1'), /\| Not Applicable \| The app has no audio or video \(owner-stated, not tested\)\./);
  assert.match(row('1.4.10'), /\| Does Not Support \|.*Owner override Not Applicable \("Pretend nothing can reflow\."\) was ignored/);
  assert.match(row('2.4.5'), /\| Not Evaluated \| Single-page app; a person must confirm\./);
  assert.match(row('4.1.3'), /\| Does Not Support \| Open finding \(Serious, static review, docs\/trusted-tester-review-app\.md, status "OPEN"\): "Announcements may not be spoken \\\| check with a screen reader"/);
  assert.match(row('1.4.3'), /\| Partially Supports \|/);
  assert.match(row('3.3.2'), /Fixed finding, history only/);
  assert.match(row('1.3.1'), /\| Supports \| Passing: tests\/unit\/Button\.test\.tsx "Hostile \\\| title 'tick' &lt;script&gt;alert\(1\)&lt;\/script&gt; \[link\] \(http:\/\/x\.test\) \[SC 1\.3\.1\]"\./);
  assert.match(expected, /Trusted Tester findings:\*\* 2 open, 1 fixed, 1 unmapped/);
  assert.ok(!expected.includes('stale evidence'));
});
