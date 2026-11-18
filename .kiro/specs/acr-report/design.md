# Accessibility Conformance Report Generator: Design

## Overview

`scripts/acr.mjs` reads the evidence an app's own test suites leave behind and writes `<app>/ACR.md`, a table of all 55 WCAG 2.2 Level A and AA criteria with a Level and a remark that cites evidence. The generator never runs a test. It decides each Level with one pure function, and that function cannot return `Supports` without qualifying evidence (REQ-5.7).

```
scripts/
  acr.mjs                  CLI: parse args, call the pipeline per folder, set the exit code
  acr/
    criteria.mjs           the 55-criterion catalogue (REQ-2)
    evidence.mjs           find and read evidence files; return normalised evidence items (REQ-3, REQ-4)
    review.mjs             parse docs/trusted-tester-review-<app>.md (REQ-6)
    config.mjs             read and validate acr.config.json (REQ-7)
    decide.mjs             pure decision function (REQ-5)
    render.mjs             Markdown rendering, escaping and truncation (REQ-8, REQ-9)
    io.mjs                 safe path checks, size-capped reads, atomic write (REQ-10)
    tests/
      fixtures/            small evidence, config and review files, plus golden ACR.md
      *.test.mjs           node:test suites (REQ-12)
skeleton/
  evidence/                gitignored; vitest.json, playwright.json, axe/*.json (REQ-11)
  tests/e2e/support/axe.ts
  tests/e2e/support/global-setup.ts
```

Why a `scripts/acr/` folder: `structure.md` lists `scripts/new-app.mjs` only. One file would hold about 800 lines. The pure parts (decision, parsing, rendering) are easier to test in separate modules. The entry point stays at `scripts/acr.mjs` as the request asks.

## Dependencies and reasons

`tech.md` requires a written reason for each new dependency.

None are added. The generator uses `node:fs`, `node:path`, `node:url`, `node:process`, and the tests use `node:test` and `node:assert`. Node 20 ships all of them. A Markdown or schema library would be more code to trust than the 30 lines of escaping and validation we need.

Trade-off: the root has no ESLint or TypeScript setup, and adding both only for one script would add dependencies. The `.mjs` files use JSDoc types and are checked by the tests and by `node --check`. If the root later gets a lint setup (for example in the `new-app-script` spec), the scripts join it.

## Evidence flow

```
npm test               -> skeleton/evidence/vitest.json          (Vitest json reporter)
npm run test:e2e       -> skeleton/evidence/playwright.json      (Playwright json reporter)
                       -> skeleton/evidence/axe/<slug>.json      (helper, one per scan)
docs/trusted-tester-review-skeleton.md                           (agent output, hand-saved)
npm run acr -- skeleton -> skeleton/ACR.md
```

Today neither suite writes machine-readable output (Playwright uses the `list` reporter, Vitest the default one), and `AxeBuilder` results are discarded after the assertion. REQ-11 fixes that at the source in `skeleton/`, and apps inherit it through `new-app`.

Playwright empties its `outputDir` (`test-results/`) at the start of each run, so the evidence goes to `evidence/`, which Playwright does not touch. The axe folder is emptied once per run by a global setup, so scans from a removed test do not remain as evidence.

### Axe scan file (schema version 1)

Written by `tests/e2e/support/axe.ts` before the assertion, so a failing scan is still recorded.

```json
{
  "schema": 1,
  "axeVersion": "4.10.3",
  "url": "/about",
  "colorScheme": "light",
  "tags": ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
  "violations": [{ "id": "color-contrast", "impact": "serious", "tags": ["wcag143"], "nodes": 2 }],
  "passes":     [{ "id": "document-title", "tags": ["wcag242"] }],
  "incomplete": [{ "id": "target-size", "tags": ["wcag258"], "nodes": 1 }],
  "inapplicable": ["video-caption"]
}
```

Only ids, tags and node counts are stored. Node HTML and selectors are left out, so the file stays small and cannot carry page content into the report. The URL is stored as a path (no origin or query string).

### Vitest and Playwright files

