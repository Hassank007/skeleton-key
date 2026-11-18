// Read the evidence files an app's test runs leave behind and turn them into one flat list of evidence items.
// Reads files only: no test is run, no server started, no network used.
import fs from 'node:fs';
import path from 'node:path';
import { isCriterionId } from './criteria.mjs';
import { AcrError, MAX_EVIDENCE_BYTES, readJsonCapped, REPO_ROOT } from './io.mjs';

/**
 * @typedef {object} EvidenceItem
 * @property {string} criterion
 * @property {'test'|'axe'} kind
 * @property {'pass'|'fail'|'inconclusive'} result
 * @property {string} source   file the fact came from (test file relative to the app, or the axe scan file)
 * @property {string} label    full test title, or axe rule id
 * @property {string} [detail] page and node count for axe items
 * @property {string} [page]
 * @property {number} [nodes]
 */

const SC_TAG = /\[SC\s+([^\]]+)\]/g;
const WCAG_TAG = /^wcag(\d)(\d)(\d+)$/;

/**
 * Criterion ids named by `[SC ...]` tags in a title.
 * @returns {{ tagged: boolean, ids: string[], unknown: string[] }}
 */
export function parseScTags(title) {
  const ids = [];
  const unknown = [];
  let tagged = false;
  for (const m of title.matchAll(SC_TAG)) {
    tagged = true;
    for (const part of m[1].split(',')) {
      const id = part.replace(/\s+/g, '');
      if (id === '') continue;
      if (isCriterionId(id)) {
        if (!ids.includes(id)) ids.push(id);
      } else unknown.push(id);
    }
  }
  return { tagged, ids, unknown };
}

/** `wcag143` -> `1.4.3`, `wcag1410` -> `1.4.10`. Level tags (`wcag2a`) and best-practice tags give null. */
export function axeTagToCriterion(tag) {
  const m = WCAG_TAG.exec(tag);
  if (!m) return null;
  const id = `${m[1]}.${m[2]}.${m[3]}`;
  return isCriterionId(id) ? id : null;
}

const slash = (p) => p.split(path.sep).join('/');

function newestFile(dir) {
  let best = null;
  const stack = [dir];
  while (stack.length > 0) {
    const d = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(d, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) stack.push(full);
      else if (e.isFile()) {
        const t = fs.statSync(full).mtimeMs;
        if (best === null || t > best.mtimeMs || (t === best.mtimeMs && full < best.file)) best = { file: full, mtimeMs: t };
      }
    }
  }
  return best;
}

function emptyCounts() {
  return { passed: 0, failed: 0, skipped: 0, inconclusive: 0, tagged: 0, untagged: 0 };
}

/**
 * Parse Vitest JSON (Jest-compatible).
 * @returns {{ tests: { title: string, file: string, status: 'pass'|'fail'|'skipped' }[] }}
 */
export function parseVitest(json, appDir) {
  if (!json || !Array.isArray(json.testResults)) throw new AcrError('missing "testResults" array');
  const tests = [];
  for (const tr of json.testResults) {
    if (!tr || typeof tr.name !== 'string' || !Array.isArray(tr.assertionResults)) {
      throw new AcrError('a testResults entry lacks "name" or "assertionResults"');
    }
    const file = path.isAbsolute(tr.name) ? slash(path.relative(appDir, tr.name)) : slash(tr.name);
    for (const a of tr.assertionResults) {
      const title = typeof a?.fullName === 'string' ? a.fullName : typeof a?.title === 'string' ? a.title : null;
      if (title === null || typeof a.status !== 'string') throw new AcrError('an assertion lacks "fullName" or "status"');
      const status = a.status === 'passed' ? 'pass' : a.status === 'failed' ? 'fail' : 'skipped';
      tests.push({ title, file, status });
    }
  }
  return { tests };
}

/**
 * Parse Playwright JSON.
 * @returns {{ tests: { title: string, file: string, status: 'pass'|'fail'|'flaky'|'skipped' }[] }}
 */
