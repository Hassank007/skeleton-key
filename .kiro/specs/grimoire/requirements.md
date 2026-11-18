# Grimoire: Requirements

This spec describes `apps/grimoire`, a spooky catalogue of spellbooks. It is created with `npm run new-app grimoire` (see `.kiro/specs/new-app-script/`) and then customised. Requirements use EARS notation. Every requirement that affects accessibility names the WCAG 2.2 success criterion (SC) it protects.

**Scope.** Everything inside `apps/grimoire/`: pages, components, local data, colour theme, and tests. Out of scope: a back end, user accounts, saving favourites, pagination (24 books fit on one page), and changes to `skeleton/` unless REQ-17 applies. Seance is a separate spec.

**Terms.**
- *Skeleton*: the `skeleton/` folder. *Announcer*: the shared live-region announcer (`useAnnounce`, `AnnouncerContext`) that the skeleton provides.
- *Book*: one spellbook record in the local JSON data.
- *School*: the kind of magic a book teaches (Necromancy, Divination, Illusion, Herbalism, Warding, Alchemy). *Hazard*: how dangerous the book is to read (Mild, Perilous, Forbidden).
- *Card*: one item in the results list. *Settled*: no search or filter change for 500 ms.
- *Warm band*: hues 0° to 45° on the HSL colour wheel. *Cool band*: hues 160° to 280°.

---

## REQ-1 Creation from the skeleton

**User story:** As a maintainer, I want Grimoire generated from the skeleton, so that it inherits the accessible shell and its tests.

### Acceptance criteria

- 1.1 The system SHALL create `apps/grimoire` by running `npm run new-app grimoire` from the repository root. The files SHALL NOT be copied by hand.
- 1.2 The app SHALL be a standalone Vite project with its own `package.json` named `grimoire`, so it can be deployed on its own.
- 1.3 The app SHALL keep every skeleton test (`tests/unit/`, `tests/unit/properties/`, `tests/e2e/`) and the skeleton primitives (`Button`, `AppLink`, `Field`, `Dialog`, `Toast`, `Tabs`) unchanged in behaviour. Skeleton tests that name "Skeleton Key" MAY be edited only to name Grimoire.
- 1.4 The app SHALL serve its dev server and Playwright web server on port 5174 with `--strictPort`, so a Playwright run cannot silently test another app that is already running on port 5173.
- 1.5 The system SHALL NOT add a runtime or development dependency to Grimoire. The design document records this (tech rule).

---

## REQ-2 Page shell and routes

**User story:** As a keyboard or screen-reader user, I want every page to have the same predictable structure, so that I can find my way (WCAG 1.3.1, 2.4.x, 3.2.3).

### Acceptance criteria

- 2.1 The app SHALL have these routes: `/` (catalogue), `/books/:slug` (book detail), `/about`, and a fallback `*` (page not found).
- 2.2 Every page SHALL be rendered inside the skeleton `PageShell`: skip link as the first focusable element, one `header`, one labelled `nav`, exactly one `main`, one `footer` *(SC 1.3.1, 2.4.1)*.
- 2.3 Every page SHALL have exactly one `h1`, and headings SHALL NOT skip levels *(SC 1.3.1, 2.4.6)*.
- 2.4 WHEN a page is shown, THEN the system SHALL set a unique `document.title` of the form `<Page> — Grimoire`. The detail page SHALL use the book title, the not-found state SHALL use `Spellbook not found — Grimoire` and the fallback SHALL use `Page not found — Grimoire` *(SC 2.4.2)*.
- 2.5 WHEN the pathname changes, THEN the system SHALL move focus to the new page `h1` (which has `tabindex="-1"`) and announce the page title through the announcer, using the skeleton's `useFocusOnRouteChange` *(SC 2.4.3, 4.1.3)*.
- 2.6 The shell text SHALL say "Grimoire", not "Skeleton Key", in the header site name, the footer, `index.html` and the page titles. The header navigation SHALL contain the links "Catalogue" and "About" in the same order on every page *(SC 3.2.3)*.
- 2.7 The `lang` attribute of `index.html` SHALL stay `en` *(SC 3.1.1)*.

