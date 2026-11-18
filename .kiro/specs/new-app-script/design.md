# New-App Script: Design

Implements `requirements.md` in this folder. Paths are relative to the repository root.

## 1. Decisions

| Decision | Choice | Why |
| --- | --- | --- |
| Dependencies | None. Node built-ins only (`node:fs/promises`, `node:path`, `node:url`, `node:process`, `node:os` and `node:test` in tests). | The tech rule says no new dependency without a reason. `fs.cp` and `JSON.parse` are enough. *(REQ-1.1, 9.2)* |
| Files | One script, `scripts/new-app.mjs`. Tests in `scripts/new-app/tests/`. | The script is under 200 lines. A subfolder like `scripts/acr/` is only needed for the tests. |
| Copy method | `fs.cp(src, tmp, { recursive: true, filter, verbatimSymlinks: true })` with a filter that decides by path relative to `skeleton/`. | Built in since Node 16.7, handles hidden files, keeps file contents byte-identical. |
| Atomicity | Build in `apps/.<name>.tmp-<pid>`, then one `fs.rename` to `apps/<name>`. | A failed run leaves nothing. Same filesystem, so rename is atomic. *(REQ-7)* |
| Overwrite check | `fs.lstat` on the destination, before the copy and again before the rename. | `lstat` sees symbolic links and does not follow them. Two checks narrow the race window. `rename` on a POSIX system can replace an empty folder, so the second check matters. *(REQ-3)* |
| Root location | `path.resolve(dirname(fileURLToPath(import.meta.url)), '..')`, overridable only by the `rootDir` argument of the exported functions. | Same result from any working directory. The override lets tests use a fake root without an environment variable that a user could set by accident. *(REQ-1.3, 8.3)* |
| Name rule | `/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/`, max 50, plus a reserved list. | A subset of valid npm names that is safe as a path on every platform. No dots, slashes or scopes, so no traversal. *(REQ-2)* |
| Title edit | Regular expression on the `<title>` element only. | `index.html` is a fixed, small file we own. A parser would be a new dependency for one replacement. |
| `src/` titles | Not edited. Printed as a next step. | `document.title` strings are in React pages (`HomePage.tsx`, `AboutPage.tsx`, `NotFoundPage.tsx`) and a text replace in code can break it. The developer rewrites them anyway when they make the app. *(REQ-5.6)* |
| `ACR.md` | Excluded. | It describes the skeleton's test results. The new app generates its own with `npm run acr -- apps/<name>`. |
| `evidence/` | Excluded. | It is test output and is git-ignored in `skeleton/.gitignore`. The ACR generator reports "no evidence" until the app's tests run. |

## 2. Module shape

```
scripts/
  new-app.mjs                 CLI + exported functions
  new-app/
    tests/
      helpers.mjs             makeFakeRoot(), runCli(), cleanup
      name.test.mjs           REQ-2
      overwrite.test.mjs      REQ-3
      copy.test.mjs           REQ-4
      rename.test.mjs         REQ-5
      cli.test.mjs            REQ-1, REQ-6
      cleanup.test.mjs        REQ-7
      real-skeleton.test.mjs  REQ-8.10
```

`scripts/new-app.mjs` exports:

```js
export const NAME_RULE            // the regular expression
export const RESERVED_NAMES       // ['skeleton', 'node_modules']
export function validateName(name)           // returns { ok: true } or { ok: false, reason }
export function toDisplayName(name)          // 'my-app' -> 'My App'
export function shouldCopy(relPath, isTopLevel)  // the exclusion rules, pure
export function renameInPackageJson(text, name)
export function renameInPackageLock(text, name)
export function renameInIndexHtml(html, displayName) // returns { html, replaced }
export function nextSteps(name, displayName)         // returns string
export async function createApp({ name, rootDir, log, warn }) // returns { destination }
```

`main(argv)` parses arguments, calls `createApp`, prints, and returns an exit code. The file ends with a guard so it runs only when executed directly:

```js
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  process.exitCode = await main(process.argv.slice(2))
}
```

Each function has a one-line comment on what it guarantees *(REQ-9.3)*.

## 3. Flow of `createApp`

