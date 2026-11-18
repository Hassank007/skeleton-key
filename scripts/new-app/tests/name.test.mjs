import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateName, toDisplayName, shouldCopy, NAME_RULE, RESERVED_NAMES } from '../../new-app.mjs';

const GOOD = ['a', 'my-app', 'grimoire', 'app2', 'a1-b2-c3', 'a'.repeat(50)];
const BAD = ['../x', 'a/b', 'a\\b', '.hidden', 'Upper', '@s/p', 'a--b', 'a-', '-a', '1abc', 'a b', 'a.b', 'a_b', '', 'a'.repeat(51), 'skeleton', 'node_modules'];

for (const name of GOOD) {
  test(`validateName accepts ${JSON.stringify(name.length > 20 ? name.slice(0, 8) + '...' : name)}`, () => {
    assert.deepEqual(validateName(name), { ok: true });
  });
}
for (const name of BAD) {
  test(`validateName rejects ${JSON.stringify(name.length > 20 ? name.slice(0, 8) + '...' : name)}`, () => {
    const r = validateName(name);
    assert.equal(r.ok, false);
    assert.ok(r.reason.length > 0);
  });
}

test('rejection states the rule and the rejected value', () => {
  const r = validateName('Bad_Name');
  assert.match(r.reason, /Bad_Name/);
  assert.ok(r.reason.includes(String(NAME_RULE)));
});

test('reserved names say so', () => {
  assert.deepEqual(RESERVED_NAMES, ['skeleton', 'node_modules']);
  assert.match(validateName('skeleton').reason, /reserved/);
});

test('validateName rejects non-strings', () => {
  assert.equal(validateName(undefined).ok, false);
});

test('toDisplayName', () => {
  assert.equal(toDisplayName('my-app'), 'My App');
  assert.equal(toDisplayName('grimoire'), 'Grimoire');
  assert.equal(toDisplayName('a1-b2'), 'A1 B2');
});

const COPY = [
  ['package.json', true], ['.gitignore', true], ['src/main.tsx', true], ['tests/unit/a.test.tsx', true],
  ['public/x.svg', true], ['src/dist/x.js', true], ['src/ACR.md', true], ['README.md', true],
  ['node_modules', false], ['node_modules/x/index.js', false], ['src/node_modules', false], ['src/node_modules/y.js', false],
  ['dist', false], ['dist/a.js', false], ['evidence', false], ['evidence/v.json', false], ['test-results/r.json', false],
  ['playwright-report', false], ['coverage/c.json', false], ['ACR.md', false],
  ['debug.log', false], ['src/deep/x.log', false], ['tsconfig.tsbuildinfo', false], ['src/.DS_Store', false],
  ['dist\\a.js', false], ['src\\node_modules\\y.js', false],
];
for (const [rel, expected] of COPY) {
  test(`shouldCopy(${rel}) is ${expected}`, () => {
    assert.equal(shouldCopy(rel, true), expected);
  });
}
