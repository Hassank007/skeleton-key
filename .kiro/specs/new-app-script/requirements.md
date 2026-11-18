# New-App Script: Requirements

This spec adds `scripts/new-app.mjs` and the root npm script `new-app`. Together they create a new app in `apps/<name>` from `skeleton/`, so nobody hand-copies the template (see the repository structure rule). Requirements use EARS notation.

**Scope.** The script, the root `package.json` script entries, and the tests for the script. Out of scope: changes to `skeleton/` itself, installing dependencies, git operations, creating Grimoire or Seance content, and rewriting the page titles that the skeleton's React pages set at runtime (see REQ-5.6).

**Terms.**
- *Skeleton*: the `skeleton/` folder at the repository root.
- *App name*: the `<name>` argument. It is the folder name under `apps/` and the npm package name.
- *Display name*: the app name turned into words for people, for example `my-app` becomes `My App`.
- *Test outputs*: folders and files that a test run produces: `evidence/`, `test-results/`, `playwright-report/`, `coverage/`.
- *Accessibility tests*: everything under `skeleton/tests/` (unit, property-based and Playwright tests with axe) and the test configuration in `vite.config.ts` and `playwright.config.ts`.

---

## REQ-1 Command line

**User story:** As a developer, I want one command that creates a new app, so that I start from the accessible skeleton without copying files by hand.

### Acceptance criteria

- 1.1 The system SHALL provide `scripts/new-app.mjs`, an ES module that runs on Node 20 or later and uses only Node built-in modules.
- 1.2 The system SHALL provide the root npm script `new-app` so that `npm run new-app <name>` runs the script with that name. The name is read from the first positional argument.
- 1.3 The script SHALL resolve `skeleton/` and `apps/` from the location of the script file, not from the current working directory, so that it behaves the same from any folder.
- 1.4 IF no name is given, THEN the script SHALL print a usage message to stderr and exit with code 1, and SHALL NOT create any file or folder.
- 1.5 IF more than one positional argument or any flag is given, THEN the script SHALL print the usage message and exit with code 1 without writing anything.
- 1.6 WHEN the script succeeds, THEN it SHALL exit with code 0.
- 1.7 IF any step fails after the script started writing, THEN the script SHALL remove what it wrote for this run, print an error that names the failed step, and exit with code 1.
- 1.8 IF `skeleton/` does not exist or has no `package.json`, THEN the script SHALL exit with code 1 with an error naming the missing path.

---

## REQ-2 Name validation

**User story:** As a developer, I want a bad name rejected before anything is written, so that I never get a broken package or a path outside `apps/`.

### Acceptance criteria

- 2.1 The script SHALL accept only names that match `^[a-z][a-z0-9]*(-[a-z0-9]+)*$` and are at most 50 characters long. This is a valid, lower-case npm package name that is also a safe folder name on Windows, macOS and Linux.
- 2.2 IF the name does not match, THEN the script SHALL exit with code 1 with an error that states the rule and shows the rejected value, and SHALL NOT write anything. Names with path separators, `..`, a leading dot, spaces, upper-case letters or a scope (`@x/y`) are rejected by this rule.
- 2.3 IF the name is `skeleton` or `node_modules`, THEN the script SHALL reject it with an error saying the name is reserved.
- 2.4 The script SHALL resolve the destination path and confirm it is a direct child of `apps/` before writing. IF it is not, THEN the script SHALL exit with code 1.

---

## REQ-3 Refusing to overwrite

**User story:** As a developer, I want the script to never replace work I already have, so that running it twice cannot destroy an app.

### Acceptance criteria

- 3.1 IF `apps/<name>` exists in any form (folder, empty folder, file or symbolic link), THEN the script SHALL exit with code 1 with an error naming the path, and SHALL NOT modify, delete or merge into it.
- 3.2 The script SHALL perform the existence check before it copies anything, and SHALL repeat the check immediately before it moves the finished copy into place.
- 3.3 IF `apps/` does not exist, THEN the script SHALL create it.
- 3.4 A refused run SHALL leave `apps/` exactly as it was, including no leftover temporary folder.

---

## REQ-4 What is copied

**User story:** As a developer, I want the new app to contain the template and the tests, and nothing generated, so that it is clean and its tests still protect accessibility.

### Acceptance criteria

- 4.1 The script SHALL copy the contents of `skeleton/` recursively to `apps/<name>`.
- 4.2 The script SHALL exclude `node_modules` at any depth, and `dist` and the test outputs (`evidence`, `test-results`, `playwright-report`, `coverage`) at the top level of `skeleton/`.
- 4.3 The script SHALL also exclude `ACR.md` (a generated report that describes the skeleton, not the new app), `*.log`, `*.tsbuildinfo` and `.DS_Store`.
- 4.4 The script SHALL copy everything else, including hidden files such as `.gitignore`, `package-lock.json`, `public/`, `src/`, the configuration files and `README.md`.
- 4.5 The script SHALL copy the accessibility tests unchanged: all of `tests/` (including `tests/unit/properties/` and `tests/e2e/`) and the test settings in `vite.config.ts`, `playwright.config.ts` and `eslint.config.js`. The script SHALL NOT delete, skip or edit any test file.
- 4.6 The script SHALL NOT follow symbolic links. IF the skeleton contains one, THEN the script SHALL skip it and print a warning naming it.
- 4.7 The script SHALL NOT change `skeleton/` in any way.

---

## REQ-5 Renaming

**User story:** As a developer, I want the copy to carry its own name, so that it does not clash with the skeleton and its page title is right.

### Acceptance criteria

