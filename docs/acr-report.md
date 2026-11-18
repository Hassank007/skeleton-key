# Accessibility Conformance Report (ACR) generator

`npm run acr -- <app-dir>` writes `<app-dir>/ACR.md`, a report in the style of the ITI VPAT 2.5 WCAG edition. It lists all 55 WCAG 2.2 Level A and AA criteria with a conformance Level and a remark that cites evidence.

The report is generated from automated test results and a static code review. It is not a legal certification, an audit by an accredited body, or a statement of compliance with any law. Criteria marked Not Evaluated need testing by a person, including with assistive technology.

The generator reads files only. It never runs tests, starts a server, opens a browser or uses the network. Design and requirements: `.kiro/specs/acr-report/`.

## Commands, in order

Run the tests first, because the generator reads what they leave behind.

```
cd skeleton
npm test                  # writes evidence/vitest.json
npm run test:e2e          # writes evidence/playwright.json and evidence/axe/*.json
cd ..
npm run acr -- skeleton   # writes skeleton/ACR.md
```

- Several folders at once: `npm run acr -- skeleton apps/grimoire`.
- Fixed date for a reproducible report: `npm run acr -- skeleton --date 2025-10-31`. Without it the UTC date is used. The same inputs and date give a byte-identical file.
- PowerShell removes a bare `--`. Quote it: `npm run acr '--' skeleton '--date=2025-10-31'`.
- Exit code 0 when every report was written, even if rows say Does Not Support. Exit code 1 for a usage error, an invalid config, a folder outside the repository, or a write failure. Warnings go to stderr and into the report.
- Tests of the generator itself: `npm run test:scripts` (Node 21 or later, because it passes a glob to `node --test`).

Running only part of a suite (for example `npx vitest run one-file`) overwrites the evidence file with a partial result. Run the full `npm test` again before generating a report.

## Where the evidence comes from

| Source | Written by | Used for |
| --- | --- | --- |
| `<app>/evidence/vitest.json` | `npm test` (Vitest `json` reporter) | Unit and property tests with an SC tag |
| `<app>/evidence/playwright.json` | `npm run test:e2e` (Playwright `json` reporter) | Page tests with an SC tag |
| `<app>/evidence/axe/*.json` | `scanPage()` in `tests/e2e/support/axe.ts` | One file per axe scan: rule ids, WCAG tags and node counts |
| `docs/trusted-tester-review-<folder>.md` | The Trusted Tester agent, saved by hand | Open and fixed findings (static review) |
| `<app>/acr.config.json` | The app owner | Product text and Not Applicable or Not Evaluated notes |
| `<app>/package.json` | | Product name and version |

`evidence/` is gitignored. `ACR.md` is committed as a generated file. A "possibly stale evidence" notice appears when an evidence file is older than the newest file under `<app>/src/`.

Evidence files are treated as data. Every value copied into the report is escaped (`|`, `<`, `>`, backticks, newlines) and cut to 200 characters.

## The SC tag convention

A test counts as evidence for a criterion only when its full title contains an SC tag:

```ts
it('the skip link is present and href targets #main-content [SC 2.4.1]', ...)
it('error message is text, not colour only [SC 1.4.1, 3.3.1]', ...)
```

The tag is a claim that the test's assertions verify those criteria. Add it only when they do. Do not tag a test that only checks "no axe violations". Untagged tests count in the evidence summary and nowhere else. An unknown entry in a tag (for example `[SC 9.9.9]`) prints a warning and maps to nothing.

For Playwright the full title is the `describe` titles and the test title joined with ` > `. For Vitest it is the `fullName`.

## Rating rules

The first matching rule decides each criterion (`scripts/acr/decide.mjs`).

1. A failing test, a violating axe rule, or an open finding exists: Partially Supports if qualifying passing evidence also exists. Otherwise Does Not Support when something fails or an open finding is Critical or Serious, else Partially Supports.
2. The owner recorded Not Applicable with a reason: Not Applicable.
3. The criterion is human-only: Not Evaluated, with a note on what a person must check. Passing evidence is cited but does not change the Level.
4. An inconclusive item exists (a flaky test, or an axe rule in `incomplete`): Not Evaluated.
5. Qualifying passing evidence exists: Supports.
6. Otherwise: Not Evaluated, "No evidence found".

Qualifying evidence is a passing tagged test, or a passing axe rule when the criterion is in the axe tier: 1.3.5, 1.4.3, 2.4.2, 2.5.8 and 3.1.1. For every other criterion an axe pass alone is cited but is not enough.

Supports is never output without qualifying evidence, and never alongside failing or inconclusive evidence, an open finding, a human-only flag or a Not Applicable override.

Human-only criteria: 1.2.1 to 1.2.5, 1.3.3, 1.4.5, 2.5.4, 3.1.2, 3.2.3, 3.2.4, 3.2.6 and 3.3.4.

Trusted Tester findings are read from lines that start with `[Critical]`, `[Serious]`, `[Moderate]` or `[Minor]`, followed by the criterion number and an optional `-> STATUS`. A finding is open unless its status contains `FIXED` and not `PARTLY`. A finding with no status is open. Findings can lower a Level, never raise one. Fixed findings appear in the remark as history. Lines with no criterion number are counted as unmapped.

## `acr.config.json`

Optional, next to `package.json`.

```json
{
  "product": { "name": "Grimoire", "description": "A spooky catalogue." },
  "criteria": {
    "1.2.1": { "level": "Not Applicable", "reason": "The app has no audio or video." },
    "2.4.5": { "level": "Not Evaluated", "reason": "Single page; a person must confirm." }
  }
}
```

- Only `Not Applicable` and `Not Evaluated` are allowed. Every entry needs a reason and a catalogue criterion. Anything else exits with code 1 and names the entry.
- Not Applicable is shown as "(owner-stated, not tested)". It is ignored, with a warning, when the criterion has failing evidence or an open finding.
- Not Evaluated replaces only the "No evidence found" text.

## How to add evidence for a criterion

1. Write a test whose assertions check the criterion.
2. Put `[SC x.y.z]` at the end of its title.
3. Run `npm test` and `npm run test:e2e` in full, then `npm run acr -- <app-dir>`.
4. Read the row. If it does not say Supports, the remark says why.

For an axe-tier criterion, a page scan through `scanPage()` is enough. Other criteria need a tagged test.

## `new-app` must not copy report files

`scripts/new-app.mjs` must leave `ACR.md`, `evidence/` and `acr.config.json` out of the copy. They describe the skeleton, not the new app, and a copied report would describe another app. The `new-app-script` spec does not exist yet, so this rule is recorded here and in `.kiro/specs/acr-report/design.md`. Each app generates its own report.

## Dependency note

The generator adds no runtime dependency. In `skeleton/`, `@types/node` was added as a dev dependency (types only) so the Playwright support files `axe.ts` and `global-setup.ts` can use `node:fs` and `node:path` under TypeScript strict mode.
