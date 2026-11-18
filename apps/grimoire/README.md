# Grimoire

A spooky catalogue of 24 invented spellbooks, built from the Skeleton Key template. It targets WCAG 2.2 AA. Search by word, filter by school of magic and hazard, open a book. All data is local and fictional.

## Run

```
npm install
npm run dev
```

The dev server runs on http://localhost:5174 (`--strictPort`, so it never clashes with the skeleton on 5173).

## Pages

| Route | Page |
| --- | --- |
| `/` | Catalogue: search, two filter groups, results list, empty state |
| `/books/:slug` | Book detail, or "Spellbook not found" |
| `/about` | About, with the dialog demo |
| `*` | Page not found |

The search and filters live in the address (`?q=ember&school=alchemy&hazard=mild`), so Back returns to the same results. The result count is announced politely 500 ms after the search settles.

## Theme

"Parchment and Candle": a warm parchment light theme and a candlelit dark theme, set only through the tokens in `src/tokens/`. A serif heading font comes from `--font-heading`. Components use tokens only (a test fails on any hex colour outside the token files).

## Tests

| Command | What it runs |
| --- | --- |
| `npm run lint` | ESLint with `jsx-a11y` |
| `npx tsc --noEmit` | Type check |
| `npm test` | Vitest: unit, axe and property-based tests |
| `npm run test:e2e` | Playwright with axe and keyboard tests for every page |

From the repository root, `npm run acr -- apps/grimoire` writes `ACR.md` from the test results.

Spec: `.kiro/specs/grimoire/`.