- 5.1 The script SHALL set `name` in `apps/<name>/package.json` to the app name and keep every other field, including `scripts`, dependencies and `private`.
- 5.2 WHEN `apps/<name>/package-lock.json` exists, THEN the script SHALL set its top-level `name` and `packages[""].name` to the app name and change nothing else.
- 5.3 The script SHALL parse JSON with `JSON.parse` and write it back with two-space indentation and a trailing newline.
- 5.4 The script SHALL replace the text `Skeleton Key` inside the `<title>` element of `apps/<name>/index.html` with the display name, and keep the rest of the title and the rest of the file unchanged. The display name SHALL contain only letters, digits and spaces, so it needs no HTML escaping.
- 5.5 IF `index.html` has no `<title>` element containing `Skeleton Key`, THEN the script SHALL print a warning and continue. It SHALL still exit with code 0.
- 5.6 The script SHALL NOT edit files under `src/`. The skeleton's pages set `document.title` themselves, and the next steps SHALL tell the developer to update them (REQ-6.2).
- 5.7 The script SHALL NOT rename anything in `tests/`, so the test titles and their `[SC ...]` tags stay valid for the ACR generator.

---

## REQ-6 Output

**User story:** As a developer, I want to be told what to do next, so that I can start working without reading the docs.

### Acceptance criteria

- 6.1 WHEN the script succeeds, THEN it SHALL print to stdout the path of the new app, the display name, and these next steps in order: `cd apps/<name>`, `npm install`, `npm run dev`, `npm test`, `npm run test:e2e`, and `npm run acr -- apps/<name>` from the repository root.
- 6.2 The output SHALL also tell the developer to update the page titles and the "Skeleton Key" text in `src/`, and to keep the accessibility tests passing.
- 6.3 The script SHALL print warnings (REQ-4.6, 5.5) to stderr, and errors to stderr.
- 6.4 The output SHALL be plain text and SHALL NOT depend on colour or on cursor control.

---

## REQ-7 Atomic creation

**User story:** As a developer, I want a failed run to leave nothing behind, so that I can fix the problem and run it again.

### Acceptance criteria

- 7.1 The script SHALL build the new app in a temporary folder inside `apps/` (named `.<name>.tmp-<process id>`) and move it to `apps/<name>` with a single rename as the last write.
- 7.2 IF any step fails, THEN the script SHALL remove the temporary folder, and SHALL NOT remove anything it did not create.
- 7.3 `.gitignore` at the repository root SHALL ignore `apps/.*.tmp-*`, so that an interrupted run cannot be committed by accident.

---

## REQ-8 Tests for the script

**User story:** As a maintainer, I want automated tests for the script, so that a change to `skeleton/` or to the script cannot silently break app creation.

### Acceptance criteria

- 8.1 The system SHALL provide tests in `scripts/new-app/tests/` that run with `node --test` and use only Node built-in modules.
- 8.2 The root npm script `test:scripts` SHALL run these tests together with the existing ACR generator tests, and SHALL keep the existing ones running.
- 8.3 Every test SHALL work in a temporary folder under the operating system's temp directory, with a fake repository root that holds a small fake `skeleton/` and a copy of `scripts/new-app.mjs`. Tests SHALL remove the temporary folder afterwards, and SHALL NOT write into the real `apps/` or `skeleton/`.
- 8.4 The tests SHALL cover name validation: every accepted and rejected shape in REQ-2, including `../x`, `a/b`, `.hidden`, `Upper`, `@s/p`, `a--b`, a trailing hyphen, an empty string, 51 characters, `skeleton` and `node_modules`.
- 8.5 The tests SHALL cover refusal to overwrite (REQ-3): an existing non-empty folder, an existing empty folder, an existing file, and an existing symbolic link (skipped with a stated reason on systems where the test user cannot create one). In each case the existing content SHALL be byte-for-byte unchanged and no temporary folder SHALL remain.
- 8.6 The tests SHALL cover the copy rules (REQ-4): excluded names are absent at the right depths, `node_modules` is excluded when nested, hidden files and `tests/` files are present and identical to the source, and `skeleton/` is unchanged afterwards.
- 8.7 The tests SHALL cover renaming (REQ-5): `package.json` and `package-lock.json` names, other fields untouched, the title replacement, the warning when the title has no `Skeleton Key`, and the formatting (two spaces, trailing newline).
- 8.8 The tests SHALL cover the output and exit codes (REQ-1, REQ-6): missing name, extra argument, unknown flag, success output with each next step, and warnings on stderr.
- 8.9 The tests SHALL cover failure cleanup (REQ-7): when a copy step fails (for example an unreadable `package.json` in the fake skeleton), no `apps/<name>` and no temporary folder remain.
- 8.10 One test SHALL run the real script on the real `skeleton/` into a fake root's `apps/` (reading the real skeleton, writing only to the temporary folder) and check that the result has `tests/unit/`, `tests/e2e/`, the right package name and title, and no `node_modules`, `dist`, `evidence`, `test-results` or `ACR.md`.
- 8.11 The tests SHALL run on Windows, macOS and Linux and SHALL NOT depend on the current working directory.

---

## REQ-9 Documentation and conventions

### Acceptance criteria

- 9.1 The root `README.md` SHALL document `npm run new-app <name>` in one short section that links to this spec. IF the README does not have a place for it, THEN the section SHALL be added near the repository structure.
- 9.2 The system SHALL NOT add a runtime or development dependency. The design document records this.
- 9.3 The script SHALL be a small number of named, exported functions with a one-line comment on what each guarantees, and SHALL run `main()` only when executed directly, so tests can import it.
