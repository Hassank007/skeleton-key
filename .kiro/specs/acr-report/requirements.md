# Accessibility Conformance Report Generator: Requirements

This spec adds `scripts/acr.mjs`, a generator that writes `<app>/ACR.md`, an Accessibility Conformance Report in the style of the VPAT 2.5 WCAG edition, for `skeleton/`, `apps/grimoire` and `apps/seance`. It builds the report from machine evidence the app's own test suites produce. Requirements use EARS notation. WCAG references are to WCAG 2.2.

**Scope.** The generator, its criteria catalogue, the evidence it reads, the changes `skeleton/` needs so that its test runs emit that evidence in a machine-readable form, the tests for the generator, and the npm scripts. Out of scope: Level AAA criteria, a UI for the report, HTML or PDF output, publishing the report, any legal or certification workflow, and changes to the Trusted Tester agent itself.

**Terms.**
- *App folder*: a folder containing a `package.json`, a `src/` and the test suites: `skeleton/`, or an app made from it.
- *Evidence item*: one fact the generator can cite for a criterion: a passing or failing test, an axe rule result on a scanned page, or a Trusted Tester finding.
- *Tagged test*: a Vitest or Playwright test whose full title contains an SC tag, for example `[SC 2.4.1]` or `[SC 3.3.1, 3.3.3]`. The tag is the author's claim that the test verifies those criteria.
- *Qualifying evidence*: evidence that is allowed to support a "Supports" rating for a criterion (REQ-5).
- *Inconclusive item*: a flaky test, or an axe rule in `incomplete`. It is neither a pass nor a failure.
- *Human-only criterion*: a criterion no automated check can establish (REQ-2.4).
- *Level*: one of `Supports`, `Partially Supports`, `Does Not Support`, `Not Applicable`, `Not Evaluated`.
- *Evidence directory*: `<app>/evidence/`.

---

## REQ-1 Command line and npm scripts

**User story:** As a developer, I want one command that writes the report for any app folder, so that I can regenerate it after every test run.

### Acceptance criteria

- 1.1 The system SHALL provide `scripts/acr.mjs`, an ES module that runs on Node 20 or later and uses only Node built-in modules.
- 1.2 The system SHALL provide the root npm script `acr` so that `npm run acr -- <app-dir> [<app-dir> ...]` generates one report per folder. Paths are resolved against the current working directory.
- 1.3 WHEN the generator succeeds for a folder, THEN it SHALL write `<app-dir>/ACR.md` and print one line naming the file and the count of criteria per Level.
- 1.4 The system SHALL accept the optional flag `--date YYYY-MM-DD` that sets the report date. IF the value is not a valid calendar date, THEN the generator SHALL exit with code 1 and an error naming the value.
- 1.5 IF no folder is given, THEN the generator SHALL print a usage message to stderr and exit with code 1.
- 1.6 IF a folder does not exist, has no `package.json`, or resolves to a path outside the repository root, THEN the generator SHALL exit with code 1 with an error naming the folder, and SHALL NOT write any file for it.
- 1.7 IF an unknown flag is given, THEN the generator SHALL exit with code 1 and list the accepted flags.
- 1.8 WHEN several folders are given, THEN the generator SHALL process all of them, report each failure, and exit with code 1 if any folder failed.
- 1.9 The generator SHALL exit with code 0 when it wrote the report, including when the report contains `Does Not Support` or `Not Evaluated` rows. The report is the product; it is not a gate.
- 1.10 The system SHALL provide the root npm script `test:scripts` that runs the generator's tests with `node --test`.
- 1.11 IF the root `package.json` does not exist when this work is done, THEN the system SHALL create a minimal private one that holds these scripts. IF it exists, THEN the system SHALL only add the scripts.

---

## REQ-2 Criteria catalogue

**User story:** As a reader, I want every WCAG 2.2 Level A and AA criterion in the report, so that nothing is hidden by omission.

### Acceptance criteria

