# Property-Based Accessibility Tests: Design

## Overview

Four property tests prove accessibility invariants for the skeleton's tokens, Field, Dialog and Tabs. They run under `npm test` with Vitest, use `fast-check` to generate inputs and reuse the existing stack (Testing Library, `user-event`, `vitest-axe`, jsdom). No source code changes are planned except where a property exposes a real defect (REQ-4.10, REQ-5.11).

```
skeleton/tests/unit/
  support/
    pbt.ts                    shared fast-check config and case-count guard (REQ-1)
    pbt.test.ts               example tests for the helper (collected as a test)
    contrast.ts               WCAG luminance and contrast ratio (REQ-2)
    token-matrix.ts           which token may sit on which surface (REQ-3)
    theme-tokens.ts           parses tokens.css and dark.css into three colour maps (REQ-3)
  contrast.test.ts            example tests for contrast.ts (REQ-2)
  properties/
    contrast.property.test.ts exhaustive token-pair check (REQ-3)
    Field.property.test.tsx   (REQ-4)
    Dialog.property.test.tsx  (REQ-5)
    Tabs.property.test.tsx    (REQ-6)
```

The existing `vite.config.ts` already includes `tests/unit/**/*.test.{ts,tsx}`, and `tsconfig.json` already includes `tests/unit`, so no config change is needed. Other `support/` files do not end in `.test.ts` and are not collected as tests. Because `scripts/new-app.mjs` copies `skeleton/`, apps inherit these tests and the support code.

## Dependencies and reasons

`tech.md` requires a written reason for each new dependency.

| Package | Where | Reason |
|---|---|---|
| `fast-check` (^4) | devDependency | The generator and shrinking engine for property tests. It is the library named in `product.md`, runs in plain Vitest with no plugin, and shrinks failures to a minimal counterexample. Writing our own generator and shrinker would be more code and less trustworthy. |
| `dom-accessibility-api` (^0.5.16) | devDependency | Computes the accessible name of any element by the W3C accname algorithm. `@testing-library/dom` already installs this version, so the explicit entry adds no new code to `node_modules`. It is needed because `getByRole(..., { name })` cannot find controls with no ARIA role (`input type="password"`, `type="date"`), and REQ-4.4 covers every input type. Declaring it avoids depending on a transitive package by accident. |

No other package is added. The luminance utility is about 30 lines of our own code (REQ-2), so no colour library is needed.

## Shared support

### `support/pbt.ts`

```ts
export const MIN_RUNS = 100
export function numRuns(): number          // max(MIN_RUNS, Number(process.env.FC_NUM_RUNS) || MIN_RUNS)
export function seed(): number | undefined // Number(process.env.FC_SEED) when set
export async function checkProperty<T>(arbitrary: fc.Arbitrary<T>, predicate: (v: T) => void | typeof SKIPPED | Promise<void | typeof SKIPPED>): Promise<number>
```

`checkProperty` takes the arbitrary and the predicate separately (so it can count), and a predicate returns `SKIPPED` for a vacuous case; only non-skipped cases count toward the floor. It wraps the predicate with a counter, calls `fc.assert(property, { numRuns: numRuns(), seed: seed(), verbose: fc.VerbosityLevel.Verbose })`, and then `expect(counter).toBeGreaterThanOrEqual(MIN_RUNS)`. `fast-check` already prints seed, path and the shrunk counterexample on failure (REQ-1.7). The counter guards against a precondition that silently discards most cases (REQ-1.8). `FC_NUM_RUNS` can only raise the count (REQ-1.5), so nobody can make the suite weaker by accident or on CI.

### DOM hygiene

Each case renders into a fresh container and unmounts in a `finally` block. The Dialog test also removes `inert` from `#root` and clears `document.body` of leftover portal nodes. Timers and `requestAnimationFrame` are real; Dialog's initial focus is awaited with `waitFor`.

### Timeout budget

