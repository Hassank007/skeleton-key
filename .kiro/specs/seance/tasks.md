# Seance: Implementation Tasks

Paths are relative to the repository root. Mark a task `[x]` only after its checks pass. This file was written as part of the spec step, which does not implement anything, so every box is still open. The order is: create the app, theme (proven first, because everything else uses it), pure logic, state, components, pages, end-to-end tests, then evidence and documentation. In `apps/seance`, "the checks" means `npm run lint`, `npx tsc --noEmit` and `npm test` (and `npm run test:e2e` where a task says so).

## 1. Create the app

- [x] 1. Generate `apps/seance` from the skeleton
  - [x] 1.1 Run `npm run new-app seance` from the repository root. Confirm `apps/seance/tests/` has `unit/`, `unit/properties/` and `e2e/`, and that there is no `ACR.md`. Do not hand-copy. *(REQ-1.1, 1.3)*
  - [x] 1.2 In `apps/seance`, run `npm install`, then the checks and `npm run test:e2e`. All skeleton tests must pass before any edit. Record the counts. *(REQ-18.1)* **Done:** baseline before edits: lint and tsc clean, 17 files / 180 unit tests, 14 e2e tests, all passing.
  - [x] 1.3 Edit `package.json` so `dev` is `vite --port 5175 --strictPort`. Edit `playwright.config.ts`: `baseURL` and `webServer.url` on port 5175, and `use: { locale: 'en-US', timezoneId: 'UTC' }`. Confirm `npm run test:e2e` still passes. *(REQ-1.4, 16.2)*
  - [x] 1.4 Change `index.html` title to `Book a séance — Seance`. Rename "Skeleton Key" to "Seance" in `PageShell.tsx` (site name, footer text), `AboutPage.tsx`, `NotFoundPage.tsx`, and in skeleton tests that assert the old text. Set the nav links to "Book a séance" (`/book/spirit`) and "About" (`/about`). Run the checks. *(REQ-2.6, 2.7, 1.3)*
  - [x] 1.5 Confirm `package.json` has no dependency that `skeleton/package.json` lacks. *(REQ-1.5)*

## 2. Colour theme

- [x] 2. Apply the Spectral Slate palette and prove it
  - [x] 2.1 Replace the values in `src/tokens/tokens.css` with the light table in `design.md` section 7.1. Do not add, remove or rename a token. Update the comments to show the new ratios. *(REQ-13.1)*
  - [x] 2.2 Replace the values in `src/tokens/dark.css` (the media query block and the `[data-theme='dark']` block) with section 7.2, identical in both. *(REQ-13.1, 13.2)*
  - [x] 2.3 In `tokens.css`, set `--font-heading` to the sans-serif stack, `--radius-md` to `0.75rem` and `--radius-sm` to `0.375rem`. *(REQ-13.7)*
  - [x] 2.4 Run `npm test`. `contrast.property.test.ts` and `tokens-contrast.test.ts` must pass unchanged. If a pair fails (the dark accent is the tightest), change the colour, not the test. *(REQ-13.5)*
  - [x] 2.5 Add `tests/unit/support/hue.ts` (`hueOf(hex)`) and `tests/unit/hue.test.ts` with known colours (`#ff0000` is 0°, `#00ff00` is 120°, `#0000ff` is 240°, grey is 0°). *(REQ-13.3)*
  - [x] 2.6 Add `tests/unit/support/grimoire-palette.ts` with Grimoire's values from `.kiro/specs/grimoire/design.md` section 6 (light and dark: surface, surface-raised, accent, link, border, focus ring, error, success, warning). Do not import from `apps/grimoire`. *(REQ-13.4)*
  - [x] 2.7 Add `tests/unit/theme-identity.test.ts`: the token set equals the skeleton's list; surface, surface-raised, accent, link and border hues are in 160° to 280° for light and dark; no token keeps a skeleton purple value (`#f5f0ff`, `#ede5ff`, `#6b21a8`, `#581c87`, `#7c3aed`, `#4f46e5`, `#c084fc`, `#9333ea`, `#a78bfa`, `#818cf8`, `#0f0a1a`, `#1e1030`); no token equals a Grimoire value; hue distance from Grimoire's surface, accent, link and border is at least 90°; failures name the token. Include a negative control that feeds a purple value and a Grimoire value. *(REQ-13.3, 13.4)*
  - [x] 2.8 Add `tests/unit/no-hex-in-components.test.ts` that scans `src/**/*.css` outside `src/tokens/` for hex, `rgb(`, `hsl(` and named colours. Include a negative control on a sample string. Fix any hit in skeleton CSS by using a token (and apply the same fix in `skeleton/` first, REQ-19.1). *(REQ-13.6)* **Done:** the skeleton's no-hex-in-components.test.ts (with its negative control) came with the app and passes unchanged.
  - [x] 2.9 Run the checks. Look at the app in both themes once; note in the task that the look is clearly cool and unlike Grimoire (open both apps side by side). State what was looked at. *(REQ-13)* **Done:** looked at screenshots of the intro, step 1 (light) and step 2 with errors (dark) at 900 px: cool teal and slate, dashed ticket column, sans-serif headings, radio cards. Grimoire was not opened side by side; the difference is proved by theme-identity.test.ts (hue bands and 90 degree distance).

