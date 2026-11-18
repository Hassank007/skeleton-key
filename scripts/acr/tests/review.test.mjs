import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { parseReview, isOpen } from '../review.mjs';
import { FIXTURES, REAL_REPO_ROOT } from './helpers.mjs';

const fixture = parseReview(fs.readFileSync(path.join(FIXTURES, 'review-cases.md'), 'utf8'));

test('status rules: FIXED closes, PARTLY and no status stay open', () => {
  assert.equal(isOpen('FIXED'), false);
  assert.equal(isOpen('fixed after review'), false);
  assert.equal(isOpen('PARTLY ADDRESSED (token test added)'), true);
  assert.equal(isOpen('FIXED, PARTLY'), true);
  assert.equal(isOpen('OPEN'), true);
  assert.equal(isOpen(''), true);
});

test('finds lines inside and outside code fences, with indentation', () => {
  assert.equal(fixture.length, 9);
  assert.deepEqual(fixture.map((f) => f.severity), [
    'Serious', 'Moderate', 'Moderate', 'Moderate', 'Minor', 'Minor', 'Minor', 'Minor', 'Critical',
  ]);
});

test('a "[Severity]" that is not at the start of a line is ignored', () => {
  assert.ok(!fixture.some((f) => f.text.includes('in the middle')));
});

test('a fenced block takes its text from the Issue line', () => {
  assert.deepEqual(fixture[0].criteria, ['1.4.3']);
  assert.equal(fixture[0].open, false);
  assert.equal(fixture[0].text, 'Contrast was too low.');
  assert.equal(fixture[0].line, 4);
});

test('multi-criterion segments map to every criterion', () => {
  assert.deepEqual(fixture[2].criteria, ['2.2.1', '2.4.3']);
  assert.deepEqual(fixture[4].criteria, ['3.3.2', '4.1.2']);
});

test('OPEN, PARTLY ADDRESSED, no status, and lower-case status', () => {
  assert.equal(fixture[1].open, true);
  assert.equal(fixture[3].open, true);
  assert.equal(fixture[3].status, 'PARTLY ADDRESSED (token test added)');
  assert.equal(fixture[5].status, '');
  assert.equal(fixture[5].open, true);
  assert.equal(fixture[8].open, true);
});

test('a line with no catalogue criterion is unmapped, including 4.1.1', () => {
  assert.deepEqual(fixture[6].criteria, [], 'Test coverage line');
  assert.deepEqual(fixture[7].criteria, [], '4.1.1 is not in the catalogue');
});

test('numbers inside the description are not read as criteria', () => {
  const [f] = parseReview('[Minor] 2.4.11 scroll-margin-top applies to main (index.css:37-40, line 5.1.2).  -> OPEN');
  assert.deepEqual(f.criteria, ['2.4.11']);
});

test('the checked-in skeleton review parses as expected', () => {
  const text = fs.readFileSync(path.join(REAL_REPO_ROOT, 'docs', 'trusted-tester-review-skeleton.md'), 'utf8');
  const findings = parseReview(text);
  assert.ok(findings.length >= 15, `found ${findings.length}`);
  const find = (sev, id) => findings.filter((f) => f.severity === sev && f.criteria.includes(id));

  assert.equal(find('Serious', '1.4.3')[0].open, false);
  assert.equal(find('Moderate', '2.4.2')[0].open, false);
  assert.ok(find('Moderate', '4.1.3')[0].open);
  const timing = findings.find((f) => f.criteria.includes('2.2.1'));
  assert.deepEqual(timing.criteria, ['2.2.1', '2.4.3']);
  assert.equal(timing.open, true);
  const partly = findings.filter((f) => f.severity === 'Moderate' && f.criteria.includes('1.4.3'));
  assert.equal(partly[0].open, true, 'PARTLY ADDRESSED stays open');
  const field = findings.find((f) => f.criteria.includes('3.3.2'));
  assert.deepEqual(field.criteria, ['3.3.2', '4.1.2']);
  const unmapped = findings.filter((f) => f.criteria.length === 0);
  assert.equal(unmapped.length, 1);
  assert.match(unmapped[0].text, /Test coverage/);
});