DOM properties run React renders, `user-event` and axe in jsdom, so a case costs roughly 20 to 200 ms. The planned per-test timeout is 60 s for Field (axe on every case), 60 s for Dialog and 30 s for Tabs. These are set with the third argument of `it(...)`. If a file is slower than that on the CI machine, lower the work per case (smaller sequences) before lowering `numRuns` below the floor.

## Property 1: Contrast (REQ-2, REQ-3)

### Luminance utility

`support/contrast.ts` exports `parseHex`, `relativeLuminance` and `contrastRatio`. It follows WCAG 2.2:

- channel `c = v / 255`; `c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4`
- `L = 0.2126 R + 0.7152 G + 0.0722 B`
- ratio `= (L1 + 0.05) / (L2 + 0.05)` with `L1 >= L2`

The existing `tokens-contrast.test.ts` uses `0.03928`, the value from the older WCAG 2.0 text. For 8-bit channels both thresholds fall between the same two adjacent values, so results are identical. The new utility uses the current `0.04045` and an example test documents that equivalence (REQ-2.6). Hex only: anything else throws, because a silently mis-parsed `var(--x)` would turn a contrast failure into a pass.

`contrast.test.ts` holds the example tests: black on white = 21; same colour = 1; `#767676` on white ≈ 4.54 (passes 4.5); `#777777` on white ≈ 4.48 (fails 4.5); red, green and blue luminance = 0.2126, 0.7152 and 0.0722; `#fff` equals `#ffffff`; swapped arguments give the same ratio; `rgb(0,0,0)` and `#12345` throw. These are example tests on purpose: they pin the calculator to published values, and everything else trusts it.

### Reading tokens from the real CSS

`support/theme-tokens.ts` imports both CSS files with `?raw` (the pattern `tokens-contrast.test.ts` already uses) and builds three maps:

| Source | Where it is defined |
|---|---|
| `light` | first `:root { ... }` block in `tokens.css` |
| `dark-media` | `:root { ... }` inside `@media (prefers-color-scheme: dark)` in `dark.css` |
| `dark-attr` | `[data-theme='dark'] { ... }` in `dark.css` |

The parser walks braces instead of using one large regular expression, because the media block nests a rule inside an at-rule. It reads only `--color-*` custom properties and accepts only hex values. A missing token or a non-hex value throws with the token and source name (REQ-3.3). A separate test asserts that `dark-media` and `dark-attr` are equal (REQ-3.4); the two blocks are hand-copied in `dark.css`, so drift between them is a likely defect.

### Token matrix

`support/token-matrix.ts` is an allow-list. Contrast is only meaningful for pairs that are actually rendered, so "all tokens on all tokens" would produce false failures. Current values, measured from the shipped tokens, show why:

- `--color-accent-hover` on a surface is 2.79:1 in the dark theme. It is never drawn on a surface. It is only the background of white text on a hovered primary button, so it appears in the matrix only as a background for `--color-text-on-accent`.
- `--color-accent` is 3.62:1 on `--color-surface` and 3.33:1 on `--color-surface-raised` in the dark theme. That passes 3:1 as a UI colour (tab underline, button fill) and fails 4.5:1 as text. `tokens.css` already says dark accent must not be used for text, and the matrix encodes that: accent appears only in the UI list.