---

## REQ-3 Local data

**User story:** As a developer, I want a small, validated local data set, so that the catalogue works offline and tests do not depend on a server.

### Acceptance criteria

- 3.1 The system SHALL provide `src/data/books.json` with exactly 24 books and no network request.
- 3.2 Each book SHALL have: `slug` (unique, lower-case, hyphenated), `title`, `author`, `school`, `hazard`, `year` (text, for example `c. 1347`), `pages` (positive integer), `summary` (one sentence, at most 160 characters), `description` (array of one to three paragraphs), and `tags` (array of one to five lower-case words).
- 3.3 The data SHALL cover all six schools and all three hazards. Each school SHALL have at least three books and each hazard at least five, so no single filter produces an empty result.
- 3.4 The content SHALL be original text written for this project. Titles and authors SHALL be fictional.
- 3.5 The system SHALL load the data through a typed module (`src/data/books.ts`). A unit test SHALL validate every rule in 3.1 to 3.3 against the real file and fail with the slug of the offending book.
- 3.6 Every piece of book information SHALL be real text. Book "covers" SHALL be decorative inline SVG with `aria-hidden="true"` and SHALL NOT carry meaning *(SC 1.1.1)*.

---

## REQ-4 Search box

**User story:** As a user, I want to type a word and see matching books, so that I can find a book quickly.

### Acceptance criteria

- 4.1 The catalogue page SHALL contain one text search input inside a `form` with `role="search"` and an accessible name "Catalogue search" *(SC 1.3.1, 2.4.6)*.
- 4.2 The input SHALL have a visible `<label>` ("Search spellbooks") tied with `for`/`id`, built with the skeleton `Field` component. A placeholder SHALL NOT be the only label *(SC 3.3.2, 4.1.2)*.
- 4.3 The input SHALL have a hint linked with `aria-describedby`: "Searches title, author, summary and tags." *(SC 3.3.2)*.
- 4.4 The input SHALL be `type="search"` with `autocomplete="off"` (the value is not personal data, so no token from SC 1.3.5 applies).
- 4.5 WHEN the user types, THEN the system SHALL update the results as they type, without a submit button and without moving focus or changing the page context *(SC 3.2.2)*.
- 4.6 WHEN the user presses Enter in the input, THEN the system SHALL NOT reload the page or navigate.
- 4.7 The search SHALL be case-insensitive and ignore diacritics. The search text SHALL be split on whitespace and every word SHALL match somewhere in the title, author, summary or tags of a book.
- 4.8 The input SHALL be at least 24 × 24 CSS px and SHALL show the focus ring *(SC 2.4.7, 2.5.8)*.

---

## REQ-5 Filters

**User story:** As a user, I want to narrow the list by school and hazard, so that I only see books I care about.

### Acceptance criteria

- 5.1 The catalogue page SHALL contain two `fieldset` elements, each with a `legend`: "School of magic" (six checkboxes) and "Hazard" (three checkboxes) *(SC 1.3.1, 3.3.2)*.
- 5.2 Each checkbox SHALL be a native `<input type="checkbox">` with a visible `<label>` tied with `for`/`id`. The checked state SHALL be visible with a mark and not by colour alone *(SC 1.4.1, 4.1.2)*.
- 5.3 The checkbox labels SHALL be static text (no result counts), so they do not change while the user works.
- 5.4 The filter logic SHALL be: within one fieldset, a book matches if it has any checked value (OR). Across the two fieldsets and the search text, a book SHALL match all active parts (AND). A fieldset with nothing checked SHALL add no restriction.
- 5.5 WHEN at least one filter or the search text is active, THEN the system SHALL show a "Clear search and filters" `button`. WHEN the user activates it, THEN the system SHALL clear the search text and all checkboxes and move focus to the search input *(SC 2.4.3)*.
- 5.6 WHEN no filter and no search text is active, THEN the system SHALL NOT render the clear button, so no focused control disappears without focus being moved.
- 5.7 Each checkbox and its label SHALL form a target of at least 24 × 24 CSS px *(SC 2.5.8)*.
- 5.8 Space SHALL toggle a focused checkbox and Tab / Shift+Tab SHALL move between controls in visual order *(SC 2.1.1, 2.4.3)*.

