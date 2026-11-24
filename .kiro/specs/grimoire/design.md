# Grimoire: Design

Implements `requirements.md` in this folder. Paths are relative to `apps/grimoire/` unless they start with `skeleton/`, `scripts/` or `.kiro/`.

## 1. Decisions

| Decision | Choice | Why |
| --- | --- | --- |
| Creation | `npm run new-app grimoire`, then edit. | Structure rule: never hand-copy. *(REQ-1.1)* |
| Dependencies | None added. `react-router-dom` (routing), `fast-check`, `vitest-axe`, `@axe-core/playwright` are already in the skeleton. | Tech rule: no new dependency without a written reason. There is none: search is a string filter on 24 records, and a debounce is a `setTimeout`. *(REQ-1.5)* |
| Data | `src/data/books.json` imported as a module (`resolveJsonModule`), wrapped by `src/data/books.ts` with types. | Offline, typed, no fetch, no loading state to announce. *(REQ-3)* |
| Search state | URL query string through `useSearchParams`, updated with `replace`. | Back keeps the search (SC 3.3.7), links are shareable, no extra state library. *(REQ-10)* |
| Filtering | A pure function `filterBooks(books, state)`. The page calls it with `useMemo`. | Pure code is easy to test with properties. *(REQ-15)* |
| Count announcement | A small hook `useDebouncedAnnouncement` that calls the skeleton `useAnnounce()`. | The steering rule says status messages go through the shared announcer. No second live region. *(REQ-6)* |
| Card link | Heading > link, with `a::after { position: absolute; inset: 0 }` and `position: relative` on the card. | One link per card, one tab stop, a real heading, a big click area, no `div` with a click handler. *(REQ-7)* |
| Search form | `<form role="search" aria-label="Catalogue search">` with `onSubmit` calling `preventDefault`. | A labelled landmark for search, Enter does not reload. *(REQ-4.1, 4.6)* |
| Theme | Change values in `tokens.css` and `dark.css` only. No new colour token. | The existing contrast matrix and property tests then cover Grimoire with no change. *(REQ-11.1, 11.4)* |
| Dev port | 5174 with `--strictPort`, set in `package.json` (`dev`) and `playwright.config.ts`. | With `reuseExistingServer` and a fixed port 5173, a running skeleton or another app would answer the Playwright tests. *(REQ-1.4)* |
| Pagination | None. | 24 items. Pagination adds controls and focus rules for no gain. |

## 2. File layout

Files marked *(new)* are added. Files marked *(edit)* come from the skeleton and are changed. Everything else stays as generated.

```
apps/grimoire/
  index.html                         (edit) title "Catalogue — Grimoire"
  package.json                       (edit) dev: vite --port 5174 --strictPort
  playwright.config.ts               (edit) baseURL and webServer on 5174
  README.md                          (edit) Grimoire readme
  src/
    App.tsx                          (edit) routes
    data/
      books.json                     (new) 24 books
      books.ts                       (new) Book type, SCHOOLS, HAZARDS, BOOKS, findBook
    lib/
      filterBooks.ts                 (new) normalise(), filterBooks(), resultsMessage()
      searchState.ts                 (new) SearchState, parseQuery(), toSearchParams()
    hooks/
      useDebouncedAnnouncement.ts    (new) 500 ms polite announcer
    components/
      PageShell.tsx                  (edit) site name, nav links
      SearchFilters.tsx (+ .module.css)  (new) search Field, two fieldsets, clear button
      ResultsList.tsx   (+ .module.css)  (new) h2, count text, ul, or EmptyState
      BookCard.tsx      (+ .module.css)  (new) li, h3 > link, text meta
      EmptyState.tsx    (+ .module.css)  (new) message, hint, clear button
      BookCover.tsx     (+ .module.css)  (new) decorative SVG per school, aria-hidden
      Candle.tsx                         (new) decorative animated flame, aria-hidden
    pages/
      CataloguePage.tsx (+ .module.css)  (new, replaces HomePage) the catalogue
      BookDetailPage.tsx (+ .module.css) (new)
      AboutPage.tsx                  (edit) Grimoire text
      NotFoundPage.tsx               (edit) Grimoire title
    tokens/tokens.css, dark.css      (edit) Grimoire palette (section 6)
  tests/
    unit/
      books-data.test.ts                       (new)
      filterBooks.test.ts                      (new)
      searchState.test.ts                      (new)
      useDebouncedAnnouncement.test.tsx        (new)
      theme-identity.test.ts                   (new)
      no-hex-in-components.test.ts             (new)
      SearchFilters.test.tsx, BookCard.test.tsx, ResultsList.test.tsx,
      EmptyState.test.tsx, BookCover.test.tsx  (new) axe + behaviour
      CataloguePage.test.tsx                   (new, replaces HomePage.test.tsx)
      BookDetailPage.test.tsx                  (new)
      properties/filter.property.test.ts       (new)
      properties/searchState.property.test.ts  (new)
      (all skeleton tests kept; "Skeleton Key" strings in them renamed)
    e2e/
      catalogue.spec.ts, book-detail.spec.ts, about.spec.ts, not-found.spec.ts,
      responsive.spec.ts, motion.spec.ts       (new; home.spec.ts is replaced)
      (dialog.spec.ts kept as is)
```