```ts
type Entry = { fg: string; on: string[]; min: 4.5 | 3; criterion: '1.4.3' | '1.4.11'; use: string }
export const MATRIX: Entry[] = [
  { fg: '--color-text',           on: ['--color-surface', '--color-surface-raised'], min: 4.5, criterion: '1.4.3',  use: 'body text' },
  { fg: '--color-text-muted',     on: [surface, raised], min: 4.5, criterion: '1.4.3',  use: 'hints, footer, inactive tabs' },
  { fg: '--color-link',           on: [surface, raised], min: 4.5, criterion: '1.4.3',  use: 'links, secondary button text' },
  { fg: '--color-link-hover',     on: [surface, raised], min: 4.5, criterion: '1.4.3',  use: 'hover text' },
  { fg: '--color-error',          on: [surface, raised], min: 4.5, criterion: '1.4.3',  use: 'error text' },
  { fg: '--color-success',        on: [surface, raised], min: 4.5, criterion: '1.4.3',  use: 'success text' },
  { fg: '--color-warning',        on: [surface, raised], min: 4.5, criterion: '1.4.3',  use: 'warning text' },
  { fg: '--color-text-on-accent', on: ['--color-accent', '--color-accent-hover'], min: 4.5, criterion: '1.4.3', use: 'primary button label' },
  { fg: '--color-border',         on: [surface, raised], min: 3,   criterion: '1.4.11', use: 'borders of controls and dialogs' },
  { fg: '--color-focus-ring',     on: [surface, raised], min: 3,   criterion: '1.4.11', use: 'focus outline' },
  { fg: '--color-accent',         on: [surface, raised], min: 3,   criterion: '1.4.11', use: 'tab underline, button fill' },
]
export const EXEMPT: Record<string, string> = {
  '--color-surface': 'background only; checked as the `on` side',
  '--color-surface-raised': 'background only; checked as the `on` side',
  '--color-accent-hover': 'checked as the `on` side for --color-text-on-accent',
}
```

The final matrix is written during implementation by re-reading the CSS Modules (`grep var(--color-` in `src/`), so it follows actual usage. The completeness test (REQ-3.10) fails if `tokens.css` declares a colour token that is in neither `MATRIX` nor `EXEMPT`. That forces whoever adds a token to decide where it may be used.

If the first run finds a real failing pair, the fix is a token change in `tokens.css` or `dark.css` and a re-check, not a looser matrix (REQ-8.6).

### Why exhaustive, not sampled

The input space is 3 theme sources × about 22 pairs, roughly 66 checks. Random sampling of a 66-element finite set is strictly worse than visiting every element. The tests use `it.each` over the full cross product so that a failure names its theme and pair in the test title. `fast-check` is not used for this property, which matches the "exhaustive" wording in the brief.

A negative control feeds the checker a synthetic token map with a known 2:1 pair and asserts it is reported (REQ-3.11). Without it, a bug in the checker (for example comparing the wrong operands) would make the property pass for ever.

### What this protects that example tests cannot

`tokens-contrast.test.ts` checks one relationship (white on accent). The product promise is every pair in both themes. A hand-written example list covers the pairs someone remembered. The matrix plus the completeness check covers every pair the CSS can produce: it fails when someone tweaks `--color-text-muted` in dark mode, adds `--color-info`, or edits only one of the two dark blocks. None of those cases needs a human to remember to add a test.

## Property 2: Field (REQ-4)

**Invariant.** For any configuration, the control is named by its visible label, is described by exactly the hint and error that exist, is invalid only when an error exists and has no axe violations.

**Input space.**

```ts
const text = fc.string({ unit: 'grapheme', minLength: 1, maxLength: 40 })
              .map(s => s.replace(/\s+/g, ' ').trim()).filter(s => s.length > 0)
const message = fc.option(fc.oneof(text, fc.constant('')), { nil: undefined })
const config = fc.record({
  id:       fc.stringMatching(/^[a-z][a-z0-9-]{0,15}$/),
  label:    text,
  hint:     message,
  error:    message,
  required: fc.boolean(),
  kind:     fc.constantFrom('text','email','password','tel','url','search','number','date','textarea','select'),
})
```

The `grapheme` unit makes the generator produce emoji, combining marks and right-to-left text, as well as the `<`, `&` and quote characters that React must escape. Whitespace is collapsed in the generator because accessible-name computation and `textContent` normalise whitespace, and the property is about wiring, not about whitespace rules.