---

## REQ-6 Result count announcement

**User story:** As a screen-reader user, I want to hear how many books match, so that I know the list changed without hunting for it (WCAG 4.1.3).

### Acceptance criteria

- 6.1 WHEN the search text or any filter has changed and the inputs have been settled for 500 ms, THEN the system SHALL send one message to the shared announcer with the default (polite) priority.
- 6.2 The message SHALL be `N spellbooks found`, `1 spellbook found`, or `No spellbooks found` (with a short suggestion allowed after it, see REQ-8.3).
- 6.3 IF the user changes the inputs again before 500 ms have passed, THEN the system SHALL cancel the pending message and send only the last one (debounce, last value wins).
- 6.4 The system SHALL NOT announce on first render or on navigation back from a detail page, because the route-change announcement already covers it *(REQ-2.5)*.
- 6.5 The system SHALL NOT use the assertive priority for result counts, and SHALL NOT render its own `aria-live` or `role="status"` element. The only live regions on the page SHALL be the two that the announcer owns *(SC 4.1.3)*.
- 6.6 WHEN the component unmounts, THEN the system SHALL cancel any pending message.
- 6.7 The page SHALL also show the count as visible text ("24 spellbooks") in the results section so sighted users get the same information. This text SHALL NOT be a live region.

---

## REQ-7 Results list and cards

**User story:** As a user, I want each book to be one clear item with one link, so that I can scan the list and open a book without hearing the same link twice.

### Acceptance criteria

- 7.1 The results SHALL be in a `ul` with one `li` per book, inside a `section` named by its `h2` ("Results"), in alphabetical order by title *(SC 1.3.1)*.
- 7.2 Each card SHALL contain a heading (`h3`) that holds the only link of the card. The link text SHALL be the book title and the link SHALL go to `/books/<slug>` *(SC 2.4.4, 2.4.6)*.
- 7.3 The link SHALL be stretched over the whole card with a CSS pseudo-element, so the whole card is clickable while the card has exactly one link and one tab stop. The card text (author, school, hazard, summary) SHALL be real text outside the link.
- 7.4 The card SHALL show school and hazard as text. The hazard SHALL NOT be shown only with colour or an icon *(SC 1.4.1)*.
- 7.5 A card SHALL NOT contain a button, a nested link, or any other interactive element *(SC 4.1.2)*.
- 7.6 WHEN the link has keyboard focus, THEN the card SHALL show a focus indicator of at least 3 px with at least 3:1 contrast against the surface it is drawn on, and the card SHALL NOT be hidden under the sticky header *(SC 2.4.7, 2.4.11, 1.4.11)*.
- 7.7 The link target SHALL be at least 24 × 24 CSS px *(SC 2.5.8)*.
- 7.8 The cards SHALL reflow to one column at 320 CSS px width without horizontal scrolling *(SC 1.4.10)*.

---

## REQ-8 Empty state

**User story:** As a user, I want a clear message when nothing matches, so that I know what to do next.

### Acceptance criteria

- 8.1 IF no book matches, THEN the system SHALL replace the list with an empty state inside the results section: the text "No spellbooks found" and a sentence that says how to fix it ("Try a shorter search or clear some filters.") *(SC 3.3.3)*.
- 8.2 The empty state SHALL include the "Clear search and filters" button of REQ-5.5. The empty state SHALL NOT use `role="alert"`.
- 8.3 The announcement for an empty result SHALL be `No spellbooks found. Try a shorter search or clear some filters.`, sent once and politely *(SC 4.1.3)*.
- 8.4 The empty state SHALL be real text. A decorative ghost or empty-book illustration MAY be added and SHALL be `aria-hidden="true"`.
- 8.5 The empty state SHALL NOT appear while at least one book matches.