`HomePage` is renamed to `CataloguePage` so the name says what the page is. `HomePage.module.css` is deleted with it. The skeleton `Dialog`, `Tabs`, `Toast` and `Button` stay in `src/components/`: they are part of the template and the skeleton tests cover them.

## 3. Data model

```ts
export const SCHOOLS = ['Necromancy', 'Divination', 'Illusion', 'Herbalism', 'Warding', 'Alchemy'] as const
export const HAZARDS = ['Mild', 'Perilous', 'Forbidden'] as const
export type School = (typeof SCHOOLS)[number]
export type Hazard = (typeof HAZARDS)[number]

export interface Book {
  slug: string        // 'the-lantern-of-small-hours'
  title: string
  author: string      // fictional
  school: School
  hazard: Hazard
  year: string        // 'c. 1347'
  pages: number
  summary: string     // one sentence, <= 160 characters
  description: string[] // 1 to 3 paragraphs
  tags: string[]      // 1 to 5, lower-case
}
```

Planned distribution (four books per school, so each school has at least three): Mild 9, Perilous 9, Forbidden 6. `books.ts` exports `BOOKS` (sorted by title with `localeCompare('en')`) and `findBook(slug)`. The JSON file is cast once, in `books.ts`, and `books-data.test.ts` proves the cast is true.

Three anchor books that e2e tests may name, because the test must not depend on a count that changes with the data: `the-lantern-of-small-hours` (Illusion), `ember-and-ash-herbal` (Herbalism), `the-hollow-index` (Necromancy). Any other expectation (for example how many books match "ash") SHALL be computed from `BOOKS` in the test.

## 4. Logic

### 4.1 Search state and URL

```ts
export interface SearchState { q: string; schools: School[]; hazards: Hazard[] }

parseQuery(params: URLSearchParams): SearchState   // unknown school/hazard values dropped, q trimmed to 100 chars
toSearchParams(state: SearchState): URLSearchParams // omits empty parts; schools and hazards in canonical order
```

`parseQuery(toSearchParams(s))` equals `s` for every valid state (property test). The URL keeps the text as typed, apart from the 100-character cap; the filter trims and normalises it.

### 4.2 Filtering

```ts
normalise(text: string): string  // NFD, strip combining marks, lower-case
filterBooks(books: readonly Book[], state: SearchState): Book[]
resultsMessage(count: number): string // 'No spellbooks found' | '1 spellbook found' | 'N spellbooks found'
```

`filterBooks` keeps a book when all three parts hold:

1. every whitespace-separated word of `normalise(q)` is a substring of `normalise([title, author, summary, ...tags].join(' '))`;
2. `schools` is empty or contains `book.school`;
3. `hazards` is empty or contains `book.hazard`.

It never reorders, so the order of `BOOKS` (alphabetical) is kept. It is O(books × words); 24 books need no index.

### 4.3 Announcement hook

```ts
useDebouncedAnnouncement(message: string, key: string, delayMs = 500): void
```

- `message` is what to say (`resultsMessage(n)` or the empty-state sentence). `key` is the serialised search state (`toSearchParams(state).toString()`).
- The hook skips the first render, then starts a timer whenever `key` changes. Each change clears the previous timer, so the last value wins. When the timer fires, it calls `announce(message)` with no options, which is polite.
- It stores the latest `message` in a ref, so the timer reads the message that matches the settled state, not a stale one.
- It clears the timer in its effect clean-up. React StrictMode runs effects twice in development; the first-render guard uses a ref that is set in the effect, so the double run does not announce.
- Back navigation from the detail page mounts the catalogue again. The first-render skip means no announcement (REQ-6.4). The route-change announcement says the page title instead.

