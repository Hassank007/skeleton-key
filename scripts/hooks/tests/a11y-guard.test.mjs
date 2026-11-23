// Tests for scripts/hooks/a11y-guard.mjs. Each test runs the script in a temporary fake repository
// that reuses the real skeleton's ESLint config and node_modules (linked, not copied).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { collectPaths, toScopedPath } from '../a11y-guard.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REAL_ROOT = path.resolve(HERE, '..', '..', '..');
const REAL_SKELETON = path.join(REAL_ROOT, 'skeleton');
const SCRIPT = path.join(REAL_ROOT, 'scripts', 'hooks', 'a11y-guard.mjs');
const HAS_ESLINT = fs.existsSync(path.join(REAL_SKELETON, 'node_modules', 'eslint', 'bin', 'eslint.js'));
const LINT = { skip: HAS_ESLINT ? false : 'skeleton/node_modules is not installed' };

const BAD = 'export function Bad() {\n  return <div onClick={() => undefined}>hi</div>\n}\n';
const GOOD = 'export function Good() {\n  return <button type="button">hi</button>\n}\n';

let root;

function put(rel, text) {
  const file = path.join(root, ...rel.split('/'));
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}

before(() => {
  root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'a11y-guard-')));
  fs.mkdirSync(path.join(root, 'scripts', 'hooks'), { recursive: true });
  fs.copyFileSync(SCRIPT, path.join(root, 'scripts', 'hooks', 'a11y-guard.mjs'));
  for (const project of ['skeleton', 'apps/demo']) {
    const dir = path.join(root, ...project.split('/'));
    fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
    fs.copyFileSync(path.join(REAL_SKELETON, 'eslint.config.js'), path.join(dir, 'eslint.config.js'));
    fs.copyFileSync(path.join(REAL_SKELETON, 'package.json'), path.join(dir, 'package.json'));
    if (HAS_ESLINT) fs.symlinkSync(path.join(REAL_SKELETON, 'node_modules'), path.join(dir, 'node_modules'), 'junction');
  }
  put('skeleton/src/Bad.tsx', BAD);
  put('skeleton/src/Good.tsx', GOOD);
  put('apps/demo/src/Bad.tsx', BAD);
  put('skeleton/src/notes.ts', BAD);
  put('skeleton/tests/Bad.tsx', BAD);
  put('other/src/Bad.tsx', BAD);
});

after(() => {
  // Remove the links first so the real node_modules is never touched.
  for (const project of ['skeleton', 'apps/demo']) {
    const link = path.join(root, ...project.split('/'), 'node_modules');
    try {
      fs.unlinkSync(link);
    } catch {
      try { fs.rmdirSync(link); } catch { /* not linked */ }
    }
  }
  fs.rmSync(root, { recursive: true, force: true });
});

function run(stdin, cwd = os.tmpdir()) {
  const res = spawnSync(process.execPath, [path.join(root, 'scripts', 'hooks', 'a11y-guard.mjs')], {
    input: typeof stdin === 'string' ? stdin : JSON.stringify(stdin),
    encoding: 'utf8',
    cwd,
    timeout: 120_000,
  });
  return { code: res.status, out: res.stdout.trim(), err: res.stderr.trim() };
}

const edit = (p, tool = 'fs_write') => ({ hook_event_name: 'PostToolUse', tool_name: tool, tool_input: { path: p } });
const logLines = () => {
  const file = path.join(root, '.kiro', 'hook-runs.log');
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8').trim().split('\n') : [];
};

test('ignores files that are not .tsx: silent, exit 0, logged', () => {
  const before = logLines().length;
  for (const p of ['skeleton/src/notes.ts', 'skeleton/src/styles.css', 'README.md']) {
    const r = run(edit(p));
    assert.equal(r.code, 0);
    assert.equal(r.out, '');
  }
  assert.equal(logLines().length, before + 3);
});

test('ignores .tsx files outside skeleton/src and apps/*/src', () => {
  for (const p of ['skeleton/tests/Bad.tsx', 'other/src/Bad.tsx', 'apps/demo/Bad.tsx', 'skeleton/srcx/Bad.tsx']) {
    const r = run(edit(p));
    assert.equal(r.code, 0);
    assert.equal(r.out, '', p);
  }
});

test('ignores an absolute path outside the repository', () => {
  const outside = path.join(os.tmpdir(), 'elsewhere', 'skeleton', 'src', 'Bad.tsx');
  const r = run(edit(outside));
  assert.equal(r.code, 0);
  assert.equal(r.out, '');
});

