// Shared helpers for the generator tests. Not a test file.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { run } from '../../acr.mjs';

export const HERE = path.dirname(fileURLToPath(import.meta.url));
export const FIXTURES = path.join(HERE, 'fixtures');
export const REAL_REPO_ROOT = path.resolve(HERE, '..', '..', '..');

/** Create a temporary "repository" folder under the OS temp folder. Returns its real path and a cleanup function. */
export function makeTempRepo() {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'acr-test-')));
  return { root, cleanup: () => fs.rmSync(root, { recursive: true, force: true }) };
}

/** Copy a fixture folder into `dest` (created when needed). */
export function copyFixture(name, dest) {
  fs.cpSync(path.join(FIXTURES, name), dest, { recursive: true });
}

/** Write a file and its parent folders. */
export function put(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}

/** Set modification times (seconds since epoch) on a file. */
export function touch(file, seconds) {
  fs.utimesSync(file, seconds, seconds);
}

/** Snapshot every file under a folder as { relativePath: content } for "nothing else changed" checks. */
export function snapshot(dir) {
  const out = {};
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) walk(full);
      else out[path.relative(dir, full).split(path.sep).join('/')] = fs.readFileSync(full, 'utf8');
    }
  };
  walk(dir);
  return out;
}

// Fixed modification times keep the "modified" lines of the report stable. Evidence is newer than source.
const SOURCE_TIME = 1_700_000_000;
const EVIDENCE_TIME = 1_700_100_000;

/** Run the generator on a temporary copy of the golden fixture with fixed file times. */
export function generateGolden() {
  const { root, cleanup } = makeTempRepo();
  try {
    copyFixture('golden', root);
    const app = path.join(root, 'app');
    touch(path.join(app, 'src', 'main.ts'), SOURCE_TIME);
    for (const f of ['evidence/vitest.json', 'evidence/playwright.json', 'evidence/axe/home.json', 'evidence/axe/about.json']) {
      touch(path.join(app, f), EVIDENCE_TIME);
    }
    const err = [];
    const code = run(['app', '--date', '2025-01-01'], { cwd: root, repoRoot: root, stdout: () => {}, stderr: (s) => err.push(s) });
    return { code, err, text: fs.readFileSync(path.join(app, 'ACR.md'), 'utf8') };
  } finally {
    cleanup();
  }
}

