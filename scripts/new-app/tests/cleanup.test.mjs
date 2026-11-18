import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { makeFakeRoot, runCli, snapshot } from './helpers.mjs';

let fake;
beforeEach(() => { fake = makeFakeRoot(); });
afterEach(() => fake.cleanup());

for (const [label, content] of [['invalid JSON', '{ not json'], ['a folder instead of a file', null]]) {
  test(`a failing step (package.json is ${label}) leaves no app and no temporary folder`, () => {
    const pkg = path.join(fake.root, 'skeleton', 'package.json');
    fs.rmSync(pkg);
    if (content === null) fs.mkdirSync(pkg);
    else fs.writeFileSync(pkg, content);
    const skBefore = snapshot(path.join(fake.root, 'skeleton'));
    const r = runCli(fake, ['doomed']);
    assert.equal(r.status, 1);
    if (content !== null) assert.match(r.stderr, /error: editing package\.json failed/);
    const apps = path.join(fake.root, 'apps');
    assert.deepEqual(fs.existsSync(apps) ? fs.readdirSync(apps) : [], []);
    assert.deepEqual(snapshot(path.join(fake.root, 'skeleton')), skBefore);
  });
}

test('cleanup removes only its own temporary folder', () => {
  const apps = path.join(fake.root, 'apps');
  fs.mkdirSync(path.join(apps, '.other.tmp-1'), { recursive: true });
  fs.writeFileSync(path.join(fake.root, 'skeleton', 'package-lock.json'), 'bad');
  const r = runCli(fake, ['doomed']);
  assert.equal(r.status, 1);
  assert.deepEqual(fs.readdirSync(apps), ['.other.tmp-1']);
});