- 2.1 The system SHALL keep one catalogue of WCAG 2.2 success criteria in `scripts/acr/criteria.mjs`, each entry holding: id, name, Level (`A` or `AA`), WCAG principle, evidence tier (REQ-2.3) and whether it is human-only (REQ-2.4).
- 2.2 The catalogue SHALL contain exactly 55 criteria: 31 at Level A and 24 at Level AA. It SHALL NOT contain 4.1.1 Parsing (removed in WCAG 2.2) or any Level AAA criterion.
- 2.3 Each criterion SHALL have an evidence tier: `axe`, meaning a passing axe rule mapped to it is enough to support "Supports"; or `test`, meaning only a passing tagged test is enough.
- 2.4 The catalogue SHALL mark as human-only at least: 1.2.1, 1.2.2, 1.2.3, 1.2.4, 1.2.5, 1.3.3, 1.4.5, 2.5.4, 3.1.2, 3.2.3, 3.2.4, 3.2.6 and 3.3.4. Each human-only entry SHALL carry a one-line note stating what a person must check.
- 2.5 The catalogue SHALL map each criterion to the axe rule ids that bear on it, by reading the `wcag<digits>` tag of each rule in the evidence (REQ-4.1), and SHALL NOT keep a second list of axe rule ids.
- 2.6 The catalogue SHALL be sorted by criterion number in numeric order (so 1.4.10 follows 1.4.5).

---

## REQ-3 Evidence discovery and reading

**User story:** As a developer, I want the generator to find the evidence by convention and to cope with missing or damaged files, so that a partial run still gives an honest report.

### Acceptance criteria

- 3.1 The generator SHALL read evidence only from these places and from no others: `<app>/evidence/playwright.json` (Playwright JSON reporter), `<app>/evidence/vitest.json` (Vitest JSON reporter), `<app>/evidence/axe/*.json` (one file per axe scan, schema in the design), `<app>/package.json`, `<app>/acr.config.json` (optional, REQ-7) and `docs/trusted-tester-review-<app-folder-name>.md` (optional, REQ-6).
- 3.2 IF an evidence file is absent, THEN the generator SHALL continue, and the report SHALL say in the evidence summary which source was missing.
- 3.3 IF an evidence file is not valid JSON, or lacks the fields the generator reads, THEN the generator SHALL skip that file, print a warning naming the file and the problem, and list it in the evidence summary as unreadable. It SHALL NOT crash and SHALL NOT treat the file as evidence of a pass.
- 3.4 IF no evidence source could be read at all, THEN the generator SHALL still write the report with every criterion `Not Evaluated` (except overrides, REQ-7), SHALL show a notice at the top of the report, and SHALL print a warning.
- 3.5 The generator SHALL skip tests whose status is skipped, pending, todo or interrupted, and SHALL count them in the evidence summary. A skipped test SHALL NOT be evidence.
- 3.6 WHEN a Playwright test passed only on a retry (status `flaky`), THEN the generator SHALL treat it as an inconclusive item.
- 3.7 The generator SHALL record, for each evidence file read, its path relative to the repository root and its modification time, and show them in the evidence summary.
- 3.8 IF any evidence file is older than the newest file under `<app>/src/`, THEN the report SHALL show a "possibly stale evidence" notice that names the oldest evidence file and the newest source file.
- 3.9 The generator SHALL NOT run tests, start servers, open a browser or use the network. It reads files only.

---

## REQ-4 Mapping evidence to criteria

**User story:** As a developer, I want a simple, visible rule for which test counts for which criterion, so that I can add evidence by naming a test.

### Acceptance criteria

