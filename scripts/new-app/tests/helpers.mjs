// Shared helpers for the new-app tests. Not a test file.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const HERE = path.dirname(fileURLToPath(import.meta.url));
export const REAL_REPO_ROOT = path.resolve(HERE, '..', '..', '..');
export const REAL_SKELETON = path.join(REAL_REPO_ROOT, 'skeleton');
export const SCRIPT_SOURCE = path.join(REAL_REPO_ROOT, 'scripts', 'new-app.mjs');

/** Write a file and its parent folders. */
export function put(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}

/** Create a temporary fake repository root holding a copy of the script and a small fake skeleton/. */
export function makeFakeRoot({ withLock = true, title = 'Home — Skeleton Key' } = {}) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'new-app-')));
  const other = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'new-app-cwd-')));
  put(path.join(root, 'scripts', 'new-app.mjs'), fs.readFileSync(SCRIPT_SOURCE));
  const sk = path.join(root, 'skeleton');
  put(path.join(sk, 'package.json'), JSON.stringify({ name: 'skeleton', private: true, version: '0.0.0', scripts: { test: 'vitest run' }, dependencies: { react: '^19.0.0' } }, null, 2) + '\n');
  if (withLock) {
    put(path.join(sk, 'package-lock.json'), JSON.stringify({ name: 'skeleton', version: '0.0.0', lockfileVersion: 3, requires: true, packages: { '': { name: 'skeleton', version: '0.0.0' }, 'node_modules/react': { version: '19.0.0' } } }, null, 2) + '\n');
  }
  put(path.join(sk, 'index.html'), `<!doctype html>\n<html lang="en">\n  <head>\n    <title>${title}</title>\n  </head>\n  <body></body>\n</html>\n`);
  put(path.join(sk, '.gitignore'), 'node_modules\n');
  put(path.join(sk, 'src', 'main.tsx'), 'export {}\n');
  put(path.join(sk, 'tests', 'unit', 'a.test.tsx'), '// [SC 1.1.1] a\n');
  put(path.join(sk, 'tests', 'unit', 'properties', 'b.property.test.ts'), '// b\n');
  put(path.join(sk, 'tests', 'e2e', 'c.spec.ts'), '// c\n');
  put(path.join(sk, 'vite.config.ts'), 'export default {}\n');
  put(path.join(sk, 'playwright.config.ts'), 'export default {}\n');
  for (const junk of ['node_modules/x/index.js', 'src/node_modules/y.js', 'dist/a.js', 'evidence/vitest.json', 'test-results/r.json', 'playwright-report/i.html', 'coverage/c.json', 'ACR.md', 'debug.log']) {
    put(path.join(sk, junk), 'junk\n');
  }
  const cleanup = () => {
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(other, { recursive: true, force: true });
  };
  return { root, cwd: other, cleanup };
}

/** Run the copied script in the fake root from an unrelated working directory. */
export function runCli(fake, args = []) {
  const r = spawnSync(process.execPath, [path.join(fake.root, 'scripts', 'new-app.mjs'), ...args], { cwd: fake.cwd, encoding: 'utf8' });
  return { status: r.status, stdout: r.stdout, stderr: r.stderr };
}

/** Map every entry under dir (relative path, forward slashes) to a content hash, "dir" or "link:<target>". */
export function snapshot(dir) {
  const out = {};
  const walk = (d) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      const rel = path.relative(dir, full).split(path.sep).join('/');
      if (entry.isSymbolicLink()) out[rel] = `link:${fs.readlinkSync(full)}`;
      else if (entry.isDirectory()) { out[rel] = 'dir'; walk(full); }
      else out[rel] = crypto.createHash('sha256').update(fs.readFileSync(full)).digest('hex');
    }
  };
  if (fs.existsSync(dir)) walk(dir);
  return out;
}