export function parsePlaywright(json, appDir) {
  if (!json || !Array.isArray(json.suites)) throw new AcrError('missing "suites" array');
  const rootDir = typeof json.config?.rootDir === 'string' ? json.config.rootDir : null;
  const tests = [];

  const toFile = (file) => {
    if (typeof file !== 'string') return '';
    if (rootDir && !path.isAbsolute(file)) return slash(path.relative(appDir, path.join(rootDir, file)));
    return path.isAbsolute(file) ? slash(path.relative(appDir, file)) : slash(file);
  };

  const walk = (suite, titles, top) => {
    if (!suite || typeof suite !== 'object') throw new AcrError('a suite entry is not an object');
    const here = top ? titles : [...titles, String(suite.title ?? '')];
    if (suite.specs !== undefined && !Array.isArray(suite.specs)) throw new AcrError('"specs" is not an array');
    for (const spec of suite.specs ?? []) {
      if (!spec || typeof spec.title !== 'string' || !Array.isArray(spec.tests)) {
        throw new AcrError('a spec lacks "title" or "tests"');
      }
      for (const t of spec.tests) {
        if (!t || typeof t.status !== 'string') throw new AcrError('a test lacks "status"');
        const results = Array.isArray(t.results) ? t.results : [];
        const last = results.length > 0 ? results[results.length - 1]?.status : undefined;
        let status;
        if (last === 'interrupted') status = 'skipped';
        else if (t.status === 'expected') status = 'pass';
        else if (t.status === 'unexpected') status = 'fail';
        else if (t.status === 'flaky') status = 'flaky';
        else status = 'skipped';
        tests.push({ title: [...here, spec.title].join(' > '), file: toFile(spec.file), status });
      }
    }
    if (suite.suites !== undefined && !Array.isArray(suite.suites)) throw new AcrError('"suites" is not an array');
    for (const child of suite.suites ?? []) walk(child, here, false);
  };

  for (const s of json.suites) walk(s, [], true);
  return { tests };
}

/** Validate one axe scan file (schema version 1). */
export function parseAxeScan(json) {
  if (!json || typeof json !== 'object' || json.schema !== 1) throw new AcrError('not an axe scan file with "schema": 1');
  for (const key of ['violations', 'passes', 'incomplete']) {
    if (!Array.isArray(json[key])) throw new AcrError(`missing "${key}" array`);
    for (const r of json[key]) {
      if (!r || typeof r.id !== 'string' || !Array.isArray(r.tags)) throw new AcrError(`a "${key}" rule lacks "id" or "tags"`);
    }
  }
  return json;
}

/**
 * @param {string} appDir  real path of the app folder
 * @param {{ repoRoot?: string, cap?: number }} [opts]
 */
