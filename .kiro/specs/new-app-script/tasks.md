# New-App Script: Implementation Tasks

Paths are relative to the repository root. Mark a task `[x]` only after its checks pass. Pure functions and their tests come first, then the file operations, then the command line and the real-skeleton test.

## 1. Pure functions

- [x] 1. Name rules, exclusion rules and text edits
  - [x] 1.1 Create `scripts/new-app.mjs` with `NAME_RULE`, `RESERVED_NAMES`, `validateName`, `toDisplayName` and `shouldCopy`. Each has a one-line comment. *(REQ-2.1 to 2.3, 4.2, 4.3, 9.3)*
  - [x] 1.2 Add `renameInPackageJson`, `renameInPackageLock`, `renameInIndexHtml` and `nextSteps`. *(REQ-5.1 to 5.5, 6.1, 6.2)*
  - [x] 1.3 Add `scripts/new-app/tests/helpers.mjs` (`makeFakeRoot`, `runCli`, `snapshot`). *(REQ-8.3)*
  - [x] 1.4 Add `scripts/new-app/tests/name.test.mjs` and `rename.test.mjs` for every case in REQ-8.4 and REQ-8.7 that does not need the file system. *(REQ-8.4, 8.7)*
  - [x] 1.5 Update the root `package.json`: add `new-app` and extend `test:scripts` to include `scripts/new-app/tests/*.test.mjs`. Keep `acr`. *(REQ-1.2, 8.2)*
  - [x] 1.6 Run `npm run test:scripts`; all tests pass, including the existing ACR tests.

## 2. Creating the app

- [x] 2. Copy, rename and refuse to overwrite
  - [x] 2.1 Add `createApp` with the flow in `design.md` section 3: validate, check the destination with `lstat`, build in `apps/.<name>.tmp-<pid>`, copy with the filter, edit the three files, check again, rename. Include the optional `skeletonDir` argument. *(REQ-3, 4, 5, 7.1)*
  - [x] 2.2 Handle failure: wrap each step with its label, remove only the temporary folder, rethrow. Skip symbolic links with a warning. *(REQ-1.7, 4.6, 7.2)*
  - [x] 2.3 Add `.gitignore` line `apps/.*.tmp-*`. *(REQ-7.3)*
  - [x] 2.4 Add `overwrite.test.mjs` (non-empty folder, empty folder, file, symbolic link; content unchanged; no temporary folder). *(REQ-8.5)*
  - [x] 2.5 Add `copy.test.mjs` (exclusions at the right depths, hidden files and `tests/` identical, `skeleton/` unchanged, symbolic link skipped with a warning). *(REQ-8.6)*
  - [x] 2.6 Add `cleanup.test.mjs` (a real failing step leaves no `apps/<name>` and no temporary folder). *(REQ-8.9)*
  - [x] 2.7 Run `npm run test:scripts`; all tests pass.

## 3. Command line

- [x] 3. Wire `main()` and the output
  - [x] 3.1 Add `main(argv)`: argument rules, error and warning output on stderr, next steps on stdout, exit codes, and the run-only-when-executed-directly guard. *(REQ-1.1 to 1.8, 6.1 to 6.4, 9.3)*
  - [x] 3.2 Add `cli.test.mjs`: missing name, extra argument, unknown flag, bad name, success output with every next step, warnings on stderr, and a run from a different working directory. *(REQ-8.8, 8.11)*
  - [x] 3.3 Add `real-skeleton.test.mjs`: run `createApp` against the real `skeleton/` with a temporary `apps/`, and check the result as REQ-8.10 lists. *(REQ-8.10)*
  - [x] 3.4 Run `npm run test:scripts`; all tests pass.

## 4. Documentation and final checks

- [x] 4. Document and verify
  - [x] 4.1 Add the short `npm run new-app <name>` section to the root `README.md` with a link to this spec. *(REQ-9.1)*
  - [x] 4.2 Confirm `git status` shows no change under `skeleton/`, no `apps/<name>` folder left behind, and no new entry in any `package.json` dependency list. *(REQ-4.7, 9.2)*
  - [x] 4.3 Run `npm run test:scripts`. Then run `npm run lint`, `npx tsc --noEmit` and `npm test` in `skeleton/` (unchanged, so they must still pass), and `npx playwright test` in `skeleton/` where Playwright browsers are installed. Record the counts.
  - [x] 4.4 Do one manual run: `npm run new-app demo-check`, then `cd apps/demo-check`, `npm install`, `npm test` and `npm run lint`; confirm they pass, then delete `apps/demo-check`. Record the result.