**Rendering and checks.** For each case the test renders `<Field id label hint error required><Control/></Field>`, where `Control` is the input, `textarea` or `select` for the kind. Then:

1. `name = computeAccessibleName(control)` equals the normalised `textContent` of the `<label>` found by `label[for=id]` (REQ-4.4). The label text includes " (required)" when `required` is set, because that suffix is visible text.
2. `describedBy = control.getAttribute('aria-describedby')?.split(' ') ?? []` equals `[hintExists && `${id}-hint`, errorExists && `${id}-error`].filter(Boolean)`, and each id resolves to exactly one element (`document.querySelectorAll('#' + CSS.escape(id))`, length 1) (REQ-4.5, 4.6).
3. `aria-invalid === 'true'` iff the error exists (REQ-4.7).
4. The error element's text starts with "Error:" (REQ-4.8).
5. `await axe(container)` has no violations (REQ-4.9).

"Exists" means the generator produced a non-empty string. The empty string is the interesting edge case: `Field` tests `hint != null`, so `hint=""` renders an empty `<span id="x-hint">` and `error=""` sets `aria-invalid="true"` with no visible message, a control that is invalid with nothing to tell the user. The property treats `""` as "no message" (REQ-4.10) and is therefore expected to fail on the current `Field`. The fix is a small, local change in `Field.tsx`: compute `hasHint`/`hasError` from non-empty (trimmed) content. This is recorded as a task and is the reason REQ-4.10 exists; if the first run does not fail, the task is closed as "no defect found".

**Out of scope for the generator.** `checkbox` and `radio` are not generated: they belong in a `fieldset`/`legend` group and `Field` renders the label above the control, which is not their pattern. `hidden` inputs have no label by design.

**axe in jsdom.** axe's `color-contrast` rule needs a canvas and real layout. jsdom has neither, and `setup.ts` stubs `getContext` to `null`, so the rule is inert here. Contrast is covered by Property 1 instead. The test file says so in a comment (REQ-4.11) so nobody reads "zero violations" as "contrast verified".

**What this protects that example tests cannot.** An example test uses one label, one hint and one error. The generator reaches the combinations nobody writes by hand: hint without error, error without hint, neither, both; labels with `&`, quotes and combining characters; every input type including `password` and `date`, which have no ARIA role and are easy to skip. It finds interactions: for example, a refactor that builds `aria-describedby` with `join(' ')` but forgets to drop `undefined` shows up only when exactly one of the two messages is absent. It also catches the empty-string case above, which a human writing examples rarely thinks of.

## Property 3: Dialog (REQ-5)

**Invariant.** While the dialog is open, no sequence of Tab, Shift+Tab or clicks inside it puts focus outside it. When it closes, by any route, focus is on the trigger.

**Input space.**

```ts
const focusable = fc.constantFrom('button','input','textarea','select','link','tabindex0')
const distractor = fc.constantFrom('disabledButton','disabledInput','anchorNoHref','tabindexMinus1','text')
const content = fc.record({
  focusables: fc.array(focusable, { minLength: 1, maxLength: 10 }),
  distractors: fc.array(distractor, { maxLength: 6 }),
  order: fc.infiniteStream(fc.nat()) // used to interleave distractors among focusables
})
const actions = fc.array(fc.constantFrom('Tab','Shift+Tab','clickPanel'), { minLength: 1, maxLength: 30 })
const closeVia = fc.constantFrom('escape','closeButton','backdrop')
```

Each focusable child gets a unique accessible name so axe passes (`aria-label`, or a visible label for inputs). Distractors are the cases where a naive "is it focusable" selector and the browser disagree: disabled controls, `tabindex="-1"`, anchors without `href`.

**Procedure for a case.**

