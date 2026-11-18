import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CRITERIA, compareIds, getCriterion, LEVELS } from '../criteria.mjs';

const REQUIRED_HUMAN_ONLY = [
  '1.2.1', '1.2.2', '1.2.3', '1.2.4', '1.2.5', '1.3.3', '1.4.5', '2.5.4', '3.1.2', '3.2.3', '3.2.4', '3.2.6', '3.3.4',
];

test('catalogue has 55 criteria: 31 Level A and 24 Level AA', () => {
  assert.equal(CRITERIA.length, 55);
  assert.equal(CRITERIA.filter((c) => c.level === 'A').length, 31);
  assert.equal(CRITERIA.filter((c) => c.level === 'AA').length, 24);
});

test('ids are unique and in numeric order (1.4.10 follows 1.4.5)', () => {
  const ids = CRITERIA.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length);
  for (let i = 1; i < ids.length; i++) {
    assert.ok(compareIds(ids[i - 1], ids[i]) < 0, `${ids[i - 1]} should come before ${ids[i]}`);
  }
  assert.ok(ids.indexOf('1.4.10') > ids.indexOf('1.4.5'));
  assert.ok(ids.indexOf('2.4.11') > ids.indexOf('2.4.7'));
});

test('4.1.1 and AAA criteria are absent', () => {
  assert.equal(getCriterion('4.1.1'), undefined);
  for (const aaa of ['1.4.6', '1.4.8', '2.2.3', '2.4.9', '2.4.12', '2.4.13', '2.5.5', '3.3.9']) {
    assert.equal(getCriterion(aaa), undefined, aaa);
  }
  assert.ok(CRITERIA.every((c) => c.level === 'A' || c.level === 'AA'));
});

test('every entry has the fields the generator needs', () => {
  for (const c of CRITERIA) {
    assert.match(c.id, /^[1-4]\.\d{1,2}\.\d{1,2}$/);
    assert.ok(c.name.length > 0);
    assert.ok(['Perceivable', 'Operable', 'Understandable', 'Robust'].includes(c.principle));
    const principleOf = { 1: 'Perceivable', 2: 'Operable', 3: 'Understandable', 4: 'Robust' };
    assert.equal(c.principle, principleOf[c.id[0]]);
    assert.ok(c.tier === 'axe' || c.tier === 'test');
    assert.equal(typeof c.humanOnly, 'boolean');
  }
});

test('the required human-only criteria are marked and carry a note', () => {
  for (const id of REQUIRED_HUMAN_ONLY) {
    const c = getCriterion(id);
    assert.ok(c, id);
    assert.equal(c.humanOnly, true, id);
    assert.ok(typeof c.note === 'string' && c.note.length > 0, `${id} needs a note`);
    assert.ok(!c.note.includes('\n'), `${id} note is one line`);
  }
  assert.equal(CRITERIA.filter((c) => c.humanOnly).length, REQUIRED_HUMAN_ONLY.length);
});

test('only the five axe-tier criteria have tier axe, and none is human-only', () => {
  const axeTier = CRITERIA.filter((c) => c.tier === 'axe').map((c) => c.id);
  assert.deepEqual(axeTier, ['1.3.5', '1.4.3', '2.4.2', '2.5.8', '3.1.1']);
  assert.ok(CRITERIA.filter((c) => c.tier === 'axe').every((c) => !c.humanOnly));
});

test('LEVELS lists the five Levels', () => {
  assert.deepEqual([...LEVELS], ['Supports', 'Partially Supports', 'Does Not Support', 'Not Applicable', 'Not Evaluated']);
});