---

## REQ-9 Detail page

**User story:** As a user, I want a page per book with all of its details, so that I can read about it.

### Acceptance criteria

- 9.1 The route `/books/:slug` SHALL show the book with that slug: `h1` with the title, a decorative cover, a `dl` with author, school, hazard, year and pages, the description paragraphs, and the tags as text *(SC 1.3.1)*.
- 9.2 The page SHALL have a "Back to catalogue" link as a real `a` that returns to `/` with the search and filters the user had (REQ-10) *(SC 2.4.4, 3.3.7)*.
- 9.3 IF the slug matches no book, THEN the page SHALL render an `h1` "Spellbook not found", a sentence that says the book does not exist, and the back link. The title SHALL follow REQ-2.4.
- 9.4 The detail page SHALL contain no meaning that is only in the cover art, and the hazard SHALL appear as text *(SC 1.1.1, 1.4.1)*.
- 9.5 The page SHALL NOT trap focus and SHALL NOT start any animation that cannot be stopped *(SC 2.1.2, 2.2.2)*.

---

## REQ-10 Search state in the address

**User story:** As a user, I want the Back button to bring me to the same results, so that I do not have to enter my search again (WCAG 3.3.7).

### Acceptance criteria

- 10.1 The system SHALL keep the search text and checked filters in the URL query: `q`, repeated `school` and repeated `hazard` (for example `/?q=ember&school=alchemy&hazard=mild`).
- 10.2 WHEN the page loads with a query, THEN the system SHALL apply it before the first paint of the list. Unknown `school` or `hazard` values SHALL be ignored.
- 10.3 WHEN the user types or toggles a filter, THEN the system SHALL update the URL with `replace`, so the history does not fill with one entry per key press.
- 10.4 A change of the query only (same pathname) SHALL NOT move focus and SHALL NOT trigger the route-change announcement *(SC 3.2.2)*.
- 10.5 Each card link SHALL pass the current query string in `location.state` (`{ search }`). The detail page "Back to catalogue" link SHALL go to `/` plus that query string. IF the detail page was opened directly, THEN the link SHALL go to plain `/`.
- 10.6 The browser Back button SHALL also return to the catalogue with the query still in the address, because the query updates use `replace` (10.3).

---

## REQ-11 Colour theme

**User story:** As a team, I want Grimoire to have its own look, so that it is clearly different from Seance and from the skeleton, while still using the token system.

### Acceptance criteria

- 11.1 Grimoire SHALL change only the values in `src/tokens/tokens.css` (light) and `src/tokens/dark.css` (dark media query and `[data-theme='dark']`). It SHALL NOT add, remove or rename a `--color-*` token, so the existing token matrix covers every colour that is drawn.
- 11.2 The light theme SHALL be "aged parchment and candle ink": a warm cream surface, deep brown text, a crimson accent and link, a bronze border, and a teal focus ring. The dark theme SHALL be "candlelit library": a near-black brown surface, cream text, an amber link and a burnt-orange accent.
- 11.3 The surface, accent, link and border tokens in both themes SHALL have a hue in the warm band. The skeleton's purple values SHALL NOT remain in any token. The Seance spec SHALL use the cool band, so the two apps differ by hue family and not only by shade.
- 11.4 The existing skeleton tests, copied unchanged, SHALL prove contrast on the real Grimoire CSS: `tests/unit/properties/contrast.property.test.ts` (text 4.5:1, UI and focus ring 3:1, light and both dark sources) and `tests/unit/tokens-contrast.test.ts` (white text on the accent and accent-hover fills, 4.5:1). Grimoire SHALL NOT weaken, skip or replace them *(SC 1.4.3, 1.4.11)*.
- 11.5 Grimoire SHALL add `tests/unit/theme-identity.test.ts` that reads the real CSS and checks 11.1 and 11.3, and that fails with the token name when a rule is broken.
- 11.6 Components SHALL use tokens only (`var(--color-*)`, `--space-*`, `--font-*`). The CSS SHALL NOT contain a hex colour outside the token files. A unit test SHALL scan `src/**/*.css` and fail on one.
- 11.7 The heading font SHALL be a serif stack set through the existing `--font-heading` token to give the page a book-like feel. The body font SHALL stay readable and system-provided.
- 11.8 The dark theme SHALL apply with `prefers-color-scheme: dark` and with `[data-theme='dark']`, with identical values *(existing rule, REQ-3.4 of a11y-pbt)*.

