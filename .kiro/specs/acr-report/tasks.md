# Accessibility Conformance Report Generator: Implementation Tasks

Paths are relative to the repository root unless stated. Mark a task `[x]` only after its checks pass. Order matters: the catalogue and the decision function come first because every later task depends on them, and the `skeleton/` evidence changes come before the first real report.

## 1. Catalogue and decision rules

- [x] 1. Build the criteria catalogue and the decision function
  - [x] 1.1 Create the root `package.json` if it does not exist (`name` `skeleton-key`, `private`, `type` `module`) and add the scripts `acr` (`node scripts/acr.mjs`) and `test:scripts` (`node --test scripts/acr/tests/`). Keep any scripts already there. *(REQ-1.2, 1.10, 1.11)*
  - [x] 1.2 Create `scripts/acr/criteria.mjs` with the 55 WCAG 2.2 Level A and AA criteria in numeric order, each with id, name, level, principle, tier and human-only flag with a note. Leave out 4.1.1 and all AAA criteria. *(REQ-2.1 to 2.4, 2.6)*
  - [x] 1.3 Review the tier and human-only assignments in `design.md` against `.kiro/agents/prompts/trusted-tester.md` and fix the table if an assignment is wrong. Record any change in `design.md`. *(REQ-2.3, 2.4)*
  - [x] 1.4 Create `scripts/acr/decide.mjs` with the pure `decide()` function from the design. *(REQ-5.1 to 5.10)*
  - [x] 1.5 Create `scripts/acr/tests/criteria.test.mjs` and `scripts/acr/tests/decide.test.mjs`: the catalogue checks, one example per rule, and the exhaustive 432-combination invariant test. *(REQ-12.2 to 12.4)*
  - [x] 1.6 Run `npm run test:scripts`; all tests pass.

## 2. Reading evidence

- [x] 2. Parse the evidence files into evidence items
  - [x] 2.1 Create `scripts/acr/io.mjs`: `resolveAppDir` (exists, has `package.json`, inside the repository root, `realpath` check), `readJsonCapped` (50 MB cap, `JSON.parse` only) and `writeAtomic`. *(REQ-1.6, 10.1 to 10.5)*
  - [x] 2.2 Create `scripts/acr/evidence.mjs`: read `evidence/vitest.json`, `evidence/playwright.json` and `evidence/axe/*.json`; skip skipped tests; classify `flaky` as inconclusive; report unreadable files as warnings. *(REQ-3.1 to 3.7, 3.9)*
  - [x] 2.3 In the same module, map evidence to criteria: the `[SC ...]` title tag (with a warning for an unknown entry) and the `wcag<digits>` axe tag. Ignore level tags, best-practice tags and `inapplicable` rules. Add the stale-evidence check. *(REQ-3.8, 4.1 to 4.7)*
  - [x] 2.4 Create `scripts/acr/review.mjs` for the Trusted Tester review lines (severity, criterion segment, status, open flag, unmapped count). *(REQ-6.1 to 6.4)*
  - [x] 2.5 Create `scripts/acr/config.mjs` that reads and validates `acr.config.json` (only `Not Applicable` and `Not Evaluated`, reason required, known criterion). *(REQ-7.1, 7.2, 7.6)*
  - [x] 2.6 Add fixtures under `scripts/acr/tests/fixtures/` and tests `evidence.test.mjs`, `review.test.mjs`, `config.test.mjs` for every case in REQ-12.5 and REQ-12.6. Include one test that parses the checked-in `docs/trusted-tester-review-skeleton.md`. *(REQ-12.5, 12.6)*
  - [x] 2.7 Run `npm run test:scripts`; all tests pass.

## 3. Rendering and the command

- [x] 3. Render the report and wire the command line
  - [x] 3.1 Create `scripts/acr/render.mjs` with `cell()` (escape, strip, truncate), the remark builders for each Level, and `renderReport()` with the header, disclaimer, notices, evaluation methods, terms, summary, the two tables and the evidence summary. Export `GENERATOR_VERSION`. *(REQ-8.1 to 8.12, 9.1 to 9.8)*
  - [x] 3.2 Merge the override and finding text into remarks as REQ-5.9, 6.5, 7.3, 7.4 and 7.5 require, and warn when an override is ignored. *(REQ-5.9, 6.5, 6.7, 7.3 to 7.5)*
  - [x] 3.3 Create `scripts/acr.mjs`: parse the arguments (`--date`, unknown flags, no folder), process each folder, print the one-line summary and every warning, set the exit code. Handle the no-evidence case with the notice and warning. *(REQ-1.1 to 1.9, 3.4, 3.2)*
  - [x] 3.4 Add `render.test.mjs` (escaping with `|`, newline, backtick and `<script>`; truncation; ordering; remark templates), `cli.test.mjs` (every error case in REQ-12.9; temporary working copies under the OS temp folder, removed after each test), `write.test.mjs` (failed write keeps the old report; no temporary file left; no other file changed; idempotent) and `document.test.mjs` (header fields, disclaimer before Table 1, 31 and 24 rows, valid Levels, non-empty remarks, forbidden words). *(REQ-12.7, 12.9 to 12.12)*
  - [x] 3.5 Add the golden-file test: a fixture folder with Playwright, Vitest and axe files, a review and a config, and the expected `ACR.md`. Check the expected file by reading it, not only by copying the output. *(REQ-12.8)*
  - [x] 3.6 Run `npm run test:scripts`; all tests pass.