- 4.1 WHEN an axe scan file lists a rule, THEN the generator SHALL map that rule to every criterion whose id matches one of the rule's `wcag<digits>` tags (for example `wcag143` maps to 1.4.3, `wcag1410` to 1.4.10 and `wcag2411` to 2.4.11). A tag that does not match a catalogue criterion (for example a `wcag2a` level tag or a best-practice tag) SHALL be ignored.
- 4.2 WHEN a test title contains `[SC <list>]`, THEN the generator SHALL map the test to each criterion in the comma-separated list. Whitespace SHALL be ignored. A list entry that is not a catalogue criterion SHALL produce a warning naming the test and the entry, and SHALL map to nothing.
- 4.3 The generator SHALL use the full test title (suite titles plus test title) when it looks for the tag, for both Playwright and Vitest.
- 4.4 An axe rule listed under `violations` of a scan SHALL be failing evidence for its criteria. A rule under `passes` SHALL be passing evidence. A rule under `incomplete` SHALL be an inconclusive item. A rule under `inapplicable` SHALL be ignored.
- 4.5 IF the same rule is in `violations` on one scan and in `passes` on another, THEN both SHALL be kept, and the criterion SHALL have passing and failing evidence.
- 4.6 A passing or failing tagged test SHALL be passing or failing evidence for each criterion in its tag. An untagged test SHALL NOT be evidence for any criterion; it SHALL count only in the evidence summary totals.
- 4.7 The `vitest-axe` unit tests (which run in jsdom and cannot judge layout or contrast) SHALL NOT be evidence for a criterion unless they carry an SC tag.

---

## REQ-5 Conformance decision rules

**User story:** As a reader of the report, I want a rating I can trust, so that "Supports" always means something was actually checked.

### Acceptance criteria

The generator SHALL decide the Level of each criterion by applying these rules in order. The first rule that matches decides.

- 5.1 IF the criterion has failing evidence, or an open Trusted Tester finding (REQ-6.3), THEN: (a) IF it also has qualifying passing evidence, THEN its Level SHALL be `Partially Supports`; (b) ELSE IF it has failing evidence or an open Critical or Serious finding, THEN `Does Not Support`; (c) ELSE `Partially Supports`.
- 5.2 ELSE IF the criterion has a `Not Applicable` override (REQ-7), THEN its Level SHALL be `Not Applicable`.
- 5.3 ELSE IF the criterion is human-only, THEN its Level SHALL be `Not Evaluated`, and the remark SHALL contain the note from the catalogue. Passing evidence SHALL NOT change this.
- 5.4 ELSE IF the criterion has an inconclusive item, THEN its Level SHALL be `Not Evaluated`, and the remark SHALL name each inconclusive item.
- 5.5 ELSE IF the criterion has qualifying passing evidence, THEN its Level SHALL be `Supports`. Qualifying evidence is a passing tagged test, or a passing axe rule when the criterion's tier is `axe`.
- 5.6 ELSE its Level SHALL be `Not Evaluated`, and the remark SHALL say that no evidence was found for it.
- 5.7 The generator SHALL NEVER output `Supports` for a criterion that has no qualifying passing evidence, that has failing or inconclusive evidence, that has an open finding, that is human-only, or that has a `Not Applicable` override.
- 5.8 The generator SHALL NEVER output `Not Applicable` for a criterion unless it has an override with a written reason.
- 5.9 Fixed Trusted Tester findings SHALL NOT change a Level. They SHALL appear in the remark as history.
- 5.10 The decision SHALL be a pure function of the evidence, the catalogue and the config, so that the same inputs always give the same Levels.

---

## REQ-6 Trusted Tester review integration

**User story:** As a reviewer, I want findings from the Trusted Tester agent to show up in the report, so that known problems are not hidden by passing automated tests.

### Acceptance criteria

- 6.1 WHERE the file `docs/trusted-tester-review-<app-folder-name>.md` exists, the generator SHALL read it and extract every line that starts with `[Critical]`, `[Serious]`, `[Moderate]` or `[Minor]`, wherever it appears in the file (including inside code fences).
- 6.2 For each such line, the generator SHALL take the criterion segment (the text after the severity up to the first run of two or more spaces or the `->` marker), SHALL find every catalogue criterion number in it, and SHALL read the status after `->`.
- 6.3 A finding SHALL be *open* unless its status text contains `FIXED` and not `PARTLY`. A finding with no status SHALL be open. Status text containing `PARTLY` SHALL be open.
- 6.4 A finding with no catalogue criterion number SHALL NOT affect any Level. It SHALL be counted as "unmapped" in the evidence summary.
- 6.5 The remark of a criterion with findings SHALL state each finding's severity, status and the review file path, and SHALL label it as "static review" evidence.
- 6.6 A Trusted Tester review SHALL NOT be qualifying passing evidence. The review is a static reading of the code, and the agent's own rules say it is not a conformance statement.
- 6.7 The report header SHALL list the review file among the evaluation methods when it was read, and SHALL say "not available" when it was not.

