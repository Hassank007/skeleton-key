# Skeleton Key: the template

An accessible-by-default Vite + React 19 + TypeScript starter. Apps built from it start at WCAG 2.2 AA.
Don't copy this folder by hand. Create apps from the repo root with `npm run new-app <name>`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server on http://localhost:5173. `@axe-core/react` logs violations to the browser console (development only). |
| `npm run build` | Type-checks (`tsc`) and builds the production bundle. The axe overlay is not included. |
| `npm run preview` | Serves the production build. |
| `npm run lint` | ESLint with `eslint-plugin-jsx-a11y` strict, zero warnings allowed. |
| `npm test` | Vitest unit tests; every component has a `vitest-axe` check. |
| `npm run test:e2e` | Playwright page tests with `@axe-core/playwright` (Chromium only; starts `npm run dev`). |

First-time E2E setup: `npx playwright install chromium`.

## What you get

- **Page shell** (`src/components/PageShell.tsx`): skip link as the first Tab stop, `header`, labelled `nav`, `main`, `footer`.
- **Route focus** (`src/hooks/useFocusOnRouteChange.ts`): after each route change, focus moves to the page `h1` (`tabIndex={-1}`) and the page title is announced. The first page load leaves focus at the top so the skip link is reached first.
- **Announcer** (`src/contexts/AnnouncerContext.tsx`, `useAnnounce`): polite and assertive live regions for status messages (WCAG 4.1.3).
- **Motion** (`src/contexts/MotionContext.tsx`, `MotionToggle`): honours `prefers-reduced-motion` and adds a "Reduce motion" toggle in the header. Both set `data-reduced-motion` on `<html>`, which zeroes the duration tokens.
- **Primitives** (`src/components/`): `Button`, `AppLink`, `Field`, `Dialog` (APG modal), `Toast`, `Tabs` (APG tabs).
- **Tokens** (`src/tokens/`): light and dark colour, spacing, type and motion tokens. Use these instead of new colours.

## Rules for pages you add

1. Set a unique `document.title` and render exactly one `<h1 tabIndex={-1}>`.
2. Use the primitives rather than clickable `div`s, and `Field` for every input.
3. Mark decorative art `aria-hidden="true"` and stop its animation under `[data-reduced-motion='true']`.
4. Add a `vitest-axe` unit test, plus a Playwright spec in `tests/e2e/` for each new route.

## Property-based tests

`tests/unit/properties/` holds `fast-check` property tests for contrast (every token pair in the light theme and both dark sources), `Field`, `Dialog` and `Tabs`. They run with `npm test`. Each file starts with the invariant it proves and points to `.kiro/specs/a11y-pbt/design.md`.

- Run only these: `npx vitest run tests/unit/properties`.
- `FC_NUM_RUNS=500 npm test` raises the number of cases per property. Values below 100 are ignored, and a property fails if fewer than 100 effective cases ran.
- A failing property prints a seed, a path and the shrunk counterexample. Replay it with `FC_SEED=<seed> npx vitest run tests/unit/properties/Field.property.test.tsx` (PowerShell: `$env:FC_SEED=<seed>; npx vitest run ...`).
- Once understood, turn the shrunk counterexample into an example test next to the component's other tests.
- The contrast check is exhaustive over `tests/unit/support/token-matrix.ts`. Adding a colour token fails the completeness test until you add it to the matrix or the exemption list.
## Layout

```
src/        components, contexts, hooks, pages, tokens
tests/unit  Vitest + Testing Library + vitest-axe
tests/e2e   Playwright + @axe-core/playwright
```