## 4. Evidence output in `skeleton/`

- [x] 4. Make the skeleton's test runs write machine evidence
  - [x] 4.1 In `skeleton/vite.config.ts` add the `json` reporter and `outputFile` for `evidence/vitest.json`. Run `npm test` in `skeleton/` and confirm the file exists and the existing tests still pass. *(REQ-11.1, 11.9)*
  - [x] 4.2 In `skeleton/playwright.config.ts` add the `json` reporter for `evidence/playwright.json` and the `globalSetup`. Create `skeleton/tests/e2e/support/global-setup.ts`. *(REQ-11.2, 11.3, 11.5)*
  - [x] 4.3 Create `skeleton/tests/e2e/support/axe.ts` with `scanPage()` writing the scan file (schema in `design.md`) before returning. *(REQ-11.4)*
  - [x] 4.4 Change the axe tests in `skeleton/tests/e2e/*.spec.ts` to call `scanPage()`; keep the assertion of zero violations. *(REQ-11.6)*
  - [x] 4.5 Add `evidence/` to `skeleton/.gitignore`. *(REQ-11.8)*
  - [x] 4.6 Run `npm run lint`, `npx tsc --noEmit`, `npm test` and `npm run test:e2e` in `skeleton/`. Confirm `evidence/vitest.json`, `evidence/playwright.json` and `evidence/axe/*.json` exist. Run `npx playwright install chromium` first if the browser is missing.

## 5. Tag tests and generate the skeleton report

- [x] 5. Tag criterion tests and produce `skeleton/ACR.md`
  - [x] 5.1 List every test in `skeleton/tests/` and, for each, read its assertions and decide which single criteria it verifies (if any). *(REQ-11.7)*
  - [x] 5.2 Add `[SC ...]` tags to the titles of tests whose assertions back the criterion. Do not tag axe-scan-only tests. Do not change what any test asserts. *(REQ-11.7)*
  - [x] 5.3 Re-run `npm test` and `npm run test:e2e` in `skeleton/`; the test counts match the counts before tagging (REQ-11.9).
  - [x] 5.4 Run `npm run acr -- skeleton`. Read the whole `skeleton/ACR.md` and check: each `Supports` row cites evidence that really backs it; the open findings from `docs/trusted-tester-review-skeleton.md` appear; human-only rows are `Not Evaluated`; the disclaimer is present. Fix the generator or the tags, not the report text, if something is wrong. *(REQ-5, 8, 9, 13.3)*
  - [x] 5.5 Run the generator a second time with the same `--date` and confirm `skeleton/ACR.md` does not change. *(REQ-9.8)*

## 6. Documentation

- [x] 6. Document the generator
  - [x] 6.1 Write `docs/acr-report.md`: the command order, the evidence locations, the SC tag convention, the rating rules, `acr.config.json` and how to add evidence for a criterion. *(REQ-13.2)*
  - [x] 6.2 Add the short section to the root `README.md` and `skeleton/README.md`, including the "not a legal certification" statement and the scripts table row for `npm run acr`. *(REQ-13.1)*
  - [x] 6.3 Add a one-line note in the `new-app-script` spec's design (if that spec exists by now) or in `docs/acr-report.md` that `new-app` must not copy `ACR.md`, `evidence/` or `acr.config.json`. *(REQ-13.5)*

## 7. Final checks

- [x] 7. Verify everything and report
  - [x] 7.1 Run `npm run test:scripts` at the root; all tests pass.
  - [x] 7.2 In `skeleton/` run `npm run lint`, `npx tsc --noEmit`, `npm test` and `npm run test:e2e`; all pass.
  - [x] 7.3 Remove temporary files and folders created while working, and confirm `git status` lists only intended changes (the new generator, its tests and fixtures, the skeleton evidence changes, the tagged tests, docs, and `skeleton/ACR.md`).
  - [x] 7.4 Report tasks completed, test counts per folder, command results, and anything unfinished with the reason.
