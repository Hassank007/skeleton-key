import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renameInPackageJson, renameInPackageLock, renameInIndexHtml, nextSteps } from '../../new-app.mjs';

test('renameInPackageJson sets name, keeps other fields and order, uses 2 spaces and a final newline', () => {
  const src = JSON.stringify({ name: 'skeleton', private: true, scripts: { test: 'x' }, dependencies: { a: '1' } }, null, 4);
  const out = renameInPackageJson(src, 'my-app');
  assert.equal(out, JSON.stringify({ name: 'my-app', private: true, scripts: { test: 'x' }, dependencies: { a: '1' } }, null, 2) + '\n');
  assert.deepEqual(Object.keys(JSON.parse(out)), ['name', 'private', 'scripts', 'dependencies']);
  assert.match(out, /^ {2}"name"/m);
});

test('renameInPackageJson throws on invalid JSON', () => {
  assert.throws(() => renameInPackageJson('{nope', 'x'));
});

test('renameInPackageLock sets both names and nothing else', () => {
  const lock = { name: 'skeleton', version: '1', lockfileVersion: 3, packages: { '': { name: 'skeleton', version: '1' }, 'node_modules/a': { name: 'skeleton', version: '2' } } };
  const out = JSON.parse(renameInPackageLock(JSON.stringify(lock), 'my-app'));
  assert.equal(out.name, 'my-app');
  assert.equal(out.packages[''].name, 'my-app');
  assert.equal(out.packages['node_modules/a'].name, 'skeleton');
  assert.equal(out.version, '1');
  assert.ok(renameInPackageLock(JSON.stringify(lock), 'my-app').endsWith('}\n'));
});

test('renameInPackageLock works without packages[""]', () => {
  const out = JSON.parse(renameInPackageLock('{"name":"s","packages":{}}', 'z'));
  assert.equal(out.name, 'z');
  assert.deepEqual(out.packages, {});
});

test('renameInIndexHtml replaces only inside the title', () => {
  const html = '<head>\r\n<title>Home — Skeleton Key</title>\r\n</head><body>Skeleton Key</body>';
  const r = renameInIndexHtml(html, 'My App');
  assert.equal(r.replaced, true);
  assert.equal(r.html, '<head>\r\n<title>Home — My App</title>\r\n</head><body>Skeleton Key</body>');
});

test('renameInIndexHtml reports no match and leaves html unchanged', () => {
  for (const html of ['<title>Other</title>', '<body>Skeleton Key</body>', '']) {
    const r = renameInIndexHtml(html, 'My App');
    assert.equal(r.replaced, false);
    assert.equal(r.html, html);
  }
});

test('nextSteps lists every step in order, with no colour codes', () => {
  const text = nextSteps('my-app', 'My App');
  const order = ['cd apps/my-app', 'npm install', 'npm run dev', 'npm test', 'npm run test:e2e', 'npm run acr -- apps/my-app'].map((s) => text.indexOf(s));
  assert.ok(order.every((i) => i >= 0));
  assert.deepEqual(order, [...order].sort((a, b) => a - b));
  assert.match(text, /apps\/my-app/);
  assert.match(text, /My App/);
  assert.match(text, /"Skeleton Key" text in src\//);
  assert.doesNotMatch(text, /\u001b/);
});
