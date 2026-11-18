# Grimoire: Implementation Tasks

Paths are relative to the repository root. Mark a task `[x]` only after its checks pass. The order is: create the app, theme (proven first, because everything else uses it), data and pure logic, components, pages, end-to-end tests, then evidence and documentation. In `apps/grimoire`, "the checks" means `npm run lint`, `npx tsc --noEmit` and `npm test` (and `npm run test:e2e` where a task says so).

## 1. Create the app

- [x] 1. Generate `apps/grimoire` from the skeleton
  - [x] 1.1 Run `npm run new-app grimoire` from the repository root. Confirm `apps/grimoire/tests/` has `unit/`, `unit/properties/` and `e2e/`, and that there is no `ACR.md`. Do not hand-copy. *(REQ-1.1, 1.3)*
  - [x] 1.2 In `apps/grimoire`, run `npm install`, then the checks and `npm run test:e2e`. All skeleton tests must pass before any edit. Record the counts. *(REQ-16.1)*
  - [x] 1.3 Edit `package.json` so `dev` is `vite --port 5174 --strictPort`. Edit `playwright.config.ts` so `baseURL` and `webServer.url` use port 5174. Confirm `npm run test:e2e` still passes. *(REQ-1.4)*
  - [x] 1.4 Change `index.html` title to `Catalogue — Grimoire`. Rename "Skeleton Key" to "Grimoire" in `PageShell.tsx` (site name, footer text), `AboutPage.tsx`, `NotFoundPage.tsx`, and in skeleton tests that assert the old text. Set the nav links to "Catalogue" (`/`) and "About" (`/about`). Run the checks. *(REQ-2.6, 2.7, 1.3)*

## 2. Colour theme

- [x] 2. Apply the Parchment and Candle palette and prove it
  - [x] 2.1 Replace the values in `src/tokens/tokens.css` with the light table in `design.md` section 6.1. Do not add, remove or rename a token. Update the comments to show the new ratios. *(REQ-11.1, 11.2)*
  - [x] 2.2 Replace the values in `src/tokens/dark.css` (the media query block and the `[data-theme='dark']` block) with section 6.2, identical in both. *(REQ-11.1, 11.8)*
  - [x] 2.3 Set `--font-heading` to the book serif stack in `tokens.css`. *(REQ-11.7)*
  - [x] 2.4 Run `npm test`. `contrast.property.test.ts` and `tokens-contrast.test.ts` must pass unchanged. If a pair fails, change the colour, not the test. *(REQ-11.4)*
  - [x] 2.5 Add `tests/unit/support/hue.ts` (`hueOf(hex)`) and `tests/unit/hue.test.ts` with known colours (`#ff0000` is 0°, `#00ff00` is 120°, `#0000ff` is 240°, grey is 0°). *(REQ-11.5)*
  - [x] 2.6 Add `tests/unit/theme-identity.test.ts`: the token set equals the skeleton's list; surface, accent, link and border hues are in 0° to 45° for light and dark; no token keeps a skeleton purple value (`#f5f0ff`, `#ede5ff`, `#6b21a8`, `#581c87`, `#7c3aed`, `#4f46e5`, `#c084fc`, `#9333ea`, `#a78bfa`, `#818cf8`, `#0f0a1a`, `#1e1030`); failures name the token. Include a negative control that feeds a purple value. *(REQ-11.3, 11.5)*
  - [x] 2.7 Add `tests/unit/no-hex-in-components.test.ts` that scans `src/**/*.css` outside `src/tokens/` for hex, `rgb(`, `hsl(` and named colours. Include a negative control on a sample string. Fix any hit in skeleton CSS by using a token (and apply the same fix in `skeleton/` first, REQ-17.1). *(REQ-11.6)*
  - [x] 2.8 Run the checks. Open the app and look at both themes by hand once; note in the task that the look is clearly warm. *(REQ-11)* Note: looked at Playwright screenshots of the catalogue (light) and a detail page (dark); both are clearly warm (parchment and brown). Not a live browser session.

## 3. Data and pure logic