The hook only calls `announce`. The visible count is plain text in `ResultsList`.

### 4.4 Focus rules

| Event | Focus |
| --- | --- |
| Route change (pathname) | `h1` of the new page, by `useFocusOnRouteChange` *(REQ-2.5)* |
| Typing, toggling a checkbox (query change only) | Stays where it is. `useFocusOnRouteChange` depends on `location.pathname`, so a query change does not trigger it. *(REQ-10.4)* |
| "Clear search and filters" activated | Search input, by an effect in `CataloguePage` that focuses the input ref after the clear *(REQ-5.5)* |
| Detail page back link | Catalogue `h1`, by the route-change hook |

The clear button is not rendered when nothing is active, so the focused element never disappears without a move. When the user activates the button in the empty state, the button disappears, and focus is moved to the search input by the same effect.

## 5. Components and pages

All components are small, typed, and start with a one-line comment about the accessibility guarantee.

### 5.1 `SearchFilters`

```
<form role="search" aria-label="Catalogue search" onSubmit={preventDefault}>
  <Field id="catalogue-search" label="Search spellbooks" hint="Searches title, author, summary and tags.">
    <input type="search" autoComplete="off" value onChange />
  </Field>
  <fieldset><legend>School of magic</legend> six checkbox + label pairs </fieldset>
  <fieldset><legend>Hazard</legend> three checkbox + label pairs </fieldset>
  {isActive && <Button variant="secondary" type="button">Clear search and filters</Button>}
</form>
```

- Uses the skeleton `Field` for the label and hint. The search input forwards a ref to the page so the page can focus it.
- Checkboxes are native, with the label next to the box (`for`/`id`, ids `school-necromancy` and so on). The label wraps nothing else. A custom check mark is drawn with CSS on a visually styled native input (`appearance: none`, a 1.5 rem box, a border with `--color-border`, a drawn tick when `:checked`), so state is shown by shape and not by colour alone.
- The whole label row is at least 2.75 rem high, so the target is more than 24 px.
- Under 40 rem the fieldsets stack. Above it they sit side by side. Labels wrap, so 320 px works.

### 5.2 `ResultsList` and `BookCard`

```
<section aria-labelledby="results-heading">
  <h2 id="results-heading">Results</h2>
  <p>{count} spellbooks</p>            // visible text, not a live region
  {count === 0 ? <EmptyState /> : <ul>{books.map(b => <BookCard />)}</ul>}
</section>

<li class="card">
  <BookCover school aria-hidden />
  <h3><Link to={`/books/${slug}`} state={{ search }}>{title}</Link></h3>
  <p class="meta">{author} · {school} · {hazard}</p>
  <p>{summary}</p>
</li>
```

- Stretched link: `.card { position: relative }`, `.card a::after { content: ''; position: absolute; inset: 0 }`. The text sits under the pseudo-element, so a click anywhere opens the book.
- Focus ring: the link keeps the global `:focus-visible` outline. Because the link box is only the title, `.card a:focus-visible::after { outline: 3px solid var(--color-focus-ring); outline-offset: 2px }` draws the ring around the whole card and the link's own outline is replaced by it. The e2e keyboard walk reads `getComputedStyle(link, '::after')` to prove the ring is there. `scroll-margin-top` on the card keeps it below the sticky header (SC 2.4.11).
- The hazard word is plain text in the meta line. A small coloured mark MAY accompany it, but only as decoration.
- The count text uses `resultsMessage(count)`, with the number only, so sighted and speech users get the same wording.

### 5.3 `EmptyState`

A `div` inside the results section. It has no heading of its own, because the section already has an `h2` and an extra heading would add an outline entry for one sentence. Content: `<p><strong>No spellbooks found.</strong></p>`, `<p>Try a shorter search or clear some filters.</p>`, and the clear button. No `role="alert"`. A decorative empty-book SVG is `aria-hidden`.

### 5.4 `CataloguePage`