The generator reads only these fields.

- Vitest JSON (Jest-compatible): `testResults[].name`, `testResults[].assertionResults[].{fullName, status}`. Status `passed` is a pass, `failed` is a failure, and `pending`, `skipped`, `todo` are skipped.
- Playwright JSON: `suites[]` (recursive, with `title`), `suites[].specs[].{title, file, tests[].{status, results[]}}`. Test status `expected` is a pass, `unexpected` is a failure, `flaky` is inconclusive, `skipped` is skipped. The full title is the suite titles (the file-level suite is skipped) joined with ` > `, plus the spec title.

A file that is valid JSON but lacks these arrays is unreadable (REQ-3.3). The tests include one fixture per case.

## Evidence items and mapping

`evidence.mjs` turns everything into one flat list. Every item has `criterion`, `kind` (`test` or `axe`), `result` (`pass`, `fail`, `inconclusive`), a `source` (relative file path), a `label` (test title or rule id) and optional `detail` (page, node count).

- **Tagged tests.** Regex `\[SC\s+([^\]]+)\]` on the full title, then split on commas, trim, and check against the catalogue. Example: `Skip link is the first Tab stop [SC 2.4.1]`. Using the title keeps one convention for Vitest and Playwright, which do not share a tag feature (Vitest's JSON has none). One item is made per criterion in the tag.
- **Axe rules.** Each rule's `tags` are scanned for `^wcag(\d)(\d)(\d+)$`, and the three groups are joined as `1.4.10` etc. This is unambiguous because the principle and guideline are always one digit. The result is kept only if the id is in the catalogue. Level tags (`wcag2a`, `wcag21aa`) end in letters, so the pattern does not match them, and best-practice tags do not match either. Both are ignored.

For an `axe` item the per-criterion pass count is "scans where the rule is in `passes`" over "scans that mention the rule in `passes` or `violations` or `incomplete`". That gives the citation `axe rule color-contrast passed on 4 of 4 scans`.

## Criteria catalogue

Each entry: `{ id, name, level, principle, tier, humanOnly, note? }`.

**Tier `axe`** (a passing axe rule alone may support `Supports`): 1.3.5 Identify Input Purpose, 1.4.3 Contrast (Minimum), 2.4.2 Page Titled, 2.5.8 Target Size (Minimum), 3.1.1 Language of Page. For each of these the axe rules test the property itself (an `autocomplete` token, a measured ratio, a title, a measured size, a `lang` value). Every other criterion has tier `test`: an axe rule may cover only part of what it asks (for example 4.1.2 or 1.1.1, where axe can see that an alternative exists but not that it is a good one), so a person-written test must say what was checked.

**Human-only** (never `Supports`; REQ-2.4): 1.2.1, 1.2.2, 1.2.3, 1.2.4, 1.2.5 (media alternatives need someone to judge captions and descriptions), 1.3.3 (sensory characteristics), 1.4.5 (images of text), 2.5.4 (motion actuation), 3.1.2 (language of parts: tools cannot tell which passages are in another language), 3.2.3 and 3.2.4 (consistency across pages), 3.2.6 (consistent help), 3.3.4 (needs a decision about whether the page handles legal or financial data). An app owner who knows a criterion cannot apply (for example 1.2.x in an app with no media) records `Not Applicable` with a reason in `acr.config.json`. Passing tagged tests for these criteria are cited in the remark but do not change the Level.

The tier and human-only lists are a first judgement. Task 1.3 reviews them against the Trusted Tester baseline before the first report is generated.

## Decision function

`decide(criterion, items, findings, override) -> { level, reasonCode, notes }`. It has no I/O.

```
F  = items with result fail
P  = items with result pass, qualifying: kind test, or kind axe when criterion.tier == 'axe'
I  = items with result inconclusive
O  = open findings for the criterion (REQ-6.3)

if F or O not empty:
    if P not empty:                                   Partially Supports
    elif F not empty or any O is Critical/Serious:    Does Not Support
    else:                                             Partially Supports
elif override.level == 'Not Applicable':              Not Applicable
elif criterion.humanOnly:                             Not Evaluated   (note from catalogue)
elif I not empty:                                     Not Evaluated   (names the items)
elif P not empty:                                     Supports
else:                                                 Not Evaluated   (no evidence)
```

A `Not Evaluated` override only changes the text of the final "no evidence" remark. `Supports` appears in exactly one branch, and that branch requires `P` non-empty and every blocker empty. The exhaustive test (REQ-12.3) enumerates 3 x 2 x 2 x 3 x 2 x 2 x 3 = 432 combinations and checks the invariants on each.

An open finding on a criterion beats a pass for it. An app owner who disagrees with a finding marks it fixed in the review file, or removes it, after fixing the code. The generator never overrides findings.

## Trusted Tester parsing

`review.mjs` takes the file text and returns `[{ severity, criteria[], status, open, line, text }]`.

- Header regex per line: `^\s*\[(Critical|Serious|Moderate|Minor)\]\s+(.*)$`.
- The criterion segment is the text up to the first run of two or more spaces or `->`. Catalogue ids are found in it with `\b[1-4]\.\d{1,2}\.\d{1,2}\b`.
- Status: the text after `->`. `open = !(/FIXED/i.test(s) && !/PARTLY/i.test(s))`. No status means open (the safe default).
- The existing `docs/trusted-tester-review-skeleton.md` is the main fixture. Its multi-criterion lines (`2.2.1 Timing Adjustable / 2.4.3 Focus Order`, `3.3.2 / 4.1.2`) must map to every listed criterion, and its line `[Minor] Test coverage: ...` has no criterion and counts as unmapped.

Review evidence is static. It can lower a Level but never raise one (REQ-6.6).

## Report layout

Markdown, no HTML. Headings: `h1` title, then `h2` sections in this order. Tables are plain pipe tables.

```
# Accessibility Conformance Report: WCAG Edition (VPAT 2.5 style)
## Product information      name, version, date, description, standard, generator
## Disclaimer               (REQ-8.5 text, verbatim)
[notices: no evidence / possibly stale evidence]
## Evaluation methods       three bullet items, each with what was read
## Terms                    five Level definitions
## Summary                  count per Level
## Table 1: Success Criteria, Level A      | Criteria | Conformance Level | Remarks and Explanations |
## Table 2: Success Criteria, Level AA
## Evidence summary         files, test counts, scans, findings, warnings
```

The Level strings are exactly `Supports`, `Partially Supports`, `Does Not Support`, `Not Applicable`, `Not Evaluated`. The Terms text defines the five Levels in our own words, following the meaning used in VPAT 2.5. It does not copy template text (`product.md`: all code and content is new).

### Remark templates

| Level | Remark pattern |
|---|---|
| Supports | `Passing: <citations>.` Axe: `axe rule document-title passed on 3 of 3 scans.` Tests: `tests/e2e/home.spec.ts "Skip link ... [SC 2.4.1]"`. |
| Partially Supports | `Passing: <citations>. Failing: <citations>.` or `... Open finding (Moderate, static review, docs/...): <text>.` |
| Does Not Support | `Failing: <citations>.` or `Open finding (Serious, static review): <text>.` |
| Not Applicable | `<reason> (owner-stated, not tested).` |
| Not Evaluated | `No evidence found for this criterion.` / `Needs human judgement: <note>.` / `Inconclusive: <items>.` |

Citations are sorted by (criterion, source, label). More than three citations are cut to three plus `and N more`. Each copied value goes through `cell(text)`: strip control characters, `|` to `\|`, `<` `>` to entities, backtick to `'`, newlines to a space, truncate at 200 characters with `...`.

The generator version printed in the header is a `GENERATOR_VERSION` constant exported from `render.mjs`. The report date comes from `--date` or the UTC date.

## CLI and exit codes

```
node scripts/acr.mjs <app-dir> [<app-dir> ...] [--date YYYY-MM-DD]
```

| Code | Meaning |
|---|---|
| 0 | Every report was written. Warnings may have been printed. |
| 1 | Usage error, invalid input, invalid config, or any write failure. |

Root `package.json` scripts: `"acr": "node scripts/acr.mjs"` and `"test:scripts": "node --test scripts/acr/tests/"`. The root `package.json` does not exist yet, and the `new-app-script` spec also needs one. Whichever task runs first creates a minimal `{ "name": "skeleton-key", "private": true, "type": "module", "scripts": {} }` and the other adds to it. Neither overwrites existing scripts.

## Safety

- **Paths.** `io.resolveAppDir` resolves the argument with `path.resolve`, calls `fs.realpathSync`, and requires the result to be inside the repository root (derived from `import.meta.url`, two levels above `scripts/acr/`). It applies the same check to every evidence file it opens, so a symlink in `evidence/` cannot read outside the repository.
- **Untrusted content.** Evidence is parsed with `JSON.parse` and read only as data. Rendering escapes every copied value. A test title like `` `\n## Fake heading | x `` cannot create a heading, a table cell or a code span.
- **No execution.** No `eval`, no `child_process`, no dynamic import.
- **Size.** Files above 50 MB are rejected before reading (`fs.statSync`).
- **Writes.** The generator writes `ACR.md.tmp-<pid>` and renames it. On a failure it deletes the temporary file. An existing report survives a failed run.

## Changes in `skeleton/` (REQ-11)

- `vite.config.ts`: `test.reporters: ['default', 'json']`, `test.outputFile: { json: 'evidence/vitest.json' }`.
- `playwright.config.ts`: `reporter: [['list'], ['json', { outputFile: 'evidence/playwright.json' }]]` and `globalSetup: './tests/e2e/support/global-setup.ts'`.
- `tests/e2e/support/axe.ts`: `scanPage(page, testInfo, label?)` runs `AxeBuilder` with the five WCAG tags, reads `colorScheme` from the page, writes the scan file named `<project>-<slugified test title>[-label].json`, and returns the axe results. The assertion stays in the spec (`expect(results.violations).toEqual([])`).
- `tests/e2e/support/global-setup.ts`: removes `evidence/axe/` and recreates it.
- Tag the tests that verify one criterion. Examples: the skip-link test gets `[SC 2.4.1]`, the Tab-order and focus-ring keyboard walk gets `[SC 2.4.3, 2.4.7]`, the dialog focus-trap tests get `[SC 2.1.2]`, the Escape and focus-return tests get `[SC 2.1.1]`. The exact list is part of tasks 5.1 and 5.2 and is chosen by reading each test's assertions, not its name. A tag is a claim, so it goes only on a test whose assertions back it.

Property tests are tagged where they prove a criterion (for example the token contrast property gets `[SC 1.4.3, 1.4.11]`). Because the title carries the tag, the existing `describe` and `it` names stay readable.

Accessibility of this feature: the generator produces a Markdown document and no UI, so the accessibility steering (axe component tests, focus, landmarks) does not apply to it. The report follows the document rules that do apply: one `h1`, headings in order, real header cells in the tables, and no information in colour or images. The repository rule "do not claim something is accessible without a test" is enforced in the report by REQ-5.7 and REQ-8.12.

## Interaction with other specs

- **`new-app-script`.** `scripts/new-app.mjs` must exclude `ACR.md`, `evidence/` and `acr.config.json` from its copy, because they describe the skeleton, not the new app. This spec records the rule (REQ-13.5). The `new-app-script` implementation applies it. Until that script exists, nothing copies them.
- **`a11y-brain`.** The Trusted Tester agent already writes findings in the `[Severity] <criterion> <name> -> STATUS` form. The review parser reads that form and no other, so the agent prompt does not change.
- **`a11y-pbt`.** Property tests are normal Vitest tests and arrive through `vitest.json`. They count as evidence only when tagged.

## Testing strategy

| Area | Test | Requirement |
|---|---|---|
| Catalogue | counts, order, uniqueness, human-only notes | 12.2 |
| Decision | exhaustive 432-combination invariant test, plus one example per rule | 12.3, 12.4 |
| Parsers | fixtures for Playwright, Vitest, axe, SC tags, review lines | 12.5, 12.6 |
| Rendering | escaping, truncation, ordering | 12.7 |
| Golden file | fixture folder to expected `ACR.md` | 12.8 |
| CLI | exit codes and messages for each failure | 12.9 |
| Files | atomic write, no stray files, idempotence | 12.10, 12.11 |
| Document | header, disclaimer position, row counts, forbidden words | 12.12 |

Fixtures are small and hand-written. They are not copies of real run output, except for the review file test, which reads the checked-in `docs/trusted-tester-review-skeleton.md` directly so that a format change in the agent output breaks a test.

## Risks and open points

- **Tags are claims.** A wrongly tagged test can produce a false `Supports`. Mitigation: tag only when the assertions back it (REQ-11.7) and review tags in code review. The report cites each test by title, so a reader can check.
- **Axe covers little.** Tier `axe` is limited to five criteria for this reason. Everything else needs a named test.
- **Static review lowers but never raises a Level.** This can make a report look worse than the app is until findings are fixed or re-reviewed. That is the intended direction of error.
- **No manual-test evidence format.** A keyboard check or screen-reader run by a person cannot raise a Level. Recording manual results would need a signed, dated evidence format and is out of scope.
- **Flaky tests.** A flaky test blocks `Supports` for its criteria until the test is stable. This is deliberate.
- **Playwright JSON shape** can change between major versions. The parser reads a small set of fields and the unreadable-file path (REQ-3.3) reports a mismatch instead of guessing.

## Implementation notes

Recorded while implementing, where the build differs from or settles the text above.

- **Tier and human-only review (task 1.3).** Checked against `.kiro/agents/prompts/trusted-tester.md`. No assignment changed. The agent's test 14 reads 1.3.3 from source, but that is still a judgement about wording and position, so 1.3.3 stays human-only. The five `axe` tier criteria are the ones whose axe rules measure the property itself (see the tier paragraph above).
- **`test:scripts` command.** Node 22 treats the directory in `node --test scripts/acr/tests/` as a file and fails. The script is `node --test "scripts/acr/tests/*.test.mjs"`, which needs Node 21 or later (the quoted glob is expanded by Node). Helper files (`helpers.mjs`) do not match the glob.
- **Extra module code.** `scripts/acr.mjs` exports `run(argv, ctx)`, `generate(appDir, opts)` and `parseArgs`, and only calls `run` when it is the entry file. The tests call `run` in-process with an injected `repoRoot`, so "folder inside the repository" can be tested on a temporary copy under the OS temp folder, and failed writes can be injected through `ctx.fsOps`. One test also starts the real script in a child process (test code only; the generator itself uses no `child_process`).
- **Playwright file paths.** The Playwright JSON stores `file` relative to `config.rootDir` (here `tests/e2e`). The parser joins them and makes the path relative to the app folder, so citations read `tests/e2e/home.spec.ts`.
- **Review finding text.** A finding's text is its `Issue:` line when one follows the header line within four lines, otherwise the header text. Open and fixed findings are quoted in the remark.
- **Human-only with an open finding.** The remark keeps the human-judgement note ("Also needs human judgement: ...") because the finding rule decides the Level first.
- **Dependency.** `@types/node` (types only, dev dependency) was added to `skeleton/` so `tests/e2e/support/axe.ts` and `global-setup.ts` can import `node:fs` and `node:path` under strict TypeScript. `tests/e2e/tsconfig.json` lists `node` in `types`. No runtime dependency was added anywhere.
- **Partial runs.** Running one test file overwrites `evidence/vitest.json` with a partial result. The guide tells users to re-run the full suites before generating.
- **`new-app` rule (REQ-13.5).** `scripts/new-app.mjs` must not copy `ACR.md`, `evidence/` or `acr.config.json`, because they describe the skeleton, not the new app. No `new-app-script` spec exists yet, so the rule is also in `docs/acr-report.md`.