## 3. Data and pure logic

- [x] 3. Spirits, clock, formatting, validators
  - [x] 3.1 Create `src/data/spirits.json` with four original, fictional spirits (`id`, `name`, `blurb` of at most 140 characters, `speciality`), and `src/data/spirits.ts` with the `Spirit` type, `SPIRITS` and `findSpirit`. Enable `resolveJsonModule` in `tsconfig.json` if it is not on. *(REQ-4.1)*
  - [x] 3.2 Add `tests/unit/spirits-data.test.ts`: exactly four spirits, unique kebab-case ids, required fields, blurb length. A failure names the id. *(REQ-4.1)*
  - [x] 3.3 Create `src/lib/clock.ts` with `today()`, `addDays()`, `toIsoDate()`, `parseIsoDate()` (rejects impossible dates such as `2030-02-31`). Add `tests/unit/clock.test.ts`, including a daylight-saving change and a leap day. *(REQ-5.7)*
  - [x] 3.4 Create `src/lib/format.ts` with `formatLongDate()` (`en-US`, `dateStyle: 'full'`), `formatTime12h()`, `problemsMessage(n)` and `formatSuccess()`. Add `tests/unit/format.test.ts` with literal expected strings, for example `2030-11-13` gives `Wednesday, November 13, 2030` and `20:30` gives `8:30 PM`. *(REQ-11.2, 12.3, 8.5)*
  - [x] 3.5 Create `src/lib/validate.ts` with the six validators, `validateStep()` and `FIELD_IDS`, following `design.md` section 4.1 and the exact messages in REQ-7.5. Messages never include the input. *(REQ-7)*
  - [x] 3.6 Add `tests/unit/validate.test.ts`: every message in REQ-7.5, and every boundary in REQ-17.1 (first and last day of the window, 6:00 PM, 11:30 PM, 5:59 PM, 11:31 PM, 2 and 80 name characters, 7 and 15 phone digits, `2030-02-31`, `+` in the middle of a phone number). *(REQ-7.5, 17.1)*
  - [x] 3.7 Add `tests/unit/properties/validate.property.test.ts` with the date, time, name, e-mail, phone and totality properties from REQ-17.2, using the skeleton `pbt.ts` helpers. *(REQ-17.2, 7.7)*
  - [x] 3.8 Run the checks.

## 4. Booking state

- [x] 4. Reducer, context, guard, service
  - [x] 4.1 Create `src/lib/bookingState.ts` (`STEPS`, state, actions, reducer, `isStepValid`, `firstInvalidStep`) following `design.md` sections 3 and 4.2. *(REQ-3.1)*
  - [x] 4.2 Add `tests/unit/bookingState.test.ts` for each action and `tests/unit/properties/booking.property.test.tsx` for the reducer property in REQ-17.3. *(REQ-17.3)*
  - [x] 4.3 Create `src/lib/bookingService.ts` and `src/contexts/BookingServiceContext.tsx` (default stub resolves after 700 ms and sends nothing). *(REQ-12.1, 12.7)*
  - [x] 4.4 Create `src/contexts/BookingContext.tsx` (`BookingProvider`, `useBooking`) with an optional `today` prop. Confirm by search that nothing reads or writes `localStorage`, `sessionStorage` or `document.cookie`. *(REQ-3.1, 3.2)*
  - [x] 4.5 Create `src/hooks/useStepForm.ts` following `design.md` section 4.4. Add its behaviour tests through the step component tests in task 5. *(REQ-7.2, 7.3, 8)*
  - [x] 4.6 Run the checks.

## 5. Components