Order inside `main`: `h1` ("The Grimoire: a catalogue of spellbooks", `tabIndex={-1}`), the decorative `Candle`, an intro paragraph, `SearchFilters`, `ResultsList`. Document title "Catalogue — Grimoire". The page owns the state through `useSearchParams`, derives `filterBooks`, and calls `useDebouncedAnnouncement`. The title for the home route is "Catalogue — Grimoire" and the nav link text is "Catalogue".

Heading outline: `h1` page, `h2` "Find a spellbook" (above the form, so the search form has a heading), `h2` "Results", `h3` per card.

### 5.5 `BookDetailPage`

`useParams` gives the slug. Found: `h1` title, `BookCover`, `dl` (Author, School, Hazard, Year, Pages), description paragraphs, tags as a `ul` of text, and `<AppLink href={'/' + (state?.search ?? '')}>Back to catalogue</AppLink>`. `AppLink` takes a string `href`, so the search string is added to the path. Not found: `h1` "Spellbook not found", one paragraph, the back link. Both set `document.title` in an effect.

### 5.6 Shell

`PageShell` header: the site name text changes from "Skeleton Key" to "Grimoire" (the skeleton marks it `aria-hidden`; Grimoire keeps that, because the page titles and the `h1` already name the site). The nav links are "Catalogue" (`/`) and "About" (`/about`). Footer: "Grimoire — a catalogue of invented spellbooks. All books and authors are fictional."

## 6. Theme

Name: **Parchment and Candle**. Only the values change. Each pair below was computed with the same WCAG formula as `tests/unit/support/contrast.ts`; the tests recompute them from the real CSS.

### 6.1 Light (`tokens.css`)

| Token | Value | Check |
| --- | --- | --- |
| `--color-surface` | `#f4ead5` | parchment, hue 41° |
| `--color-surface-raised` | `#e9dbbd` | cards, header |
| `--color-text` | `#2b1608` | 14.40:1 on surface, 12.56:1 on raised |
| `--color-text-muted` | `#5a3a22` | 8.52:1, 7.43:1 |
| `--color-text-on-accent` | `#ffffff` | 9.28:1 on accent, 12.21:1 on accent-hover |
| `--color-link` | `#8a1c1c` | 7.77:1, 6.77:1 |
| `--color-link-hover` | `#6b1212` | 10.22:1, 8.91:1 |
| `--color-accent` | `#8a1c1c` | 7.77:1 (UI needs 3:1) |
| `--color-accent-hover` | `#6b1212` | fill for white text |
| `--color-error` | `#9b1c1c` | 6.82:1, 5.95:1 |
| `--color-success` | `#1f5f2e` | 6.43:1, 5.61:1 |
| `--color-warning` | `#8a4b00` | 5.69:1, 4.97:1 |
| `--color-border` | `#8a5a2b` | 4.91:1 on surface, 4.29:1 on raised (UI needs 3:1) |
| `--color-focus-ring` | `#0b4f6c` | 7.48:1, 6.53:1; teal, so the ring is easy to tell from the crimson accent |

### 6.2 Dark (`dark.css`, media query and `[data-theme='dark']`, identical values)

| Token | Value | Check |
| --- | --- | --- |
| `--color-surface` | `#130d08` | near-black brown, hue 27° |
| `--color-surface-raised` | `#241810` | |
| `--color-text` | `#f3e3c3` | 15.23:1, 13.67:1 |
| `--color-text-muted` | `#cdb48c` | 9.65:1, 8.66:1 |
| `--color-text-on-accent` | `#ffffff` | 5.02:1 on accent, 7.09:1 on accent-hover |
| `--color-link` | `#f0b45a` | 10.45:1, 9.38:1; amber |
| `--color-link-hover` | `#ffd08a` | 13.45:1, 12.07:1 |
| `--color-accent` | `#b45309` | 3.84:1 on surface, 3.45:1 on raised (UI needs 3:1); never text |
| `--color-accent-hover` | `#92400e` | fill for white text; exempt as a foreground, as in the skeleton |
| `--color-error` | `#ff9d8f` | 9.62:1, 8.63:1 |
| `--color-success` | `#9be39b` | 12.73:1, 11.42:1 |
| `--color-warning` | `#ffd166` | 13.38:1, 12.01:1 |
| `--color-border` | `#c58b4e` | 6.59:1, 5.92:1 |
| `--color-focus-ring` | `#7dd3fc` | 11.57:1, 10.38:1; light blue |