1. Render a trigger button and a controlled `Dialog` with the generated children.
2. Click the trigger so it holds focus, then wait for focus to land inside the panel (`waitFor`, because `Dialog` focuses in a `requestAnimationFrame`) (REQ-5.7).
3. For each action, run it with `user-event` (`keyboard('{Tab}')`, `keyboard('{Shift>}{Tab}{/Shift}')`, or `click(panel)` on the panel's non-interactive padding) and assert `panel.contains(document.activeElement)` (REQ-5.6).
4. Assert `role="dialog"`, `aria-modal="true"`, name equals title, and axe has no violations on the open dialog (REQ-5.10).
5. Close via the generated method and wait for the dialog to leave the DOM, then assert `document.activeElement === trigger` (REQ-5.9).

`user-event` honours `preventDefault()` on the Tab keydown, which is the mechanism `Dialog` relies on, so this exercises the real handler. jsdom does not implement `inert`, so if the trap fails, `user-event` moves focus to the next tabbable element in the document, normally the trigger or `body`, and the assertion fails. That is the detection mechanism.

**Documented exclusions.**

- Positive `tabindex` values are not generated (REQ-5.4). `Dialog.getFocusable` returns DOM order, but browsers order positive tabindex first, so the "first" and "last" elements the trap uses would be wrong. Positive tabindex is already an anti-pattern (and an axe `tabindex` rule violation, which the axe assertion would also report). The exclusion is recorded here and not hidden.
- Browsers' native Tab handling is not exercised (jsdom). Playwright `dialog.spec.ts` stays the real-browser check. The property proves the handler logic over many shapes; the e2e test proves the browser agrees on one.

**Expected finding.** `Dialog` only intercepts Tab when `document.activeElement` is the first or last focusable child. When a user clicks the panel's padding, focus moves to the panel itself (`tabIndex={-1}`), which is neither. Shift+Tab from there leaves the dialog. The `clickPanel` action is in the generator to find exactly this class of defect. If it fails, the fix in `Dialog.tsx` is to handle `document.activeElement === panel`: on Shift+Tab, `preventDefault()` and focus the last focusable child; the shrunk counterexample becomes an example test in `Dialog.test.tsx` (REQ-5.11).

**What this protects that example tests cannot.** `Dialog.test.tsx` has one case with two buttons and one with a single button. The trap logic depends on the count and the order of focusables, on what the selector counts as focusable and on where focus currently is. The generator varies all three: a single focusable (first equals last), ten focusables, a `div tabindex=0` as the last element, a disabled button as the last child (which the selector must skip), and arbitrary Tab and click histories before the one that matters. Example tests prove the trap works in the arrangement the author imagined. The property proves it for the arrangements the next developer will put in the dialog.

## Property 4: Tabs (REQ-6)

**Invariant.** After every key press, selection, roving tabindex, focus and panel visibility all describe the same single tab.

**Input space.**

```ts
const config = fc.integer({ min: 1, max: 12 }).chain(n =>
  fc.record({
    values: fc.uniqueArray(fc.stringMatching(/^[a-z][a-z0-9-]{0,9}$/), { minLength: n, maxLength: n }),
    labels: fc.array(text, { minLength: n, maxLength: n }),
    initial: fc.integer({ min: 0, max: n - 1 }),
    keys: fc.array(fc.constantFrom('ArrowLeft','ArrowRight','Home','End'), { maxLength: 50 }),
  }))
```

`chain` ties `initial` and the array lengths to the generated count, so shrinking reduces the count and keeps the case valid. Values are limited to id-safe characters because `Tabs` builds element ids from them.

**Procedure.** Render `Tabs defaultValue={values[initial]}` with one `Tab` and `TabPanel` per value, focus the initial tab, then press the keys one at a time. After the render and after each key, `checkState(model)` asserts:

- exactly one `role=tab` has `aria-selected="true"` (REQ-6.5);
- exactly that tab has `tabindex="0"`, all others `-1` (REQ-6.6);
- exactly one `role=tabpanel` is visible (`toBeVisible()`; the panels use the `hidden` attribute, which jsdom treats as `display: none`), it equals `document.getElementById(selectedTab.aria-controls)`, and its `aria-labelledby` equals the selected tab's id (REQ-6.7);
- `document.activeElement` is the selected tab (REQ-6.8).

The reference model is `next(count, index, key)`: `ArrowRight → (i+1) % n`, `ArrowLeft → (i-1+n) % n`, `Home → 0`, `End → n-1`. The test tracks the model index in parallel and asserts the DOM's selected index equals it (REQ-6.9). Model and implementation are written independently: the model is four lines of arithmetic on integers, while the component works through DOM queries, focus and `data-value` attributes.

The panels' own `tabindex="0"` is deliberate APG behaviour and is not part of this invariant; the check is scoped to `role=tab` elements.

**What this protects that example tests cannot.** `Tabs.test.tsx` checks each key once from a fixed three-tab layout. The defects PBT finds here come from state: wrap-around at the ends for any count (including 1, where ArrowRight and ArrowLeft must keep the same tab selected), repeated Home and End, and long mixed sequences in which `selectedId`, `tabindex`, `aria-selected` and `hidden` could fall out of step. A fixed three-tab test cannot see a bug that appears only with 12 tabs, with a duplicated-prefix value, or on the 17th key press. The model comparison also catches a wrong but self-consistent implementation (for example `End` selecting the second-to-last tab while every attribute agrees), which pure invariants about "exactly one" would miss.

## Summary: what example tests cannot do

| Property | Example tests give you | The property adds |
|---|---|---|
| Contrast | One or two hand-picked pairs | Every pair in every theme source, new tokens forced into the matrix, drift between the two dark blocks |
| Field | One label/hint/error layout | All present/absent combinations, all input types, hostile text, the empty-string edge |
| Dialog | Two fixed child layouts | 1 to 10 focusables with distractors, any Tab/click history, every close route |
| Tabs | Each key once on 3 tabs | 1 to 12 tabs, any key sequence, an independent model of the next index |

## Failure handling and reproduction

A failing property prints a seed and a path. To replay it: `FC_SEED=<seed> npm test -- Field.property` (the path is also accepted by `fast-check`; the README section documents both). `fast-check` shrinks the input, so a failing 10-child dialog with 30 actions usually reduces to one child and one or two actions. Each defect found becomes a permanent example test next to the existing ones.

## Risks

| Risk | Mitigation |
|---|---|
| Property tests slow `npm test`. | Per-file timeouts, fresh container per case, and the case count floor at 100 (not thousands) by default. `FC_NUM_RUNS` raises it locally or in nightly CI. |
| A property that cannot fail gives false confidence. | The contrast negative control (REQ-3.11); the Field and Dialog properties are expected to fail on current code in one known place each, which proves they can detect defects. The Tabs model check is validated by a deliberate one-line mutation during implementation (see tasks). |
| jsdom differs from browsers (no layout, no `inert`, no real Tab). | Properties assert logic. The existing Playwright tests remain the browser check. Limits are stated in the test comments and here. |
| Flaky focus timing from `requestAnimationFrame`. | Awaited with `waitFor` before the first action; no fixed sleeps. |
| The token matrix drifts from real usage. | Completeness test (REQ-3.10) and a task step that re-derives it from `grep var(--color-` in `src/`. |
| Shipped defects found by the properties are fixed in tests only. | REQ-8.6 requires the fix in `skeleton/src/`, each with a regression example test. |

## Accessibility of this work

This spec adds tests, no UI. It follows the repository rules in `.kiro/steering/accessibility.md` ("Every component and page has an axe test"; "Don't claim something is accessible without a test or a manual keyboard check backing it") by making those claims executable. Passing property tests are evidence for the specific invariants above in jsdom. They are not a conformance statement: screen-reader output, rendered contrast, real focus order and reflow remain manual or Playwright checks.
