// Read and validate <app>/acr.config.json. Only "Not Applicable" and "Not Evaluated" overrides are allowed.
import fs from 'node:fs';
import path from 'node:path';
import { isCriterionId } from './criteria.mjs';
import { AcrError, readJsonCapped, REPO_ROOT } from './io.mjs';

export const OVERRIDE_LEVELS = ['Not Applicable', 'Not Evaluated'];

/**
 * @typedef {{ level: 'Not Applicable'|'Not Evaluated', reason: string }} Override
 * @typedef {{ product: { name?: string, description?: string }, overrides: Map<string, Override>, present: boolean }} AcrConfig
 */

const isPlainObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * @param {string} appDir
 * @returns {AcrConfig}
 * @throws {AcrError} when the file exists and is invalid
 */
export function readConfig(appDir, repoRoot = REPO_ROOT) {
  const file = path.join(appDir, 'acr.config.json');
  const empty = { product: {}, overrides: new Map(), present: false };
  if (!fs.existsSync(file)) return empty;

  let raw;
  try {
    raw = readJsonCapped(file, repoRoot);
  } catch (e) {
    throw new AcrError(`Invalid acr.config.json: ${e.message}`);
  }
  if (!isPlainObject(raw)) throw new AcrError('Invalid acr.config.json: the top level must be an object');

  const product = {};
  if (raw.product !== undefined) {
    if (!isPlainObject(raw.product)) throw new AcrError('Invalid acr.config.json: "product" must be an object');
    for (const key of ['name', 'description']) {
      const v = raw.product[key];
      if (v === undefined) continue;
      if (typeof v !== 'string' || v.trim() === '') {
        throw new AcrError(`Invalid acr.config.json: product.${key} must be non-empty text`);
      }
      product[key] = v;
    }
  }

  const overrides = new Map();
  if (raw.criteria !== undefined) {
    if (!isPlainObject(raw.criteria)) throw new AcrError('Invalid acr.config.json: "criteria" must be an object');
    for (const [id, entry] of Object.entries(raw.criteria)) {
      if (!isCriterionId(id)) throw new AcrError(`Invalid acr.config.json: criteria["${id}"] is not a WCAG 2.2 A or AA criterion`);
      if (!isPlainObject(entry)) throw new AcrError(`Invalid acr.config.json: criteria["${id}"] must be an object`);
      for (const key of Object.keys(entry)) {
        if (key !== 'level' && key !== 'reason') {
          throw new AcrError(`Invalid acr.config.json: criteria["${id}"] has an unknown field "${key}"`);
        }
      }
      if (!OVERRIDE_LEVELS.includes(entry.level)) {
        throw new AcrError(
          `Invalid acr.config.json: criteria["${id}"].level must be "Not Applicable" or "Not Evaluated"`,
        );
      }
      if (typeof entry.reason !== 'string' || entry.reason.trim() === '') {
        throw new AcrError(`Invalid acr.config.json: criteria["${id}"] needs a non-empty "reason"`);
      }
      overrides.set(id, { level: entry.level, reason: entry.reason.trim() });
    }
  }
  return { product, overrides, present: true };
}
