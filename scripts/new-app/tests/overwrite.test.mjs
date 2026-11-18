import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { makeFakeRoot, runCli, snapshot, put } from './helpers.mjs';

let fake;
beforeEach(() => { fake = makeFakeRoot(); });
afterEach(() => fake.cleanup());

function assertNoTemp(apps) {
  assert.deepEqual(fs.readdirSync(apps).filter((n) => n.includes('.tmp-')), []);
}

test('refuses a non-empty folder and leaves it unchanged', () => {
  const dest = path.join(fake.root, 'apps', 'taken');
  put(path.join(dest, 'keep.txt'), 'mine');
  put(path.join(dest, 'sub', 'deep.txt'), 'deep');
  const before = snapshot(dest);
  const r = runCli(fake, ['taken']);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /Refusing to overwrite apps\/taken/);
  assert.deepEqual(snapshot(dest), before);
  assertNoTemp(path.join(fake.root, 'apps'));
});

test('refuses an empty folder', () => {
  const dest = path.join(fake.root, 'apps', 'empty');
  fs.mkdirSync(dest, { recursive: true });
  const r = runCli(fake, ['empty']);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /Refusing to overwrite/);
  assert.deepEqual(fs.readdirSync(dest), []);
  assertNoTemp(path.join(fake.root, 'apps'));
});

test('refuses a file and leaves its bytes unchanged', () => {
  const dest = path.join(fake.root, 'apps', 'afile');
  put(dest, 'precious');
  const r = runCli(fake, ['afile']);
  assert.equal(r.status, 1);
  assert.equal(fs.readFileSync(dest, 'utf8'), 'precious');
  assertNoTemp(path.join(fake.root, 'apps'));
});

test('refuses a symbolic link and leaves it and its target unchanged', (t) => {
  const apps = path.join(fake.root, 'apps');
  const target = path.join(fake.root, 'target');
  put(path.join(target, 't.txt'), 'target');
  fs.mkdirSync(apps, { recursive: true });
  const link = path.join(apps, 'linked');
  try {
    fs.symlinkSync(target, link, 'junction');
  } catch (err) {
    t.skip(`cannot create symbolic links here (${err.code})`);
    return;
  }
  const before = snapshot(target);
  const r = runCli(fake, ['linked']);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /Refusing to overwrite/);
  assert.ok(fs.lstatSync(link).isSymbolicLink());
  assert.deepEqual(snapshot(target), before);
  assertNoTemp(apps);
});
