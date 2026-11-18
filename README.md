# Skeleton Key 🗝️

**A lean web app skeleton that's accessible by default.** Every app built from it meets WCAG 2.2 AA from the first commit, so you start accessible instead of fixing it later.

Built for **Kiroween 2026** (Skeleton Crew category) with [Kiro](https://kiro.dev).

## What's inside

| Folder | What it is |
|---|---|
| `skeleton/` | The template: page shell, accessible components, design tokens, built-in axe tests |
| `apps/grimoire/` | App 1 — a spooky catalogue with search and filters (read-heavy) |
| `apps/seance/` | App 2 — a multi-step booking form with validation (form-heavy) |
| `.kiro/` | The specs, steering docs and hooks Kiro used to build all of it |

## Create a new app

```
npm run new-app <name>    # from the repo root; creates apps/<name> from skeleton/
```

The name uses lower-case letters, digits and single hyphens (for example `my-app`). The command copies `skeleton/` with its accessibility tests, renames the package and page title, and refuses to overwrite an existing `apps/<name>`. It prints the next steps. Details: [.kiro/specs/new-app-script/](./.kiro/specs/new-app-script/requirements.md).

## Accessibility Conformance Report

Each app can generate `ACR.md`, a WCAG 2.2 A and AA report in the style of the VPAT 2.5 WCAG edition, built from its own test results. Run the tests, then the generator:

```
npm test                  # in skeleton/ (or the app folder)
npm run test:e2e          # in the same folder
npm run acr -- skeleton   # from the repo root; writes skeleton/ACR.md
```

A test counts as evidence for a criterion only when its title carries an SC tag, for example `[SC 2.4.1]`. The report is not a legal certification. Details: [docs/acr-report.md](./docs/acr-report.md).

## Status
🚧 In progress. Full setup instructions, live demo links and the "how Kiro was used" write-up are coming.

## License
[MIT](./LICENSE)
