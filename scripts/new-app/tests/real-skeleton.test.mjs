import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createApp } from '../../new-app.mjs';
import { REAL_SKELETON, snapshot } from './helpers.mjs';

test('the real skeleton produces a clean, renamed app in a temporary apps/', async () => {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'new-app-real-')));
  try {
    const before = snapshot(path.join(REAL_SKELETON, 'tests'));
    const warnings = [];
    const { destination } = await createApp({ name: 'real-check', rootDir: root, skeletonDir: REAL_SKELETON, warn: (w) => warnings.push(w) });
    assert.deepEqual(warnings, []);
    for (const dir of ['tests/unit', 'tests/e2e', 'tests/unit/properties', 'src']) assert.ok(fs.statSync(path.join(destination, dir)).isDirectory(), dir);
    for (const gone of ['node_modules', 'dist', 'evidence', 'test-results', 'playwright-report', 'coverage', 'ACR.md']) {
      assert.equal(fs.existsSync(path.join(destination, gone)), false, gone);
    }
    assert.equal(JSON.parse(fs.readFileSync(path.join(destination, 'package.json'), 'utf8')).name, 'real-check');
    const html = fs.readFileSync(path.join(destination, 'index.html'), 'utf8');
    assert.match(html, /<title>[^<]*Real Check[^<]*<\/title>/);
    assert.doesNotMatch(html.match(/<title>[^<]*<\/title>/)[0], /Skeleton Key/);
    const after = snapshot(path.join(destination, 'tests'));
    assert.deepEqual(after, before);
    assert.deepEqual(fs.readdirSync(path.join(root, 'apps')), ['real-check']);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
