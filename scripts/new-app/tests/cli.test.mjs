import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { makeFakeRoot, runCli } from './helpers.mjs';

let fake;
beforeEach(() => { fake = makeFakeRoot(); });
afterEach(() => fake.cleanup());

const noApps = () => assert.equal(fs.existsSync(path.join(fake.root, 'apps')), false);

test('no name: usage on stderr, exit 1, nothing written', () => {
  const r = runCli(fake, []);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /usage: npm run new-app <name>/);
  assert.equal(r.stdout, '');
  noApps();
});

test('extra argument: usage, exit 1, nothing written', () => {
  const r = runCli(fake, ['a', 'b']);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /usage:/);
  noApps();
});

test('unknown flag: usage, exit 1, nothing written', () => {
  for (const args of [['--x'], ['a', '--x'], ['-h']]) {
    const r = runCli(fake, args);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /usage:/);
  }
  noApps();
});

test('bad name: error with rule and value, exit 1, nothing written', () => {
  for (const bad of ['Bad_Name', '../x', 'skeleton']) {
    const r = runCli(fake, [bad]);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /^error: /);
    assert.ok(r.stderr.includes(bad));
  }
  noApps();
  assert.match(runCli(fake, ['Bad_Name']).stderr, /\^\[a-z\]/);
});

test('missing skeleton: error names the path, exit 1', () => {
  fs.rmSync(path.join(fake.root, 'skeleton'), { recursive: true });
  const r = runCli(fake, ['ok']);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /skeleton/);
  assert.match(r.stderr, /package\.json/);
});

test('success from another working directory prints every next step on stdout', () => {
  const r = runCli(fake, ['my-app']);
  assert.equal(r.status, 0);
  assert.equal(r.stderr, '');
  assert.ok(fs.existsSync(path.join(fake.root, 'apps', 'my-app', 'package.json')));
  assert.ok(!fs.existsSync(path.join(fake.cwd, 'apps')));
  for (const s of ['Created apps/my-app', 'My App', 'cd apps/my-app', 'npm install', 'npm run dev', 'npm test', 'npm run test:e2e', 'npm run acr -- apps/my-app', 'Skeleton Key']) {
    assert.ok(r.stdout.includes(s), s);
  }
  assert.doesNotMatch(r.stdout, /\u001b/);
});

test('warnings go to stderr with a prefix and the exit code stays 0', () => {
  fake.cleanup();
  fake = makeFakeRoot({ title: 'Plain' });
  const r = runCli(fake, ['my-app']);
  assert.equal(r.status, 0);
  assert.match(r.stderr, /^warning: /m);
  assert.doesNotMatch(r.stdout, /warning:/);
});

test('second run for the same name is refused', () => {
  assert.equal(runCli(fake, ['twice']).status, 0);
  const r = runCli(fake, ['twice']);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /Refusing to overwrite apps\/twice/);
});
