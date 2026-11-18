// Safe file handling: path checks, size-capped JSON reads, atomic writes.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Repository root: two levels above scripts/acr/. */
export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export const MAX_EVIDENCE_BYTES = 50 * 1024 * 1024;

export class AcrError extends Error {}

function isInside(root, target) {
  const rel = path.relative(root, target);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

/** Resolve a path through symlinks and require it to lie inside the repository root. */
export function realInsideRoot(target, repoRoot = REPO_ROOT) {
  const realRoot = fs.realpathSync(repoRoot);
  const real = fs.realpathSync(target);
  if (!isInside(realRoot, real)) throw new AcrError(`${target} resolves outside the repository root`);
  return real;
}

/**
 * Resolve and check an app folder: exists, is a folder, has package.json, lies inside the repository root.
 * @returns {string} the real (symlink-free) path
 */
export function resolveAppDir(arg, cwd = process.cwd(), repoRoot = REPO_ROOT) {
  const abs = path.resolve(cwd, arg);
  let real;
  try {
    real = fs.realpathSync(abs);
  } catch {
    throw new AcrError(`Folder not found: ${arg}`);
  }
  if (!fs.statSync(real).isDirectory()) throw new AcrError(`Not a folder: ${arg}`);
  if (!isInside(fs.realpathSync(repoRoot), real)) {
    throw new AcrError(`Folder is outside the repository root: ${arg}`);
  }
  if (!fs.existsSync(path.join(real, 'package.json'))) throw new AcrError(`No package.json in folder: ${arg}`);
  return real;
}

/** Read a JSON file as data only. Rejects symlinks that leave the repository and files over the cap. */
export function readJsonCapped(file, repoRoot = REPO_ROOT, cap = MAX_EVIDENCE_BYTES) {
  const real = realInsideRoot(file, repoRoot);
  const size = fs.statSync(real).size;
  if (size > cap) throw new AcrError(`file is larger than ${Math.round(cap / 1024 / 1024)} MB`);
  const text = fs.readFileSync(real, 'utf8');
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new AcrError(`not valid JSON (${e.message})`);
  }
}

/** Read a text file inside the repository root with the same checks. Returns null when absent. */
export function readTextCapped(file, repoRoot = REPO_ROOT, cap = MAX_EVIDENCE_BYTES) {
  if (!fs.existsSync(file)) return null;
  const real = realInsideRoot(file, repoRoot);
  if (fs.statSync(real).size > cap) throw new AcrError(`file is larger than ${Math.round(cap / 1024 / 1024)} MB`);
  return fs.readFileSync(real, 'utf8');
}

/**
 * Write to a temporary file in the same folder, then rename over the target.
 * On failure the temporary file is removed and any existing target is left unchanged.
 * `ops` lets tests inject failures.
 */
export function writeAtomic(target, text, ops = fs) {
  const tmp = `${target}.tmp-${process.pid}`;
  try {
    ops.writeFileSync(tmp, text, { encoding: 'utf8' });
    ops.renameSync(tmp, target);
  } catch (e) {
    try {
      fs.rmSync(tmp, { force: true });
    } catch {
      // nothing more to do
    }
    throw new AcrError(`Could not write ${target}: ${e.message}`);
  }
}
