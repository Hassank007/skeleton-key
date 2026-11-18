// Creates apps/<name> from skeleton/. Node built-ins only. See .kiro/specs/new-app-script/.
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

/** A lower-case npm package name that is also a safe folder name on every platform. */
export const NAME_RULE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const MAX_NAME_LENGTH = 50;

/** Names that cannot be used as an app name. */
export const RESERVED_NAMES = ['skeleton', 'node_modules'];

const TOP_LEVEL_EXCLUDED = ['dist', 'evidence', 'test-results', 'playwright-report', 'coverage', 'ACR.md'];

const USAGE = 'usage: npm run new-app <name>\n  <name> is lower-case letters, digits and single hyphens, for example my-app';

/** Returns { ok: true } for an acceptable app name, or { ok: false, reason } without touching the file system. */
export function validateName(name) {
  if (typeof name !== 'string' || name.length === 0 || name.length > MAX_NAME_LENGTH || !NAME_RULE.test(name)) {
    return {
      ok: false,
      reason: `invalid name ${JSON.stringify(name)}: use 1 to ${MAX_NAME_LENGTH} characters matching ${NAME_RULE} (lower-case letters, digits and single hyphens, starting with a letter)`,
    };
  }
  if (RESERVED_NAMES.includes(name)) {
    return { ok: false, reason: `name ${JSON.stringify(name)} is reserved` };
  }
  return { ok: true };
}