---

## REQ-12 Responsive, text and motion

**User story:** As a user with low vision or a vestibular disorder, I want the page to adapt to my settings, so that I can read and use it comfortably.

### Acceptance criteria

- 12.1 At 320 CSS px width (400% zoom) every page SHALL work with no horizontal scrolling and no clipped content, except the data that needs two dimensions (there is none in Grimoire) *(SC 1.4.10)*.
- 12.2 WHEN the WCAG text-spacing overrides are applied (line height 1.5, paragraph spacing 2× font size, letter spacing 0.12 em, word spacing 0.16 em), THEN no text SHALL be clipped or overlap, including card titles and checkbox labels *(SC 1.4.12)*.
- 12.3 Interactive targets SHALL be at least 24 × 24 CSS px *(SC 2.5.8)*.
- 12.4 Grimoire MAY show one decorative animation (a flickering candle in the catalogue header). It SHALL be `aria-hidden="true"`, SHALL stop under `prefers-reduced-motion: reduce` and under the in-app "Reduce motion" toggle, and SHALL use no flash faster than three per second *(SC 2.2.2, 2.3.1, 2.3.3)*.
- 12.5 Hover and focus transitions SHALL use `--duration-fast` / `--duration-normal`, so the toggle turns them off.
- 12.6 Content SHALL NOT depend on hover. Everything shown on hover SHALL also show on focus *(SC 1.4.13)*.

---

## REQ-13 Axe tests for every page

**User story:** As a maintainer, I want every page scanned by axe, so that a regression is caught on the same day (steering: "every component and page has an axe test").

### Acceptance criteria

- 13.1 Every page and state SHALL have a Vitest + `vitest-axe` test with zero violations: catalogue (default, with results filtered, empty state), book detail (found and not found), about, and not found.
- 13.2 Every new component SHALL have its own axe unit test: `SearchFilters`, `BookCard`, `ResultsList`, `EmptyState`, `BookCover`.
- 13.3 Every page SHALL have a Playwright + `@axe-core/playwright` test using the skeleton `scanPage` helper with the WCAG 2.2 AA tag set, in the light scheme and again with `colorScheme: 'dark'`. Each SHALL assert that `violations` is empty.
- 13.4 The catalogue page SHALL also be scanned in the filtered state and in the empty state.
- 13.5 Test titles SHALL carry `[SC x.y.z]` tags where one criterion is protected, so the ACR generator can link the evidence.

---

## REQ-14 Keyboard Playwright test for every page

**User story:** As a keyboard user, I want proof that each page works without a mouse (SC 2.1.1, 2.1.2, 2.4.3, 2.4.7).

### Acceptance criteria