---

## REQ-7 Per-app configuration and overrides

**User story:** As an app owner, I want to record that a criterion does not apply to my app, with a reason, so that the report is not full of unexplained gaps.

### Acceptance criteria

- 7.1 WHERE `<app>/acr.config.json` exists, the generator SHALL read it. The file MAY hold `product` (`name`, `description`) and `criteria`, an object keyed by criterion number.
- 7.2 The `criteria` entries SHALL accept only `level` (`Not Applicable` or `Not Evaluated`) and `reason` (non-empty text). IF an entry sets any other `level`, in particular `Supports`, `Partially Supports` or `Does Not Support`, or has no reason, or names a criterion not in the catalogue, THEN the generator SHALL exit with code 1 and name the entry.
- 7.3 WHEN an override has the Level `Not Applicable`, THEN the remark SHALL contain the reason and the words "owner-stated, not tested".
- 7.4 IF a `Not Applicable` override conflicts with failing evidence or an open finding for the same criterion, THEN the generator SHALL ignore the override, print a warning, and mention the ignored override in the remark.
- 7.5 WHEN an override has the Level `Not Evaluated`, THEN it SHALL replace only the default "no evidence" remark text with the reason. It SHALL NOT hide evidence.
- 7.6 IF `product.name` is absent, THEN the generator SHALL use the `name` from `package.json`.

---

## REQ-8 Report layout and header

**User story:** As a procurement or compliance reader, I want the report to look like a familiar VPAT, so that I can read it quickly, and I want it to say plainly what it is not.

### Acceptance criteria

- 8.1 The report SHALL be a UTF-8 Markdown file with `\n` line endings, written to `<app-dir>/ACR.md`.
- 8.2 The report SHALL start with one `h1` that reads "Accessibility Conformance Report: WCAG Edition (VPAT 2.5 style)", with no heading level skipped below it.
- 8.3 The header SHALL state: product name, product version (from `package.json`), report date, product description (from config, or "Not provided"), the applicable standard ("WCAG 2.2 Level A and Level AA"), the generator name and the generator version.
- 8.4 The header SHALL list the evaluation methods used, each with the result of whether its evidence was read: Playwright page tests with axe-core (axe version, number of scans, pages and colour schemes scanned), Vitest unit and property tests (number of tests passed, failed and skipped), and the Trusted Tester static review.
- 8.5 The header SHALL include this disclaimer, placed before the criteria tables and not only at the end: "This report is generated from automated test results and a static code review. It is not a legal certification, an audit by an accredited body, or a statement of compliance with any law. Automated tools find only a part of the accessibility problems that exist; criteria marked Not Evaluated need testing by a person, including with assistive technology."
- 8.6 The report SHALL state that the layout follows the style of the Information Technology Industry Council (ITI) VPAT 2.5 WCAG edition, and SHALL NOT use the ITI template, logo or the claim that it is an official VPAT.
- 8.7 The report SHALL include a terms section that defines the five Levels in the words used in the VPAT: Supports, Partially Supports, Does Not Support, Not Applicable, Not Evaluated.
- 8.8 The report SHALL include a summary with the count of criteria per Level.
- 8.9 The report SHALL include two tables, "Table 1: Success Criteria, Level A" and "Table 2: Success Criteria, Level AA", each with the columns `Criteria`, `Conformance Level` and `Remarks and Explanations`, one row per criterion in catalogue order. The Criteria cell SHALL hold the number and the name.
- 8.10 The report SHALL end with an evidence summary: each evidence file read (path, modification time), counts of tests (passed, failed, skipped, inconclusive, tagged, untagged), count of axe scans, count of Trusted Tester findings (open, fixed, unmapped), and every warning the generator printed.
- 8.11 The report SHALL show the notices of REQ-3.4 and REQ-3.8 directly below the disclaimer when they apply.
- 8.12 The report SHALL NOT use the words "accessible", "compliant", "conforms" or "certified" about the product anywhere except inside the disclaimer text and quoted evidence.