```
validateName(name)                       -> error, nothing written       (REQ-2)
skeleton = root/skeleton; check package.json exists                     (REQ-1.8)
dest = root/apps/<name>
assert dirname(dest) === root/apps                                      (REQ-2.4)
lstat(dest) exists?                      -> error, nothing written       (REQ-3.1, 3.2)
mkdir root/apps (recursive)                                             (REQ-3.3)
tmp = root/apps/.<name>.tmp-<pid>
try
  cp(skeleton, tmp, filter=shouldCopy)   // warns on symlinks            (REQ-4)
  edit tmp/package.json                                                 (REQ-5.1)
  edit tmp/package-lock.json if present                                 (REQ-5.2)
  edit tmp/index.html; warn if no match                                 (REQ-5.4, 5.5)
  lstat(dest) exists?                    -> error                       (REQ-3.2)
  rename(tmp, dest)                                                     (REQ-7.1)
catch
  rm(tmp, { recursive, force })          // only our own folder         (REQ-7.2)
  rethrow with step name                                                (REQ-1.7)
```

The "step name" is carried by a small `step(label, fn)` wrapper that adds `label` to the error message.

### Exclusion rules (`shouldCopy`)

The filter receives the path relative to `skeleton/`, split on `/` or `\`.

| Rule | Applies to |
| --- | --- |
| Skip any segment equal to `node_modules` | any depth |
| Skip the first segment when it is `dist`, `evidence`, `test-results`, `playwright-report` or `coverage` | top level only |
| Skip the file `ACR.md` | top level only |
| Skip names ending `.log` or `.tsbuildinfo`, and `.DS_Store` | any depth |
| Everything else is copied | |

Top level only for `dist` and the test outputs means a source folder named `dist` deeper in the tree (unlikely) is still copied. `tests/` is never excluded. `fs.cp` calls the filter for directories first, so returning `false` for a directory skips its whole subtree.

Symbolic links: `lstat` each entry in the filter. For a link, push a warning and return `false`.

### Renaming

- `renameInPackageJson`: `JSON.parse`, set `name`, `JSON.stringify(obj, null, 2) + '\n'`. Key order is kept because assigning an existing key does not move it.
- `renameInPackageLock`: set `lock.name`, and `lock.packages[''].name` when `packages['']` exists. Nothing else changes. The lockfile keeps its resolved dependency tree, so `npm install` in the new app is reproducible.
- `renameInIndexHtml`: `html.replace(/(<title>[^<]*?)Skeleton Key([^<]*<\/title>)/i, (_, a, b) => a + displayName + b)`. Returns `replaced: false` when it did not match. Only the first title is touched. The display name is `[A-Za-z0-9 ]`, so no escaping is needed.
- `toDisplayName('my-app')` splits on `-`, upper-cases the first letter of each part and joins with spaces.

A note on line endings: `skeleton/package.json` uses `\n`. The title edit does not touch line endings. The JSON writers use `\n`.

## 4. CLI behaviour

| Input | Result |
| --- | --- |
| `new-app` | usage on stderr, exit 1 |
| `new-app a b` or `new-app --x` | usage on stderr, exit 1 |
| `new-app Bad_Name` | error naming the rule and value, exit 1 |
| `new-app existing` | `Refusing to overwrite apps/existing: it already exists.` exit 1 |
| `new-app grimoire` | copy, rename, next steps, exit 0 |

Success output (stdout), plain text, no colour:

```
Created apps/grimoire (display name: Grimoire).

Next steps:
  1. cd apps/grimoire
  2. npm install
  3. npm run dev          start the dev server (axe logs violations in the console)
  4. npm test             unit, property and axe tests; they must stay green
  5. npm run test:e2e     Playwright and axe page tests
  6. npm run acr -- apps/grimoire   (from the repository root) write ACR.md

