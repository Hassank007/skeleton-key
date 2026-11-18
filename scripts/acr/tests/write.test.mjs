import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { run } from '../../acr.mjs';
import { writeAtomic, AcrError } from '../io.mjs';
import { copyFixture, makeTempRepo, snapshot } from './helpers.mjs';

function withApp(fn) {
  const { root, cleanup } = makeTempRepo();
  try {
    copyFixture('evidence-app', path.join(root, 'app'));
    const go = (extra = {}) => {
      const err = [];
      const code = run(['app', '--date', '2025-01-01'], { cwd: root, repoRoot: root, stdout: () => {}, stderr: (s) => err.push(s), ...extra });
      return { code, err };
    };
    return fn({ root, app: path.join(root, 'app'), go });
  } finally {
    cleanup();
  }
}

test('a failed write keeps the old report and leaves no temporary file', () => {
  withApp(({ app, go }) => {
    fs.writeFileSync(path.join(app, 'ACR.md'), 'OLD REPORT');
    const failing = {
      ...fs,
      writeFileSync: (file, data, opts) => {
        fs.writeFileSync(file, data, opts); // the temporary file really exists first
        throw new Error('disk full');
      },
      renameSync: fs.renameSync,
    };
    const { code, err } = go({ fsOps: failing });
    assert.equal(code, 1);
    assert.match(err.join('\n'), /disk full/);
    assert.equal(fs.readFileSync(path.join(app, 'ACR.md'), 'utf8'), 'OLD REPORT');
    assert.deepEqual(fs.readdirSync(app).filter((n) => n.includes('.tmp-')), []);
  });
});

test('a failed rename keeps the old report and removes the temporary file', () => {
  withApp(({ app, go }) => {
    fs.writeFileSync(path.join(app, 'ACR.md'), 'OLD REPORT');
    const failing = { ...fs, writeFileSync: fs.writeFileSync, renameSync: () => { throw new Error('locked'); } };
    const { code } = go({ fsOps: failing });
    assert.equal(code, 1);
    assert.equal(fs.readFileSync(path.join(app, 'ACR.md'), 'utf8'), 'OLD REPORT');
    assert.deepEqual(fs.readdirSync(app).filter((n) => n.includes('.tmp-')), []);
  });
});

test('a real write failure (ACR.md is a folder) exits 1 and leaves no temporary file', () => {
  withApp(({ app, go }) => {
    fs.mkdirSync(path.join(app, 'ACR.md'));
    const { code, err } = go();
    assert.equal(code, 1);
    assert.match(err.join('\n'), /Could not write/);
    assert.deepEqual(fs.readdirSync(app).filter((n) => n.includes('.tmp-')), []);
    assert.ok(fs.statSync(path.join(app, 'ACR.md')).isDirectory());
  });
});

test('writeAtomic throws AcrError and removes its temporary file', () => {
  const { root, cleanup } = makeTempRepo();
  try {
    const target = path.join(root, 'ACR.md');
    assert.throws(() => writeAtomic(target, 'x', { ...fs, renameSync: () => { throw new Error('nope'); } }), AcrError);
    assert.deepEqual(fs.readdirSync(root), []);
  } finally {
    cleanup();
  }
});

test('a successful write leaves no temporary file', () => {
  withApp(({ app, go }) => {
    assert.equal(go().code, 0);
    assert.deepEqual(fs.readdirSync(app).filter((n) => n.includes('.tmp-')), []);
  });
});

test('only ACR.md changes, and a second run gives identical output', () => {
  withApp(({ root, app, go }) => {
    const before = snapshot(root);
    assert.equal(go().code, 0);
    const first = fs.readFileSync(path.join(app, 'ACR.md'), 'utf8');
    const after = snapshot(root);
    const changed = Object.keys(after).filter((k) => before[k] !== after[k]);
    assert.deepEqual(changed, ['app/ACR.md']);
    assert.deepEqual(Object.keys(after).filter((k) => !(k in before)), ['app/ACR.md']);

    assert.equal(go().code, 0);
    assert.equal(fs.readFileSync(path.join(app, 'ACR.md'), 'utf8'), first);
  });
});