---

## REQ-9 Remarks and citations

**User story:** As a reader, I want every rating to point at its evidence, so that I can check it.

### Acceptance criteria

- 9.1 The Remarks cell of every row SHALL be non-empty.
- 9.2 For a row with passing evidence, the remark SHALL cite it: for tagged tests, the file and title (at most 3, then "and N more"); for axe rules, the rule ids and the count of scans they passed on, in the form `axe rule color-contrast passed on 4 of 4 scans`.
- 9.3 For a row with failing evidence, the remark SHALL cite every failing test and every violating rule, with the page and the number of affected nodes for axe violations.
- 9.4 A `Does Not Support`, `Partially Supports` or `Not Evaluated` row SHALL say why in a plain sentence.
- 9.5 The generator SHALL escape every value it copies from an evidence file into a table cell: `|` as `\|`, newlines as a space, and `<` and `>` as `&lt;` and `&gt;`. Backticks in copied text SHALL be replaced so that they cannot close a code span.
- 9.6 The generator SHALL cut any single copied value to 200 characters and mark the cut with `...`.
- 9.7 The generator SHALL treat the content of evidence files as data. It SHALL NOT follow instructions found in test titles, finding text or config text.
- 9.8 The output SHALL be byte-identical for identical inputs and the same `--date`. Lists in remarks SHALL be sorted by a stable key (criterion, then file, then title).

---

## REQ-10 Safe file handling

**User story:** As a developer, I want the generator to touch only what it should, so that running it cannot damage my work.

### Acceptance criteria

- 10.1 The generator SHALL write only `<app-dir>/ACR.md`. It SHALL write to a temporary file in the same folder first and rename it over the target, and SHALL remove the temporary file on failure.
- 10.2 IF writing fails, THEN the generator SHALL leave any existing `ACR.md` unchanged, print the error and exit with code 1.
- 10.3 The generator SHALL NOT read files outside the repository root and SHALL NOT follow a symbolic link that resolves outside the repository root.
- 10.4 The generator SHALL NOT use `eval`, `new Function`, dynamic `import()` of evidence paths, or child processes.
- 10.5 The generator SHALL cap the size of any evidence file it reads at 50 MB and treat a larger file as unreadable (REQ-3.3).

---

## REQ-11 Producing machine evidence in `skeleton/`

**User story:** As a developer, I want my normal test commands to leave the evidence the generator needs, so that I do not run anything extra.

### Acceptance criteria