### 6.3 Why it looks different from Seance

Hue families are the contract (REQ-11.3). Grimoire is warm: surface 41° and 27°, accent 0° and 26°, link 0° and 36°, border 30° and 31°, all in the warm band (0° to 45°). Seance is cool (160° to 280°: spectral teal, slate and ghost blue). The skeleton's purple (hue 270° to 280°) is removed from Grimoire. Typography also differs: Grimoire sets `--font-heading` to a book serif stack (`'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif`), cards have a bronze border and a parchment fill, and the cover glyphs are book shaped. Seance gets its own spec and must use the cool band; the two apps are standalone, so the check lives in each app's own `theme-identity.test.ts`, and the Seance spec records its band.

### 6.4 What proves contrast

No new test is written for ratios. These existing files, copied unchanged, read `src/tokens/tokens.css` and `dark.css` of the app:

- `tests/unit/properties/contrast.property.test.ts`: every matrix pair in the light theme and both dark sources, text 4.5:1, UI and focus ring 3:1, dark sources identical, every token in the matrix or exempt list.
- `tests/unit/tokens-contrast.test.ts`: white text on accent and accent-hover in both themes at 4.5:1.

`theme-identity.test.ts` adds: the token set equals the skeleton's (no new or removed `--color-*`), hue of surface, accent, link and border in the warm band for light and dark, and no token keeps a skeleton purple value. Hue is computed by a small helper `hueOf(hex)` in the test support folder, with its own unit test on known colours.

`no-hex-in-components.test.ts` reads every `src/**/*.css` except `src/tokens/` and fails on any `#rrggbb`, `rgb(`, `hsl(` or named colour, so the proven tokens are the only colours that reach the screen *(REQ-11.6)*.

## 7. Accessibility mapping

| Concern | Mechanism | SC |
| --- | --- | --- |
| Labelled search | `Field` with label and hint, `role="search"` form | 1.3.1, 3.3.2, 4.1.2 |
| Filter group | `fieldset` and `legend` per group, native checkboxes | 1.3.1, 3.3.2, 4.1.2 |
| Checked state | Drawn tick plus native `:checked`, not colour alone | 1.4.1 |
| Result count | Polite announcer, 500 ms debounce, visible count text | 4.1.3 |
| Card | `h3` containing the one link; stretched link | 1.3.1, 2.4.4, 2.4.6 |
| Focus | Global ring plus card ring on `::after`; `scroll-margin-top` | 2.4.7, 2.4.11, 1.4.11 |
| Empty state | Text with fix, button, polite announcement | 3.3.3, 4.1.3 |
| Query in URL | `replace`; Back works; state passed to detail | 3.3.7, 3.2.2 |
| Route change | Existing hook: focus `h1`, announce title | 2.4.3, 4.1.3 |
| Reflow and spacing | Single column grid at 320 px; no fixed heights on text | 1.4.10, 1.4.12 |
| Motion | Candle animation off under OS setting and in-app toggle | 2.2.2, 2.3.3 |
| Decorative art | `aria-hidden="true"`, no title | 1.1.1 |

## 8. Test plan

| Requirement | Vitest (`tests/unit/`) | Playwright (`tests/e2e/`) |
| --- | --- | --- |
| REQ-2 shell, titles | `CataloguePage`, `BookDetailPage` (title, one `h1`), skeleton `PageShell` test renamed | every spec: title, landmarks, `h1` focus |
| REQ-3 data | `books-data.test.ts` | detail anchors |
| REQ-4 search | `SearchFilters`, `filterBooks` | `catalogue.spec.ts` (type, Enter, count) |
| REQ-5 filters | `SearchFilters`, `filterBooks`, clear button | `catalogue.spec.ts` (Space, clear, focus) |
| REQ-6 announcement | `useDebouncedAnnouncement` (fake timers), page test reading the polite region | `catalogue.spec.ts` (polite text, assertive empty) |
| REQ-7 cards | `BookCard`, `ResultsList` | keyboard walk, ring on `::after`, one link per card |
| REQ-8 empty state | `EmptyState`, page test | `catalogue.spec.ts` empty-state steps |
| REQ-9 detail | `BookDetailPage` found and not found | `book-detail.spec.ts` |
| REQ-10 URL | `searchState.test.ts`, property test | Back keeps the search |
| REQ-11 theme | skeleton contrast tests, `theme-identity`, `no-hex` | axe in dark scheme |
| REQ-12 reflow, motion | none | `responsive.spec.ts`, `motion.spec.ts` |
| REQ-13 axe | every component and page file, with states | `scanPage` in each spec, light and dark |
| REQ-14 keyboard | none | one keyboard test per page |
| REQ-15 properties | `filter.property.test.ts`, `searchState.property.test.ts` | none |