- 14.1 Each of the pages (catalogue, book detail, about, not found) SHALL have a Playwright test that uses only the keyboard.
- 14.2 The catalogue test SHALL: press Tab and reach the skip link first; walk the Tab order (skip link, Catalogue, About, Reduce motion, search input, each school checkbox, each hazard checkbox, first result link) and check that every stop has an outline of at least 2 px; type a word and check that the result count text changes; toggle a checkbox with Space; reach the empty state with a word that matches nothing, activate "Clear search and filters" with Enter and check that focus returns to the search input; focus a card link and press Enter to open the detail page.
- 14.3 The catalogue test SHALL check that after typing and waiting for the debounce, the polite live region contains the new count message, and that the assertive live region stays empty *(SC 4.1.3)*.
- 14.4 The detail test SHALL check that focus lands on the `h1` after navigation, that the title changes, that Tab reaches "Back to catalogue", and that Enter returns to the catalogue with the earlier search kept.
- 14.5 The about and not-found tests SHALL check the Tab order and the focus on the `h1` after navigation.
- 14.6 Every test SHALL fail when focus is lost to `body` where it should not be, and SHALL check for no keyboard trap by tabbing through the whole page and back to the browser UI or the first element *(SC 2.1.2)*.
- 14.7 One test at 320 px width and one with the text-spacing overrides SHALL cover REQ-12.1 and 12.2 on the catalogue page. One test SHALL cover the motion toggle and `prefers-reduced-motion` on the decorative candle.

---

## REQ-15 Unit and property-based tests

**User story:** As a maintainer, I want the logic proven over many inputs, so that the filter and announcer cannot silently drift.

### Acceptance criteria

- 15.1 The filter function (`filterBooks`) SHALL have unit tests for each rule in REQ-4.7 and REQ-5.4.
- 15.2 The system SHALL provide fast-check properties (using the skeleton's `tests/unit/support/pbt.ts` helpers and the existing `fast-check` dev dependency) for these invariants over generated queries and filter sets:
  - every returned book matches every active part;
  - the result is a subset of all books in the same order;
  - no search and no filters returns all 24 books;
  - adding a checked value in a fieldset never removes a book (OR within a group);
  - adding a search word never adds a book (AND);
  - the result count equals the number of rendered cards, or the empty state when it is zero.
- 15.3 The announcement hook SHALL have fake-timer tests for REQ-6: one message after 500 ms, none before, last value wins, none on first render, none after unmount, never assertive.
- 15.4 The query-string functions (`parseQuery`, `toSearchParams`) SHALL round-trip any valid state and ignore unknown values (a property test).

---

## REQ-16 Evidence, documentation and checks

**User story:** As a reviewer, I want to see proof, so that I can trust the claim "WCAG 2.2 AA from day one".

### Acceptance criteria

- 16.1 `npm run lint`, `npx tsc --noEmit`, `npm test` and `npm run test:e2e` SHALL all pass in `apps/grimoire` with zero warnings.
- 16.2 The system SHALL generate `apps/grimoire/ACR.md` with `npm run acr -- apps/grimoire` from the repository root after the tests ran, and SHALL NOT edit it by hand. The report SHALL NOT claim "Supports" for a criterion without evidence.
- 16.3 The app SHALL have a short `README.md`: what it is, how to run it, the port, the pages, the theme and the test commands.
- 16.4 The system SHALL NOT claim a criterion is met without a test or a manual keyboard check recorded in the tasks (steering rule).
- 16.5 The Trusted Tester reviewer agent SHALL review the finished app once, and its findings SHALL be written to `docs/trusted-tester-review-grimoire.md`. Every finding SHALL be fixed or listed with a reason.

---

## REQ-17 Shared improvements go to the skeleton first

**User story:** As a maintainer, I want fixes that every app needs to land in the skeleton, so that the template improves (structure rule).

### Acceptance criteria

- 17.1 IF a defect or missing feature is found that every app would need (for example a bug in `PageShell`, `Field` or the announcer), THEN the change SHALL be made in `skeleton/` first, with its test, and then brought into `apps/grimoire`.
- 17.2 IF a feature only Grimoire needs (search, filters, cards, book data), THEN it SHALL stay in `apps/grimoire` and SHALL NOT be added to `skeleton/`.