export function readEvidence(appDir, opts = {}) {
  const repoRoot = fs.realpathSync(opts.repoRoot ?? REPO_ROOT);
  const cap = opts.cap ?? MAX_EVIDENCE_BYTES;
  const evDir = path.join(appDir, 'evidence');
  const rel = (p) => slash(path.relative(repoRoot, p));

  /** @type {EvidenceItem[]} */
  const items = [];
  const files = [];
  const missing = [];
  const warnings = [];
  const tests = emptyCounts();
  const runners = { vitest: null, playwright: null };
  const scans = { count: 0, axeVersions: new Set(), pages: new Set(), schemes: new Set() };

  const load = (file, kind, parser) => {
    if (!fs.existsSync(file)) {
      missing.push(rel(file));
      return null;
    }
    try {
      const json = readJsonCapped(file, repoRoot, cap);
      const parsed = parser(json);
      files.push({ path: rel(file), kind, status: 'read', mtimeMs: fs.statSync(file).mtimeMs });
      return parsed;
    } catch (e) {
      files.push({ path: rel(file), kind, status: 'unreadable', problem: e.message, mtimeMs: null });
      warnings.push(`Skipped unreadable evidence file ${rel(file)}: ${e.message}`);
      return null;
    }
  };

  const addTests = (runner, list, relFileOf) => {
    const counts = { passed: 0, failed: 0, skipped: 0, inconclusive: 0 };
    for (const t of list) {
      if (t.status === 'skipped') {
        counts.skipped++;
        tests.skipped++;
        continue;
      }
      const result = t.status === 'pass' ? 'pass' : t.status === 'fail' ? 'fail' : 'inconclusive';
      if (result === 'pass') (counts.passed++, tests.passed++);
      else if (result === 'fail') (counts.failed++, tests.failed++);
      else (counts.inconclusive++, tests.inconclusive++);

      const tags = parseScTags(t.title);
      if (tags.tagged) tests.tagged++;
      else tests.untagged++;
      for (const u of tags.unknown) {
        warnings.push(`Unknown criterion "${u}" in the SC tag of test "${t.title}" (${relFileOf(t)}); it maps to nothing.`);
      }
      for (const id of tags.ids) {
        items.push({ criterion: id, kind: 'test', result, source: relFileOf(t), label: t.title });
      }
    }
    runners[runner] = counts;
  };

  const vitest = load(path.join(evDir, 'vitest.json'), 'vitest', (j) => parseVitest(j, appDir));
  if (vitest) addTests('vitest', vitest.tests, (t) => t.file);

  const playwright = load(path.join(evDir, 'playwright.json'), 'playwright', (j) => parsePlaywright(j, appDir));
  if (playwright) addTests('playwright', playwright.tests, (t) => t.file);

  const axeDir = path.join(evDir, 'axe');
  let axeFiles = [];
  try {
    axeFiles = fs.readdirSync(axeDir).filter((n) => n.endsWith('.json')).sort();
  } catch {
    missing.push(`${rel(axeDir)}/*.json`);
  }
  if (axeFiles.length === 0 && !missing.some((m) => m.startsWith(rel(axeDir)))) missing.push(`${rel(axeDir)}/*.json`);
  for (const name of axeFiles) {
    const file = path.join(axeDir, name);
    const scan = load(file, 'axe', parseAxeScan);
    if (!scan) continue;
    scans.count++;
    if (typeof scan.axeVersion === 'string') scans.axeVersions.add(scan.axeVersion);
    const page = typeof scan.url === 'string' ? scan.url : '(unknown page)';
    scans.pages.add(page);
    if (typeof scan.colorScheme === 'string') scans.schemes.add(scan.colorScheme);
    const groups = [
      ['violations', 'fail'],
      ['passes', 'pass'],
      ['incomplete', 'inconclusive'],
    ];
    for (const [key, result] of groups) {
      for (const rule of scan[key]) {
        const nodes = Number.isInteger(rule.nodes) ? rule.nodes : undefined;
        const ids = [...new Set(rule.tags.filter((t) => typeof t === 'string').map(axeTagToCriterion).filter(Boolean))];
        for (const id of ids) {
          items.push({
            criterion: id,
            kind: 'axe',
            result,
            source: rel(file),
            label: rule.id,
            page,
            ...(nodes !== undefined ? { nodes } : {}),
            detail: nodes !== undefined ? `${page}, ${nodes} node${nodes === 1 ? '' : 's'}` : page,
          });
        }
      }
    }
  }

  // Stale check: any evidence file older than the newest source file.
  let stale = null;
  const readFiles = files.filter((f) => f.status === 'read' && f.mtimeMs !== null);
  const newestSrc = newestFile(path.join(appDir, 'src'));
  if (readFiles.length > 0 && newestSrc) {
    const oldest = [...readFiles].sort((a, b) => a.mtimeMs - b.mtimeMs || (a.path < b.path ? -1 : 1))[0];
    if (oldest.mtimeMs < newestSrc.mtimeMs) stale = { oldest: oldest.path, newestSource: rel(newestSrc.file) };
  }

  return {
    items,
    files,
    missing,
    warnings,
    tests,
    runners,
    scans: {
      count: scans.count,
      axeVersions: [...scans.axeVersions].sort(),
      pages: [...scans.pages].sort(),
      schemes: [...scans.schemes].sort(),
    },
    anyRead: readFiles.length > 0,
    stale,
  };
}

