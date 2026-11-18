# Seance

A three-step form for booking a séance with an invented spirit. It is built from the Skeleton Key template and shows the form-heavy side of it: validation, an error summary, a confirmation dialog and a spoken success message. Everything is a demo. **Nothing you type is stored or sent.** The booking lives in memory and a reload starts again.

## Run it

```
npm install
npm run dev        # http://localhost:5175 (the port is fixed with --strictPort)
```

Port 5175 is fixed so a running skeleton (5173) or Grimoire (5174) can never answer Seance's browser tests.

## Pages

| Route | What it is |
| --- | --- |
| `/` | Introduction: what the form asks, and a "Start booking" link |
| `/book/spirit` | Step 1: choose one of four spirits (native radio group) |
| `/book/time` | Step 2: date and time (native date and time inputs) |
| `/book/details` | Step 3: name, email, phone, then a confirmation dialog and the success view |
| `/about`, `*` | About, and page not found |

A visit to a later step before the earlier ones are valid is redirected to the first step that is not.

## Theme

"Spectral Slate": cool teals and slate (hues 160° to 280°) in light and dark, a sans-serif heading font, rounded corners and a narrow dashed "ticket" column. Only token values changed; Grimoire uses warm colours. `tests/unit/theme-identity.test.ts` enforces the difference and the contrast tests prove every pair.

## Tests

```
npm run lint          # ESLint with jsx-a11y (strict), zero warnings
npx tsc --noEmit      # types
npm test              # Vitest: unit, property-based (fast-check) and axe tests
npm run test:e2e      # Playwright: keyboard-only flows, axe scans (light and dark), reflow, motion
```

From the repository root, `npm run acr -- apps/seance` writes `ACR.md` from these results.