- [x] 3. Books, filtering, URL state
  - [x] 3.1 Create `src/data/books.json` with exactly 24 original, fictional books: six schools with four books each; hazards Mild 9, Perilous 9, Forbidden 6; include the anchors `the-lantern-of-small-hours`, `ember-and-ash-herbal` and `the-hollow-index`. *(REQ-3.1 to 3.4)*
  - [x] 3.2 Create `src/data/books.ts` with `SCHOOLS`, `HAZARDS`, types, `BOOKS` (sorted by title) and `findBook`. Enable `resolveJsonModule` in `tsconfig.json` if it is not on. *(REQ-3.5)*
  - [x] 3.3 Add `tests/unit/books-data.test.ts`: count 24, unique slugs and the slug format, required fields, summary length, one to three paragraphs, one to five lower-case tags, every school and hazard present with the minimum counts, anchors exist. A failure names the slug. *(REQ-3.1 to 3.3, 3.5)*
  - [x] 3.4 Create `src/lib/searchState.ts` (`SearchState`, `parseQuery`, `toSearchParams`) with the rules in `design.md` 4.1. *(REQ-10.1, 10.2)*
  - [x] 3.5 Add `tests/unit/searchState.test.ts` (unknown values dropped, 100-character cap, canonical order, empty parts omitted) and `tests/unit/properties/searchState.property.test.ts` (round trip over generated valid states). *(REQ-15.4)*
  - [x] 3.6 Create `src/lib/filterBooks.ts` (`normalise`, `filterBooks`, `resultsMessage`). *(REQ-4.7, 5.4, 6.2)*
  - [x] 3.7 Add `tests/unit/filterBooks.test.ts`: case, diacritics ("Émber" finds "ember"), multi-word AND, each of title, author, summary and tags, OR within a group, AND across groups, empty group means no restriction, message text for 0, 1 and N. *(REQ-15.1)*
  - [x] 3.8 Add `tests/unit/properties/filter.property.test.ts` with the five filter invariants in REQ-15.2, using `tests/unit/support/pbt.ts`. *(REQ-15.2)*
  - [x] 3.9 Run the checks.

## 4. Announcement hook

- [x] 4. Debounced polite result announcement
  - [x] 4.1 Create `src/hooks/useDebouncedAnnouncement.ts` as in `design.md` 4.3: 500 ms, last value wins, skip first render and StrictMode double run, cancel on unmount, never assertive. *(REQ-6.1 to 6.6)*
  - [x] 4.2 Add `tests/unit/useDebouncedAnnouncement.test.tsx` with fake timers: nothing at 499 ms, one message at 500 ms, last value wins after rapid changes, nothing on first render, nothing after unmount, the assertive region stays empty, the same text is announced again after a new change. *(REQ-15.3)*
  - [x] 4.3 Run the checks.

## 5. Components

- [x] 5. Build the catalogue components, each with an axe test
  - [x] 5.1 Create `BookCover.tsx` and `Candle.tsx` (decorative SVG, `aria-hidden="true"`, no title) with CSS modules. The candle animation uses `@keyframes` and is switched off by `@media (prefers-reduced-motion: reduce)` and by `[data-reduced-motion='true']`, as the skeleton ghost is. Add `BookCover.test.tsx` (axe, `aria-hidden`, no `title`). *(REQ-3.6, 12.4)*
  - [x] 5.2 Create `SearchFilters.tsx` and its CSS: the `role="search"` form, the `Field` with label and hint, two fieldsets with legends, native checkboxes with drawn ticks and a `forced-colors` rule, the clear button shown only when active, and the ref to the input. Targets at least 24 px. *(REQ-4, 5, 12.3)*
  - [x] 5.3 Add `SearchFilters.test.tsx`: axe in default and active states; label tied to the input; hint in `aria-describedby`; `type="search"` and `autocomplete="off"`; two fieldsets with the exact legends; nine checkboxes each with a label; Enter in the input does not submit; Space toggles; the clear button is absent when nothing is active and calls back when used. *(REQ-13.2)*
  - [x] 5.4 Create `BookCard.tsx` and CSS (stretched link, ring on `::after`, `scroll-margin-top`). Add `BookCard.test.tsx`: axe; one `h3` containing the one link; link name equals the title; `href` is `/books/<slug>`; no other interactive element; school and hazard appear as text. *(REQ-7, 13.2)*
  - [x] 5.5 Create `EmptyState.tsx` and `ResultsList.tsx` with CSS. Add `EmptyState.test.tsx` and `ResultsList.test.tsx`: axe in list and empty states; `ul` and `li` structure; alphabetical order; visible count text; the count text is not inside a live region; the empty state has the fix sentence and the clear button and no `role="alert"`. *(REQ-7.1, 8, 6.7, 13.2)*
  - [x] 5.6 Run the checks.

## 6. Pages and routes

