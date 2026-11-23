// a11y-guard-agent hook command (Kiro PostToolUse). Reads the hook event JSON on stdin,
// finds the file the agent just wrote and, for .tsx files under skeleton/src/ or apps/*/src/,
// runs the project's own ESLint (jsx-a11y strict) on that one file.
// Contract: never crash the session. Exit code is always 0; own errors print one line.
// Plain Node, no dependencies. The repository root is the folder two levels above this script.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HOOK_NAME = 'a11y-guard-agent';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const LOG_FILE = path.join(ROOT, '.kiro', 'hook-runs.log');
const IN_SCOPE = /(^|\/)(skeleton|apps\/[^/]+)\/src\/.+\.tsx$/;
const PATH_KEY = /(^|_)(path|paths|file|files|filename|filepath|target|targetfile)$|path$|file$/i;

/** Append one line to .kiro/hook-runs.log. Logging problems are swallowed. */
function log(file, result) {
  try {
    fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
    const clean = (s) => String(s).replace(/\s+/g, ' ').trim();
    fs.appendFileSync(LOG_FILE, [new Date().toISOString(), HOOK_NAME, clean(file), clean(result)].join('\t') + '\n');
  } catch {
    /* evidence log is best effort */
  }
}

/** Collect candidate path strings from any JSON value. Keys that look like paths come first. */
export function collectPaths(value) {
  const keyed = [];
  const loose = [];
  const walk = (v, key) => {
    if (typeof v === 'string') {
      if (key && PATH_KEY.test(key)) keyed.push(v);
      else if (/\.tsx$/i.test(v) && !/[\r\n]/.test(v) && v.length < 500) loose.push(v);
    } else if (Array.isArray(v)) {
      v.forEach((item) => walk(item, key));
    } else if (v && typeof v === 'object') {
      for (const [k, item] of Object.entries(v)) walk(item, k);
    }
  };
  walk(value, '');
  return [...keyed, ...loose];
}

/**
 * Turn a candidate into a repo-relative POSIX path if it is an in-scope .tsx file, else null.
 * Accepts / and \ separators, relative paths and absolute paths inside the repository.
 */
export function toScopedPath(candidate, root = ROOT) {
  const posix = String(candidate).replace(/\\/g, '/').replace(/^\.\//, '');
  const rootPosix = root.replace(/\\/g, '/').replace(/\/+$/, '');
  let rel = posix;
  const isAbsolute = /^([a-zA-Z]:)?\//.test(posix);
  if (isAbsolute) {
    if (posix.toLowerCase().startsWith(rootPosix.toLowerCase() + '/')) rel = posix.slice(rootPosix.length + 1);
    else return null;
  }
  return IN_SCOPE.test(rel) && !rel.split('/').includes('..') ? rel : null;
}

/** Find the project folder (skeleton or apps/<name>) and the path inside it. */
function splitProject(rel) {
  const parts = rel.split('/');
  const n = parts[0] === 'apps' ? 2 : 1;
  return { project: parts.slice(0, n).join('/'), inner: parts.slice(n).join('/') };
}

function runEslint(rel) {
  const { project, inner } = splitProject(rel);
  const cwd = path.join(ROOT, ...project.split('/'));
  const bins = [cwd, ROOT].map((d) => path.join(d, 'node_modules', 'eslint', 'bin', 'eslint.js'));
  const bin = bins.find((b) => fs.existsSync(b));
  if (!bin) return { error: `eslint is not installed for ${project} (run npm install there)` };
  const res = spawnSync(process.execPath, [bin, '--format', 'json', inner], { cwd, encoding: 'utf8', timeout: 90_000 });
  if (res.error) return { error: `could not run eslint: ${res.error.message}` };
  let report;
  try {
    report = JSON.parse(res.stdout);
  } catch {
    const first = (res.stderr || res.stdout || 'no output').split(/\r?\n/).find((l) => l.trim()) || 'no output';
    return { error: `eslint failed: ${first.trim()}` };
  }
  const messages = report.flatMap((r) => r.messages || []);
  const fatal = messages.find((m) => m.fatal);
  if (fatal) return { error: `eslint could not parse the file (line ${fatal.line}): ${fatal.message}` };
  return { violations: messages.filter((m) => typeof m.ruleId === 'string' && m.ruleId.startsWith('jsx-a11y/')) };
}

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function main() {
  let event;
  try {
    event = JSON.parse(readStdin());
  } catch {
    console.log('a11y-guard: could not read the hook input (not valid JSON), skipped.');
    log('-', 'error: malformed stdin');
    return;
  }
  const candidates = collectPaths(event);
  let rel = null;
  for (const c of candidates) {
    rel = toScopedPath(c);
    if (rel) break;
  }
  if (!rel) {
    log(candidates[0] ?? '-', 'ignored: not a .tsx file under skeleton/src or apps/*/src');
    return;
  }
  if (!fs.existsSync(path.join(ROOT, ...rel.split('/')))) {
    log(rel, 'ignored: file not found');
    return;
  }
  const out = runEslint(rel);
  if (out.error) {
    console.log(`a11y-guard: ${rel}: ${out.error}`);
    log(rel, `error: ${out.error}`);
    return;
  }
  if (out.violations.length === 0) {
    console.log(`a11y-guard: ${rel}: no jsx-a11y violations`);
    log(rel, 'no jsx-a11y violations');
    return;
  }
  const lines = out.violations.map((m) => `${rel}:${m.line}:${m.column} ${m.ruleId}: ${m.message}`);
  console.log(`a11y-guard: ${rel}: ${out.violations.length} jsx-a11y violation(s)\n${lines.join('\n')}\nFix these now, following .kiro/steering/accessibility.md.`);
  log(rel, `${out.violations.length} jsx-a11y violation(s): ${[...new Set(out.violations.map((m) => m.ruleId))].join(', ')}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (err) {
    console.log(`a11y-guard: internal error, skipped (${err && err.message ? err.message : err})`);
    log('-', `error: ${err && err.message ? err.message : err}`);
  }
  process.exitCode = 0;
}