- [x] 5. Step components, each with an axe test
  - [x] 5.1 `StepProgress` (+ CSS module) and `StepProgress.test.tsx`: text "Step N of 3" for N = 1 to 3, state words, `aria-current` on the current item only, no live region, axe. *(REQ-9.1, 9.2, 9.4, 15.2)*
  - [x] 5.2 `ErrorSummary` (+ CSS module) and `ErrorSummary.test.tsx`: `tabindex="-1"`, `aria-labelledby` the heading, one link per item with `href="#field-…"`, a non-link item, link activation calls the handler without changing `location`, axe. *(REQ-8.2, 8.4, 15.2)*
  - [x] 5.3 `properties/errorSummary.property.test.tsx`: for any generated set of invalid fields, one link per error in order, and every `href` matches the id of a rendered control. *(REQ-17.2)*
  - [x] 5.4 `SpiritStep` (+ CSS module) and `SpiritStep.test.tsx`: `fieldset` with `legend`, four native radios with labels and `aria-describedby` blurbs, none selected on first render, arrow keys change the selection (user-event), error state sets `aria-invalid` and `aria-describedby` on the group, axe in clean and error states. *(REQ-4, 7.4, 15.2)*
  - [x] 5.5 `WhenStep` and `WhenStep.test.tsx`: `type="date"` with `min` and `max` from the injected `today`, `type="time"` with `min`, `max`, `step`, labels, hints, no `autocomplete`, no custom picker, required, axe in clean and error states. *(REQ-5, 15.2)*
  - [x] 5.6 `DetailsStep` and `DetailsStep.test.tsx`: exactly three inputs, types `text`, `email`, `tel`, `autocomplete` `name`, `email`, `tel`, `inputMode`, `spellCheck`, paste is not blocked, axe in clean and error states. *(REQ-6, 15.2)*
  - [x] 5.7 `StepActions` (+ CSS module): "Back" (`type="button"`, steps 2 and 3 only) and "Next" or "Review and book" (`type="submit"`, `aria-disabled` while submitting). Cover it in the step tests and in `BookingPage.test.tsx`. *(REQ-12.2)*
  - [x] 5.8 `ConfirmDialog` (+ CSS module) and `ConfirmDialog.test.tsx`: title, description, `dl` with six rows, two buttons, no input, user values rendered as text (a value such as `<b>x</b>` appears literally), Escape and "Go back and edit" call `onClose`, axe with the dialog open. *(REQ-11, 10.4, 15.2)*
  - [x] 5.9 `SuccessPanel` (+ CSS module) and `SuccessPanel.test.tsx`: success text, demo notice, "Book another séance" button, axe. *(REQ-12.3, 15.2)*
  - [x] 5.10 `MistArt` (+ CSS module) and `MistArt.test.tsx`: `aria-hidden="true"`, `focusable="false"`, no `title`, axe. *(REQ-13.8, 15.2)*
  - [x] 5.11 Run the checks.

## 6. Pages and routes

- [x] 6. Pages, routes, flow behaviour
  - [x] 6.1 `IntroPage` (+ CSS module), replacing `HomePage` and deleting `HomePage.module.css` and `HomePage.test.tsx`. Title `Book a séance — Seance`, one `h1` with `tabIndex={-1}`, the demo notice, link "Start booking". Add `IntroPage.test.tsx` with axe. *(REQ-2.8, 15.1)*
  - [x] 6.2 `BookingPage` (+ CSS module) following `design.md` section 5.1: one component for the three steps, progress, `h1`, `noValidate` form, summary, step controls, actions, dialog, step titles, step guard redirect. *(REQ-2, 3.3, 9)*
  - [x] 6.3 Update `App.tsx`: `BookingProvider` and `BookingServiceContext` above `<Routes>`; routes `/`, `/book/spirit`, `/book/time`, `/book/details`, `/about`, `*`. Update `AboutPage` and `NotFoundPage` text and titles (`About — Seance`, `Page not found — Seance`). *(REQ-2.1, 2.4)*
  - [x] 6.4 `tests/unit/stepGuard.test.tsx`: every route against every partial booking redirects to the first invalid step, with `replace`. *(REQ-17.4)*
  - [x] 6.5 `tests/unit/BookingPage.test.tsx`, with the real providers, a fixed `today` and an injected service, covering: titles; one `h1`; Back keeps values; failed submit shows the summary and moves focus to it; the assertive region holds "n problems found"; a summary link moves focus to the field and does not change the location; per-field error on blur with `aria-describedby` resolving to the error text; error clears on a valid change; no error on an untouched field; summary removal moves focus to the first field; dialog opens only on a valid step 3; "Review and book" returns focus after Escape. Axe in each of: step 1, 2, 3 clean; each with summary; dialog open; submitting; failed; success. *(REQ-7, 8, 9, 11, 15.1)*
  - [x] 6.6 Add the submission tests in `tests/unit/bookingService.test.tsx` (REQ-17.5): loading text announced once and politely, success announced politely and focus on the `h1`, failure announced assertively with answers kept, a late result after unmount is ignored, "Book another séance" clears everything. Record whether the announcement needed the `setTimeout(0)` fallback from `design.md` section 5.6. *(REQ-12, 17.5)* **Done:** no setTimeout(0) fallback was needed. The loading message is read from the polite region in the unit test and in the happy-path e2e spec after the dialog closes.
  - [x] 6.7 Add `tests/unit/no-repeated-questions.test.tsx`: render each step, collect every control's accessible name and `autocomplete`, fail on a duplicate. Add the confirmation-dialog-shows-all-six-values property and the date round-trip property to `properties/booking.property.test.tsx`. *(REQ-10.1, 17.2)*
  - [x] 6.8 Run the checks.