/** Turns 'my-app' into 'My App' (letters, digits and spaces only, so no HTML escaping is needed). */
export function toDisplayName(name) {
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/** Decides from a path relative to skeleton/ whether it is copied; pure, no file system access. */
export function shouldCopy(relPath, isTopLevel) {
  const segments = relPath.split(/[\\/]/).filter(Boolean);
  if (segments.length === 0) return true;
  if (segments.includes('node_modules')) return false;
  const base = segments[segments.length - 1];
  if (base.endsWith('.log') || base.endsWith('.tsbuildinfo') || base === '.DS_Store') return false;
  if (isTopLevel && TOP_LEVEL_EXCLUDED.includes(segments[0])) return false;
  return true;
}

/** Sets `name` in package.json text; every other field and the key order stay, output has 2 spaces and a final newline. */
export function renameInPackageJson(text, name) {
  const pkg = JSON.parse(text);
  pkg.name = name;
  return JSON.stringify(pkg, null, 2) + '\n';
}

/** Sets the top-level name and packages[""].name in package-lock.json text and changes nothing else. */
export function renameInPackageLock(text, name) {
  const lock = JSON.parse(text);
  lock.name = name;
  if (lock.packages && lock.packages['']) lock.packages[''].name = name;
  return JSON.stringify(lock, null, 2) + '\n';
}

/** Replaces 'Skeleton Key' inside the first <title>; returns { html, replaced } and leaves the rest untouched. */
export function renameInIndexHtml(html, displayName) {
  const pattern = /(<title>[^<]*?)Skeleton Key([^<]*<\/title>)/i;
  if (!pattern.test(html)) return { html, replaced: false };
  return { html: html.replace(pattern, (_m, a, b) => a + displayName + b), replaced: true };
}

/** Builds the plain-text success message with the ordered next steps. */
export function nextSteps(name, displayName) {
  return [
    `Created apps/${name} (display name: ${displayName}).`,
    '',
    'Next steps:',
    `  1. cd apps/${name}`,
    '  2. npm install',
    '  3. npm run dev          start the dev server (axe logs violations in the console)',
    '  4. npm test             unit, property and axe tests; they must stay green',
    '  5. npm run test:e2e     Playwright and axe page tests',
    `  6. npm run acr -- apps/${name}   (from the repository root) write ACR.md`,
    '',
    'Then update the page titles and the "Skeleton Key" text in src/, and keep the accessibility tests passing.',
    '',
  ].join('\n');
}

/** Returns the lstat result for a path, or null when nothing exists there (a dangling link still counts as existing). */
async function lstatOrNull(p) {
  try {
    return await fs.lstat(p);
  } catch (err) {
    if (err && err.code === 'ENOENT') return null;
    throw err;
  }
}

/** Runs one labelled step and prefixes any error with the label. */
async function step(label, fn) {
  try {
    return await fn();
  } catch (err) {
    const wrapped = new Error(`${label} failed: ${err && err.message ? err.message : err}`);
    wrapped.cause = err;
    throw wrapped;
  }
}

/** Creates apps/<name> from the skeleton in one final rename; on any failure removes only its own temporary folder. */
export async function createApp({
  name,
  rootDir = path.resolve(HERE, '..'),
  skeletonDir,
  log = () => {},
  warn = () => {},
}) {
  const check = validateName(name);
  if (!check.ok) throw new Error(check.reason);

  const skeleton = skeletonDir ?? path.join(rootDir, 'skeleton');
  if (!(await lstatOrNull(path.join(skeleton, 'package.json')))) {
    throw new Error(`skeleton not found: missing ${path.join(skeleton, 'package.json')}`);
  }

  const appsDir = path.join(rootDir, 'apps');
  const destination = path.resolve(appsDir, name);
  if (path.dirname(destination) !== path.resolve(appsDir)) {
    throw new Error(`destination ${destination} is not a direct child of ${appsDir}`);
  }
  const refuse = () => new Error(`Refusing to overwrite apps/${name}: it already exists (${destination}).`);
  if (await lstatOrNull(destination)) throw refuse();

  await step('creating apps/', () => fs.mkdir(appsDir, { recursive: true }));
  const tmp = path.join(appsDir, `.${name}.tmp-${process.pid}`);
  await step('creating the temporary folder', () => fs.mkdir(tmp));

  try {
    await step('copying skeleton/', () =>
      fs.cp(skeleton, tmp, {
        recursive: true,
        verbatimSymlinks: true,
        filter: async (src) => {
          const rel = path.relative(skeleton, src);
          if (!shouldCopy(rel, true)) return false;
          const info = await fs.lstat(src);
          if (info.isSymbolicLink()) {
            warn(`skipped symbolic link ${rel.split(path.sep).join('/')}`);
            return false;
          }
          return true;
        },
      }),
    );

    await step('editing package.json', async () => {
      const file = path.join(tmp, 'package.json');
      await fs.writeFile(file, renameInPackageJson(await fs.readFile(file, 'utf8'), name));
    });

    await step('editing package-lock.json', async () => {
      const file = path.join(tmp, 'package-lock.json');
      if (!(await lstatOrNull(file))) return;
      await fs.writeFile(file, renameInPackageLock(await fs.readFile(file, 'utf8'), name));
    });

    await step('editing index.html', async () => {
      const file = path.join(tmp, 'index.html');
      if (!(await lstatOrNull(file))) {
        warn('index.html not found; no title was renamed');
        return;
      }
      const result = renameInIndexHtml(await fs.readFile(file, 'utf8'), toDisplayName(name));
      if (!result.replaced) {
        warn('index.html has no <title> containing "Skeleton Key"; update the title by hand');
        return;
      }
      await fs.writeFile(file, result.html);
    });

    await step('moving the finished copy into place', async () => {
      if (await lstatOrNull(destination)) throw refuse();
      await fs.rename(tmp, destination);
    });
  } catch (err) {
    try {
      await fs.rm(tmp, { recursive: true, force: true, maxRetries: 3 });
    } catch (cleanupErr) {
      warn(`could not remove temporary folder ${tmp}: ${cleanupErr.message}`);
    }
    throw err;
  }

  log(nextSteps(name, toDisplayName(name)));
  return { destination };
}

/** Parses arguments, runs createApp, prints to stdout/stderr and returns the exit code. */
export async function main(argv, rootDir) {
  const args = argv ?? [];
  if (args.length !== 1 || args[0].startsWith('-')) {
    process.stderr.write(`error: ${args.length === 0 ? 'missing app name' : 'expected exactly one app name and no flags'}\n${USAGE}\n`);
    return 1;
  }
  try {
    await createApp({
      name: args[0],
      rootDir,
      log: (text) => process.stdout.write(text.endsWith('\n') ? text : text + '\n'),
      warn: (text) => process.stderr.write(`warning: ${text}\n`),
    });
    return 0;
  } catch (err) {
    process.stderr.write(`error: ${err.message}\n`);
    return 1;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  process.exitCode = await main(process.argv.slice(2));
}
