#!/usr/bin/env node
// Write <app-dir>/ACR.md, an accessibility conformance report built from the app's own test evidence.
// Reads files only. Usage: node scripts/acr.mjs <app-dir> [<app-dir> ...] [--date YYYY-MM-DD]
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { readConfig } from './acr/config.mjs';
import { readEvidence } from './acr/evidence.mjs';
import { AcrError, readJsonCapped, readTextCapped, REPO_ROOT, resolveAppDir, writeAtomic } from './acr/io.mjs';
import { buildRows, countLevels, renderReport } from './acr/render.mjs';
import { parseReview } from './acr/review.mjs';

const USAGE = 'Usage: node scripts/acr.mjs <app-dir> [<app-dir> ...] [--date YYYY-MM-DD]';
const ACCEPTED_FLAGS = ['--date'];

/** Validate a YYYY-MM-DD calendar date. */
export function isValidDate(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

/** @returns {{ folders: string[], date: string|null }} */
export function parseArgs(argv) {
  const folders = [];
  let date = null;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--date' || a.startsWith('--date=')) {
      const value = a === '--date' ? argv[++i] : a.slice('--date='.length);
      if (value === undefined || !isValidDate(value)) {
        throw new AcrError(`Invalid --date value: ${value === undefined ? '(missing)' : value}. Use a real calendar date as YYYY-MM-DD.`);
      }
      date = value;
    } else if (a.startsWith('-')) {
      throw new AcrError(`Unknown flag: ${a}. Accepted flags: ${ACCEPTED_FLAGS.join(', ')}`);
    } else {
      folders.push(a);
    }
  }
  return { folders, date };
}

/**
 * Build the report text for one app folder. Writes nothing.
 * @param {string} appDir real path of the app folder
 */
export function generate(appDir, { repoRoot = REPO_ROOT, date }) {
  const realRoot = fs.realpathSync(repoRoot);
  const folderName = path.basename(appDir);
  const warnings = [];

  const config = readConfig(appDir, realRoot);
  const evidence = readEvidence(appDir, { repoRoot: realRoot });
  warnings.push(...evidence.warnings);

  let pkg = {};
  try {
    pkg = readJsonCapped(path.join(appDir, 'package.json'), realRoot);
  } catch (e) {
    warnings.push(`Could not read package.json: ${e.message}`);
  }

  const reviewRel = `docs/trusted-tester-review-${folderName}.md`;
  let reviewText = null;
  try {
    reviewText = readTextCapped(path.join(realRoot, reviewRel), realRoot);
  } catch (e) {
    warnings.push(`Skipped unreadable review file ${reviewRel}: ${e.message}`);
  }
  const findings = reviewText === null ? [] : parseReview(reviewText);
  const review = { path: reviewRel, read: reviewText !== null, findings };

  const { rows, warnings: ruleWarnings } = buildRows(evidence.items, findings, config.overrides);
  warnings.push(...ruleWarnings);
  if (!evidence.anyRead && !review.read) warnings.push('No evidence source could be read; every criterion is Not Evaluated.');
  if (evidence.stale) warnings.push(`Possibly stale evidence: ${evidence.stale.oldest} is older than ${evidence.stale.newestSource}.`);

  const text = renderReport({
    date: date ?? new Date().toISOString().slice(0, 10),
    product: {
      name: config.product.name ?? (typeof pkg.name === 'string' ? pkg.name : folderName),
      version: typeof pkg.version === 'string' ? pkg.version : 'Not provided',
      description: config.product.description ?? 'Not provided',
    },
    rows,
    evidence,
    review,
    warnings,
  });
  return { text, counts: countLevels(rows), warnings };
}

/**
 * Command line entry. Returns the exit code.
 * @param {string[]} argv
 * @param {{ cwd?: string, repoRoot?: string, stdout?: (s: string) => void, stderr?: (s: string) => void, fsOps?: object }} [ctx]
 */
export function run(argv, ctx = {}) {
  const cwd = ctx.cwd ?? process.cwd();
  const repoRoot = ctx.repoRoot ?? REPO_ROOT;
  const out = ctx.stdout ?? ((s) => process.stdout.write(`${s}\n`));
  const err = ctx.stderr ?? ((s) => process.stderr.write(`${s}\n`));

  let args;
  try {
    args = parseArgs(argv);
  } catch (e) {
    err(`Error: ${e.message}`);
    return 1;
  }
  if (args.folders.length === 0) {
    err(USAGE);
    return 1;
  }

  let failed = 0;
  for (const folder of args.folders) {
    try {
      const appDir = resolveAppDir(folder, cwd, repoRoot);
      const { text, counts, warnings } = generate(appDir, { repoRoot, date: args.date });
      const target = path.join(appDir, 'ACR.md');
      writeAtomic(target, text, ctx.fsOps ?? fs);
      const summary = Object.entries(counts).map(([level, n]) => `${level} ${n}`).join(', ');
      out(`Wrote ${path.relative(cwd, target) || target}: ${summary}`);
      for (const w of warnings) err(`Warning: ${w}`);
    } catch (e) {
      failed++;
      err(`Error: ${folder}: ${e.message}`);
    }
  }
  return failed > 0 ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  process.exitCode = run(process.argv.slice(2));
}