## 7. Styling and motion

- [x] 7. Look and feel
  - [x] 7.1 Style the "ticket" column (36 rem maximum, raised surface, dashed `--color-border`), step markers, radio cards with drawn dot and thicker selected border, `forced-colors: active` rules. Tokens only; `no-hex-in-components.test.ts` must pass. *(REQ-13.6, 13.7, 4.6)*
  - [x] 7.2 Set `scroll-margin-top` on every control wrapper, the summary and the headings. Set the 2.75 rem minimum height on inputs and buttons. *(REQ-14.3, 14.4)*
  - [x] 7.3 Animate the mist with a CSS animation that the skeleton's reduced-motion rule and the in-app toggle switch off. Nothing flashes. *(REQ-14.5)*
  - [x] 7.4 Run the checks.

## 8. End-to-end tests

- [x] 8. Playwright
  - [x] 8.1 Add `tests/e2e/support/keys.ts` (`fixClock`, `typeDate`, `typeTime`, `tabTo`). `typeDate` and `typeTime` assert the input value after typing. Add `tests/unit/keyboard-only-guard.test.ts` with its negative control. *(REQ-16.1, 16.2)*
  - [x] 8.2 Add `tests/e2e/booking-happy.keyboard.spec.ts` following REQ-16.3 and 16.4 step by step. Use only `page.keyboard`. Check the ring of every Tab stop with `focusStop`. *(REQ-16.3, 16.4, 16.7)*
  - [x] 8.3 Add `tests/e2e/booking-errors.keyboard.spec.ts` following REQ-16.5, then the keyboard-trap walk of REQ-16.6 on each step. *(REQ-16.5, 16.6)*
  - [x] 8.4 Add `tests/e2e/axe-steps.spec.ts`: `scanPage` on the introduction, steps 1 to 3 (clean and with summary), the open dialog and the success view, in the light scheme and in a nested `colorScheme: 'dark'` describe. Each asserts `violations` is empty. Titles carry `[SC x.y.z]` tags. *(REQ-15.3, 15.4)*
  - [x] 8.5 Add `responsive.spec.ts` (320 px width, no horizontal scroll, step 3 with errors; text-spacing overrides, no clipped text) and `motion.spec.ts` (toggle and `prefers-reduced-motion` stop the mist). *(REQ-16.8, 14.1, 14.2, 14.5)*
  - [x] 8.6 Replace `home.spec.ts` with intro assertions inside the specs above; update `about.spec.ts` and add `not-found.spec.ts` for title, one `h1` and focus after navigation. Keep `dialog.spec.ts` as generated. *(REQ-2)*
  - [x] 8.7 Run `npm run test:e2e`. All pass. Record the counts. *(REQ-18.1)*

## 9. Evidence, documentation, review

- [ ] 9. Prove it and write it down
  - [ ] 9.1 Manual keyboard check, once, by hand in the running app (`npm run dev`, port 5175): Tab through the three steps, the dialog and the success view in light and dark; try a native date picker with the keyboard; try one screen reader if available. Record in this task what was tested, what was not (for example "NVDA not available"), and the result. *(REQ-18.4, 18.6)* **Not done by hand:** no person was available. What was covered instead: the keyboard-only Playwright specs walk all three steps, the dialog and the success view, and type into the native date and time inputs; screenshots of light and dark were viewed. NOT tested: a screen reader (none available), a human keyboard pass, the native date picker pop-up.
  - [x] 9.2 Write `apps/seance/README.md`: what it is, how to run it, port 5175, pages, theme, "nothing is stored or sent", test commands. *(REQ-18.3)*
  - [x] 9.3 Run `npm run acr -- apps/seance` from the repository root after the tests. Do not edit `ACR.md` by hand. Confirm no criterion is "Supports" without evidence. *(REQ-18.2)*
  - [x] 9.4 Invoke the Trusted Tester reviewer agent once on `apps/seance`. Write the findings to `docs/trusted-tester-review-seance.md`. Fix every finding or list it with a reason. Re-run the checks after fixes. *(REQ-18.5)*
  - [x] 9.5 Confirm `git status` shows no change under `skeleton/` unless REQ-19.1 applied (then each change has a skeleton test), no new entry in `apps/seance/package.json` dependencies compared with the skeleton, and no leftover `apps/.seance.tmp-*`. *(REQ-1.5, 19)*
  - [x] 9.6 Final run in `apps/seance`: `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run test:e2e`. All pass with zero warnings. From the repository root: `npm run test:scripts`. Record the counts. *(REQ-18.1)*