- 11.1 The Vitest configuration in `skeleton/` SHALL add the `json` reporter alongside the default reporter and write to `evidence/vitest.json`.
- 11.2 The Playwright configuration in `skeleton/` SHALL add the `json` reporter alongside the `list` reporter and write to `evidence/playwright.json`.
- 11.3 The evidence directory SHALL NOT be the Playwright `outputDir`, because Playwright empties its output directory at the start of each run.
- 11.4 The system SHALL provide one shared Playwright helper in `skeleton/tests/e2e/support/axe.ts` that runs axe-core with the tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` and `wcag22aa`, writes the scan to `evidence/axe/<slug>.json` before any assertion, and returns the results.
- 11.5 A Playwright global setup SHALL delete `evidence/axe/` once at the start of a run, so that scans from deleted tests do not linger.
- 11.6 The existing page-level axe tests in `skeleton/tests/e2e/` SHALL call the helper instead of calling `AxeBuilder` directly, and SHALL keep asserting zero violations.
- 11.7 The tests in `skeleton/tests/` that verify one named criterion SHALL carry an SC tag in their title. A test that only checks "no axe violations" SHALL NOT carry a tag.
- 11.8 `skeleton/.gitignore` SHALL ignore `evidence/`.
- 11.9 The existing tests SHALL keep passing, and the number of tests SHALL NOT fall.

---

## REQ-12 Tests for the generator

**User story:** As a maintainer, I want the rules that stop false claims to be proven by tests, so that a later change cannot weaken them quietly.

### Acceptance criteria

- 12.1 The system SHALL place tests under `scripts/acr/tests/` and run them with `node --test` (no new dependency).
- 12.2 The tests SHALL check the catalogue: 55 entries, 31 Level A and 24 Level AA, unique ids, numeric order, no 4.1.1, and every human-only entry from REQ-2.4 present with a note.
- 12.3 The tests SHALL exhaustively check the decision function over every combination of: passing evidence (none, test, axe), failing evidence (none, present), inconclusive (none, present), open finding (none, Moderate, Serious), human-only (yes, no), tier (`axe`, `test`) and override (none, Not Applicable, Not Evaluated), and SHALL assert REQ-5.7 and REQ-5.8 for each combination.
- 12.4 The tests SHALL include example tests for each rule in REQ-5.1 to 5.6.
- 12.5 The tests SHALL cover the parsers with fixtures: Playwright JSON (pass, fail, skipped, flaky, nested suites), Vitest JSON (passed, failed, pending), axe scan files (violations, passes, incomplete, inapplicable), the SC tag syntax, and the existing `docs/trusted-tester-review-skeleton.md` format (multi-criterion lines, `FIXED`, `OPEN`, `PARTLY ADDRESSED`, a line with no criterion).
- 12.6 The tests SHALL cover the `wcag<digits>` tag mapping for `wcag111`, `wcag143`, `wcag1410`, `wcag2411` and `wcag258`, and the ignoring of `wcag2a` and `best-practice`.
- 12.7 The tests SHALL cover escaping (REQ-9.5, 9.6), including a test title that contains `|`, a newline, a backtick and `<script>`.
- 12.8 The tests SHALL include a golden-file test: fixed fixture evidence and `--date` produce a byte-identical expected `ACR.md`.
- 12.9 The tests SHALL run the CLI against fixture folders and check exit codes and messages for: success, no folder, missing folder, no `package.json`, bad date, unknown flag, invalid config, malformed evidence, missing evidence, and a folder outside the repository root.
- 12.10 The tests SHALL check that a failed write leaves an existing `ACR.md` unchanged and leaves no temporary file.
- 12.11 The tests SHALL check that running the generator twice gives identical output, and that it modifies no file other than `ACR.md`.
- 12.12 The tests SHALL parse the generated report and check REQ-8: the header fields, the disclaimer text appears before Table 1, there are 31 and 24 rows, every row has a valid Level and a non-empty remark, and the forbidden words (REQ-8.12) are absent outside the disclaimer.

---

## REQ-13 Documentation and the generated reports

**User story:** As a new contributor, I want to know how to produce and read the report, and I want the skeleton's report to exist.

### Acceptance criteria

- 13.1 The root `README.md` and `skeleton/README.md` SHALL each get a short section that gives the commands in order (`npm test`, `npm run test:e2e`, `npm run acr -- <app-dir>`), explains the SC tag convention, and states that the report is not a legal certification.
- 13.2 The system SHALL add `docs/acr-report.md`, a short guide that covers the rating rules (REQ-5), the evidence file locations, the config file, and how to add evidence for a criterion.
- 13.3 WHEN the work is done, THEN the system SHALL run the tests, generate `skeleton/ACR.md` from real evidence, and commit it as a generated file.
- 13.4 The system SHALL NOT generate `ACR.md` for an app folder that does not exist yet. Each app spec generates its own report.
- 13.5 The system SHALL record in the design the rule that `scripts/new-app.mjs` must not copy `ACR.md` or `evidence/` into a new app, because a copied report would describe another app.