Then update the page titles and the "Skeleton Key" text in src/.
```

Warnings and errors go to stderr, one per line, prefixed `warning:` or `error:`.

## 5. Root `package.json`

```json
"scripts": {
  "acr": "node scripts/acr.mjs",
  "new-app": "node scripts/new-app.mjs",
  "test:scripts": "node --test \"scripts/acr/tests/*.test.mjs\" \"scripts/new-app/tests/*.test.mjs\""
}
```

`npm run new-app <name>` passes `<name>` to the script because npm appends extra arguments after the command (a flag would need `--`, and flags are rejected anyway). The existing `acr` entry is kept. The existing `test:scripts` glob is extended, not replaced.

`.gitignore` gets one line: `apps/.*.tmp-*` *(REQ-7.3)*.

## 6. Test strategy

Tests use `node:test` and `node:assert/strict`, to match `scripts/acr/tests/`.

**Helpers (`helpers.mjs`)**
- `makeFakeRoot({ withLock = true, title = 'Home — Skeleton Key' })` creates `os.tmpdir()/new-app-XXXX/` via `fs.mkdtemp`, copies `scripts/new-app.mjs` to `<root>/scripts/new-app.mjs`, and writes a fake `skeleton/` with: `package.json`, `package-lock.json`, `index.html`, `.gitignore`, `src/main.tsx`, `tests/unit/a.test.tsx`, `tests/unit/properties/b.property.test.ts`, `tests/e2e/c.spec.ts`, `vite.config.ts`, `playwright.config.ts`, plus junk to be excluded: `node_modules/x/index.js`, `src/node_modules/y.js`, `dist/a.js`, `evidence/vitest.json`, `test-results/r.json`, `playwright-report/i.html`, `coverage/c.json`, `ACR.md`, `debug.log`.
- `runCli(root, args)` runs `process.execPath <root>/scripts/new-app.mjs ...args` with `spawnSync`, `cwd` set to a different temp folder (to prove the working directory does not matter), and returns `{ status, stdout, stderr }`.
- `snapshot(dir)` returns a map of relative path to content hash, to prove "byte-for-byte unchanged".
- Each test makes its root in `before`/`beforeEach` and removes it in `after`/`afterEach` with `fs.rm(root, { recursive: true, force: true })`.

**Unit tests** call the exported pure functions directly: `validateName` (table-driven), `shouldCopy` (table-driven), the three rename functions, `nextSteps`.

**Integration tests** use `runCli` against a fake root: overwrite cases, copy rules, cleanup (make `skeleton/package.json` a folder or invalid JSON so the rename step throws, then check `apps/` is empty), argument errors.

**Real skeleton test** (`real-skeleton.test.mjs`): `createApp({ name: 'real-check', rootDir: fakeRoot })` where the fake root's `skeleton` is a symbolic link or, to stay portable, the test passes an explicit `skeletonDir` option pointing at the real `skeleton/`. The design adds an optional `skeletonDir` argument to `createApp` for this, defaulting to `<rootDir>/skeleton`. The test writes only to the temporary `apps/`.

**Symbolic link test**: create the link in a `try`; if `EPERM` (Windows without developer mode) call `t.skip('cannot create symlinks here')`.

**Failure injection**: no mocks. Make the real condition (unparseable JSON in the fake skeleton) so the real code path fails.

## 7. Accessibility angle

The script writes no UI. What it protects is that the accessibility tests and their configuration arrive in every new app unchanged: REQ-4.5 and REQ-5.7, tested by REQ-8.6 and REQ-8.10 (identical bytes for every file under `tests/`). The `[SC ...]` test-title tags are not edited, so the ACR generator keeps mapping tests to criteria. The next-steps output is plain text with no colour, so it works with a screen reader and in a narrow terminal.

## 8. Risks

| Risk | Mitigation |
| --- | --- |
| The skeleton's title changes from "Skeleton Key" and the replacement no longer matches | Warning (REQ-5.5) plus a test that fails if the real skeleton's `index.html` has no match (REQ-8.10) |
| Large `skeleton/` folder with `node_modules` slows the copy | The filter skips `node_modules` before descending |
| Antivirus or an open editor locks the temp folder on Windows | `fs.rm` uses `maxRetries: 3`; failure to clean up is printed as a warning with the folder path |
| Two runs for the same name at once | Temp folder includes the process id; the second `lstat` before the rename catches the loser |
| `page titles in src/` still say Skeleton Key | Printed as an explicit next step (REQ-6.2) |