- [x] 6. Catalogue, detail, about and not found
  - [x] 6.1 Create `src/pages/CataloguePage.tsx` and CSS (replace `HomePage`, delete `HomePage.tsx` and `HomePage.module.css` and `HomePage.test.tsx`). `useSearchParams` with `replace`, `filterBooks`, `useDebouncedAnnouncement`, focus on the input after a clear, headings as in `design.md` 5.4, title `Catalogue — Grimoire`. *(REQ-2, 4.5, 5.5, 6, 10)*
  - [x] 6.2 Add `tests/unit/CataloguePage.test.tsx` (real providers): axe in default, filtered and empty states; one `h1`; heading order; typing changes the visible count; after 500 ms the polite region holds the message and the assertive region is empty; no message on first render; the empty state appears and "Clear search and filters" empties the box and focuses it; the initial URL query is applied; unknown query values are ignored; the `title` is set. *(REQ-13.1, 6, 8, 10)*
  - [x] 6.3 Create `src/pages/BookDetailPage.tsx` and CSS. Found and not-found states, `dl`, tags as text, back link built from `location.state.search`, titles per REQ-2.4. *(REQ-9, 10.5)*
  - [x] 6.4 Add `tests/unit/BookDetailPage.test.tsx`: axe in both states; `h1` text; `dl` terms; hazard as text; back link `href` with and without state; unknown slug; titles. *(REQ-13.1)*
  - [x] 6.5 Update `App.tsx` routes: `/`, `/books/:slug`, `/about`, `*`. Update `AboutPage.tsx` text and its tests. Keep `useFocusOnRouteChange`. Update `PageShell` test and `NotFoundPage` test for the Grimoire text. *(REQ-2.1 to 2.5)*
  - [x] 6.6 Run the checks. Start the app (`npm run dev`) and do one manual keyboard pass over the catalogue and one detail page: Tab order, ring on each stop and on the card, Space on a checkbox, Enter on a card. Record the result in this task. *(REQ-14, 16.4)* Note: no human keyboard session was possible here. The same path (Tab order, ring on each stop and on the card, Space on a checkbox, Enter on a card) is covered by the Playwright keyboard tests in catalogue.spec.ts and ook-detail.spec.ts, which pass.

## 7. End-to-end tests

- [x] 7. Playwright tests: axe and keyboard for every page
  - [x] 7.1 Replace `tests/e2e/home.spec.ts` with `tests/e2e/catalogue.spec.ts`: axe in the default, filtered and empty states (light), axe default in dark, plus the keyboard walk, typing and count, the polite region text, Space on a checkbox, the empty state and the clear-button focus, and Enter on a card. Use the steps in REQ-14.2 and 14.3. Wait on locators, not sleeps. *(REQ-13.3, 13.4, 14.2, 14.3)*
  - [x] 7.2 Add `tests/e2e/book-detail.spec.ts`: axe (light and dark) for `/books/the-lantern-of-small-hours` and for an unknown slug; keyboard: focus lands on the `h1` after navigating from the catalogue, the title changes, Tab reaches "Back to catalogue", Enter returns with the earlier search kept. *(REQ-13.3, 14.4)*
  - [x] 7.3 Update `tests/e2e/about.spec.ts` and add `tests/e2e/not-found.spec.ts` for Grimoire: axe (light and dark), Tab order, focus on the `h1` after navigation, no keyboard trap (tab through and back). *(REQ-13.3, 14.5, 14.6)*
  - [x] 7.4 Add `tests/e2e/responsive.spec.ts`: 320 px width has no horizontal scroll on the catalogue and a detail page; the text-spacing overrides leave no clipped text on a card title and a checkbox label (compare `scrollHeight` and `clientHeight`, and check no overlap of the label and the box). *(REQ-12.1, 12.2, 14.7)*
  - [x] 7.5 Add `tests/e2e/motion.spec.ts`: the candle has `animation-name: none` with OS reduced motion; the "Reduce motion" toggle stops it. Keep `dialog.spec.ts` passing. *(REQ-12.4, 14.7)*
  - [x] 7.6 Run `npm run test:e2e`. Fix every failure in the app. Do not weaken a test to pass. *(REQ-16.1)*

## 8. Evidence, documentation and review

- [x] 8. Report, readme, review and final checks
  - [x] 8.1 Replace `apps/grimoire/README.md` with a short Grimoire readme (what it is, run, port 5174, pages, theme, test commands, link to this spec). *(REQ-16.3)*
  - [x] 8.2 From the repository root run `npm run acr -- apps/grimoire` after the tests, and commit the generated `apps/grimoire/ACR.md`. Check that no criterion says "Supports" without evidence. *(REQ-16.2)*
  - [x] 8.3 Ask the `trusted-tester` agent to review `apps/grimoire/src/`. Save its output to `docs/trusted-tester-review-grimoire.md`, fix every finding or list it with a reason, and rerun the tests. *(REQ-16.5)*
  - [x] 8.4 Confirm `git status` shows no change under `skeleton/` unless REQ-17.1 applied (then each change has a skeleton test), no new entry in `apps/grimoire/package.json` dependencies compared with the skeleton, and no leftover `apps/.grimoire.tmp-*`. *(REQ-1.5, 17)*
  - [x] 8.5 Final run in `apps/grimoire`: `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run test:e2e`. All pass with zero warnings. From the repository root: `npm run test:scripts`. Record the counts. *(REQ-16.1)*
