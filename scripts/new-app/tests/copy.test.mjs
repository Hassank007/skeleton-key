import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createApp } from '../../new-app.mjs';
import { makeFakeRoot, snapshot, put } from './helpers.mjs';

let fake;
beforeEach(() => { fake = makeFakeRoot(); });
afterEach(() => fake.cleanup());

const exists = (...p) => fs.existsSync(path.join(fake.root, 'apps', 'out', ...p));

test('excluded names are absent, everything else is present and identical', async () => {
  const sk = path.join(fake.root, 'skeleton');
  const skBefore = snapshot(sk);
  const warnings = [];
  const { destination } = await createApp({ name: 'out', rootDir: fake.root, warn: (w) => warnings.push(w) });
  assert.equal(destination, path.join(fake.root, 'apps', 'out'));
  for (const gone of ['node_modules', 'src/node_modules', 'dist', 'evidence', 'test-results', 'playwright-report', 'coverage', 'ACR.md', 'debug.log']) {
    assert.equal(exists(...gone.split('/')), false, gone);
  }
  const out = snapshot(destination);
  for (const same of ['.gitignore', 'src/main.tsx', 'tests/unit/a.test.tsx', 'tests/unit/properties/b.property.test.ts', 'tests/e2e/c.spec.ts', 'vite.config.ts', 'playwright.config.ts']) {
    assert.equal(out[same], skBefore[same], same);
  }
  assert.deepEqual(warnings, []);
  assert.deepEqual(snapshot(sk), skBefore);
  assert.deepEqual(fs.readdirSync(path.join(fake.root, 'apps')), ['out']);
});

test('a symbolic link in the skeleton is skipped with a warning', async (t) => {
  const sk = path.join(fake.root, 'skeleton');
  put(path.join(fake.root, 'outside.txt'), 'x');
  try {
    fs.symlinkSync(path.join(fake.root, 'outside.txt'), path.join(sk, 'src', 'link.txt'), 'file');
  } catch (err) {
    t.skip(`cannot create symbolic links here (${err.code})`);
    return;
  }
  const warnings = [];
  await createApp({ name: 'out', rootDir: fake.root, warn: (w) => warnings.push(w) });
  assert.equal(exists('src', 'link.txt'), false);
  assert.equal(exists('src', 'main.tsx'), true);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /src\/link\.txt/);
});

test('names and title are rewritten in the copy only', async () => {
  await createApp({ name: 'my-app', rootDir: fake.root });
  const dest = path.join(fake.root, 'apps', 'my-app');
  assert.equal(JSON.parse(fs.readFileSync(path.join(dest, 'package.json'), 'utf8')).name, 'my-app');
  const lock = JSON.parse(fs.readFileSync(path.join(dest, 'package-lock.json'), 'utf8'));
  assert.equal(lock.name, 'my-app');
  assert.equal(lock.packages[''].name, 'my-app');
  assert.match(fs.readFileSync(path.join(dest, 'index.html'), 'utf8'), /<title>Home \S+ My App<\/title>/);
  assert.equal(JSON.parse(fs.readFileSync(path.join(fake.root, 'skeleton', 'package.json'), 'utf8')).name, 'skeleton');
});

test('a missing lock file is fine', async () => {
  fs.rmSync(path.join(fake.root, 'skeleton', 'package-lock.json'));
  await createApp({ name: 'out', rootDir: fake.root });
  assert.equal(exists('package-lock.json'), false);
});

test('a title without "Skeleton Key" warns and still succeeds', async () => {
  fake.cleanup();
  fake = makeFakeRoot({ title: 'Plain title' });
  const warnings = [];
  await createApp({ name: 'out', rootDir: fake.root, warn: (w) => warnings.push(w) });
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /Skeleton Key/);
  assert.match(fs.readFileSync(path.join(fake.root, 'apps', 'out', 'index.html'), 'utf8'), /<title>Plain title<\/title>/);
});

test('missing skeleton/package.json is an error naming the path', async () => {
  fs.rmSync(path.join(fake.root, 'skeleton', 'package.json'));
  await assert.rejects(createApp({ name: 'out', rootDir: fake.root }), /package\.json/);
  assert.equal(fs.existsSync(path.join(fake.root, 'apps')), false);
});