Rules for the tests:

- Unit page tests render inside `MemoryRouter`, `MotionProvider` and `AnnouncerProvider` (the real providers, so the live regions exist and can be read).
- The announcement test reads `[aria-live="polite"]` after `vi.advanceTimersByTime(500)` and a microtask flush (the announcer writes on two microtasks).
- Playwright tests wait for the polite region text with `expect(...).toHaveText(...)`, never with a fixed sleep.
- Playwright axe scans use `scanPage` from `tests/e2e/support/axe.ts`, so evidence files reach the ACR generator. Dark scans use `test.use({ colorScheme: 'dark' })` in a nested `describe`.
- Test titles carry `[SC x.y.z]` tags for the criterion they protect.
- Axe in jsdom cannot compute colour contrast (no canvas); contrast is covered by the token tests and by the real-browser axe scans.

## 9. Risks and answers

| Risk | Answer |
| --- | --- |
| Stretched link makes the card ring appear on `::after`, which axe does not inspect. | The keyboard e2e reads the computed style of `::after`, and a manual keyboard check is recorded in tasks. |
| The announcer clears and rewrites on microtasks, so a test can read an empty region. | Tests await a microtask flush, then read. |
| Focus effect on "Clear" runs when the button is already gone. | The effect focuses the input ref, which is always mounted. |
| `useSearchParams` re-renders on every key press. | The list is 24 items; `useMemo` on the filter result is enough. |
| Dark `--color-accent` is only 3.84:1 on the surface. | Allowed for UI fills (3:1). Never used for text; the matrix lists it with min 3. |
| A shared defect is found while building. | REQ-17: fix in `skeleton/` first, then bring it in. |
| Checkbox custom drawing hides native state from forced-colours mode. | Use `appearance: none` with a `border` and a `:checked::after` mark that uses `currentColor`; add a `forced-colors: active` rule that keeps the border. The unit test checks the input is still `type="checkbox"`. |

## 10. Visual refresh

A look-only change: copy, accessible names, roles, ids, DOM order, tab order, focus moves, routes, data, logic and the `--color-*` tokens are unchanged. The set of tokens and their values are the same, so the contrast and theme-identity tests still cover it.

- **Candlelit library.** Covers are cloth-bound books (inline SVG: cloth, spine, page edge, foil frame and the school glyph). Each school has its own cloth colour, mixed from existing tokens with `color-mix()`; the foil colour keeps the glyph legible. `--cloth` and `--foil` are local custom properties on the cover, not `--color-*` tokens. Cover art is decorative and `aria-hidden`; school and hazard stay text.
- **Shelves.** The results list is one bordered shelf. From 40rem each card is a column with the cover standing on a plank drawn by `.card::before`, and the planks of touching cards join into one shelf. Below 40rem each card is a row with a shelf edge under it. Books differ slightly in size and one in seven leans; covers never move on hover.
- **First screen.** From 64rem the filters sit in a 15rem left column beside the shelves (grid placement only, so DOM and tab order are unchanged). Below 64rem the filter options are compact chips. Measured first card top: 260px at 1280x720 and 1440x900 (four covers fully visible), 740px at 375x812.
- **Book page.** An open book: a raised page with a double-ruled facts panel, the cover on the left page, a soft gutter gradient (20% border colour, because 35% made the link fall to 4.35:1) and serif body text.
- **Focus.** The card ring is still the link's `::after` (3px solid, now inset by `--space-1` so the next card cannot hide it). From 40rem the title sits under the cover, so `scroll-margin-top` is `header height + 14rem`.
- **Motion.** The candle flicker is still the only looping animation. Card and checkbox transitions use `--duration-fast` and are removed under `prefers-reduced-motion: reduce`.
- **Forced colours.** Covers use `CanvasText` and `Canvas` and no shadow; the checkbox and card ring rules are kept.