test('reports a violation with a line number (POSIX relative path)', LINT, () => {
  const r = run(edit('skeleton/src/Bad.tsx'));
  assert.equal(r.code, 0);
  assert.match(r.out, /a11y-guard: skeleton\/src\/Bad\.tsx: \d+ jsx-a11y violation/);
  assert.match(r.out, /skeleton\/src\/Bad\.tsx:2:\d+ jsx-a11y\//);
  assert.ok(r.out.endsWith('Fix these now, following .kiro/steering/accessibility.md.'));
});

test('accepts a Windows relative path with backslashes', LINT, () => {
  const r = run(edit('skeleton\\src\\Bad.tsx'));
  assert.equal(r.code, 0);
  assert.match(r.out, /skeleton\/src\/Bad\.tsx:2:\d+ jsx-a11y\//);
});

test('accepts absolute paths with either separator style', LINT, () => {
  const abs = path.join(root, 'skeleton', 'src', 'Bad.tsx');
  for (const p of [abs.replace(/\\/g, '/'), abs.replace(/\//g, '\\')]) {
    const r = run(edit(p));
    assert.match(r.out, /skeleton\/src\/Bad\.tsx:2:\d+ jsx-a11y\//, p);
  }
});

test('lints a file in apps/<name>/src with that app\'s own config', LINT, () => {
  const r = run(edit('apps\\demo\\src\\Bad.tsx'));
  assert.match(r.out, /apps\/demo\/src\/Bad\.tsx:2:\d+ jsx-a11y\//);
});

test('prints the clean message for a file with no violations', LINT, () => {
  const r = run(edit('skeleton/src/Good.tsx'));
  assert.equal(r.code, 0);
  assert.equal(r.out, 'a11y-guard: skeleton/src/Good.tsx: no jsx-a11y violations');
});

test('finds the path under other field names and other tools', LINT, () => {
  for (const input of [{ file_path: 'skeleton/src/Good.tsx' }, { filePath: 'skeleton/src/Good.tsx' }, { edits: [{ target_file: 'skeleton/src/Good.tsx' }] }, { path: 'skeleton/src/Good.tsx', text: 'x' }]) {
    const r = run({ tool_name: 'str_replace', tool_input: input });
    assert.match(r.out, /no jsx-a11y violations/, JSON.stringify(input));
  }
  const top = run({ hook_event_name: 'PostFileSave', file: 'skeleton/src/Good.tsx' });
  assert.match(top.out, /no jsx-a11y violations/);
});

test('malformed stdin prints one line and exits 0', () => {
  for (const bad of ['{not json', '', 'null']) {
    const r = run(bad);
    assert.equal(r.code, 0);
    assert.ok(r.out.split('\n').length <= 1);
    if (bad !== 'null') assert.match(r.out, /^a11y-guard: could not read the hook input/);
  }
});

test('a missing file is skipped without error', () => {
  const r = run(edit('skeleton/src/Missing.tsx'));
  assert.equal(r.code, 0);
  assert.equal(r.out, '');
});

test('appends one tab-separated line per run to .kiro/hook-runs.log', LINT, () => {
  const n = logLines().length;
  run(edit('skeleton/src/Good.tsx'));
  const lines = logLines();
  assert.equal(lines.length, n + 1);
  const [time, hook, file, result] = lines.at(-1).split('\t');
  assert.ok(!Number.isNaN(Date.parse(time)));
  assert.equal(hook, 'a11y-guard-agent');
  assert.equal(file, 'skeleton/src/Good.tsx');
  assert.equal(result, 'no jsx-a11y violations');
});

test('collectPaths and toScopedPath helpers', () => {
  assert.deepEqual(collectPaths({ tool_input: { path: 'a.tsx', text: 'export {}' } }), ['a.tsx']);
  assert.equal(toScopedPath('apps/x/src/a/B.tsx', '/r'), 'apps/x/src/a/B.tsx');
  assert.equal(toScopedPath('C:\\r\\skeleton\\src\\B.tsx', 'C:\\r'), 'skeleton/src/B.tsx');
  assert.equal(toScopedPath('/r/skeleton/src/B.tsx', '/r'), 'skeleton/src/B.tsx');
  assert.equal(toScopedPath('/q/skeleton/src/B.tsx', '/r'), null);
  assert.equal(toScopedPath('skeleton/src/../../x/B.tsx', '/r'), null);
});
