# Skeleton Key — Requirements

## REQ-1 Project scaffold

**User story:** As a developer, I want a ready-to-run Vite + React 19 + TypeScript project in `skeleton/`, so that I can start building an accessible app without manual setup.

### Acceptance criteria

- 1.1 WHEN a developer runs `npm install && npm run dev` inside `skeleton/`, THEN the system SHALL start a local dev server and serve the app without errors.
- 1.2 WHEN TypeScript strict mode is enabled in `tsconfig.json`, THEN the system SHALL compile the project with zero type errors.
- 1.3 WHEN the developer runs `npm run build`, THEN the system SHALL produce a production bundle with no build errors.

---

## REQ-2 Semantic page shell

**User story:** As a screen-reader user, I want every page to have a consistent landmark structure, so that I can navigate the page by region without reading every word.

### Acceptance criteria

- 2.1 WHEN any page renders, THEN the system SHALL include exactly one `<header>`, one `<nav>` with an `aria-label`, one `<main>`, and one `<footer>` landmark (WCAG 1.3.1, 4.1.2).
- 2.2 WHEN any page renders, THEN the system SHALL include exactly one `<h1>` per page (WCAG 1.3.1).
- 2.3 WHEN any page renders, THEN the system SHALL set a unique, descriptive `<title>` in the document `<head>` (WCAG 2.4.2).
- 2.4 WHEN any page renders, THEN the first focusable element in the DOM SHALL be a "Skip to main content" anchor that moves focus to `<main>` when activated (WCAG 2.4.1).
- 2.5 WHEN a user activates the skip link, THEN the system SHALL move focus to the `<main>` element and scroll it into view without horizontal overflow (WCAG 2.4.1, 1.4.10).

---

## REQ-3 Routing with focus management

**User story:** As a keyboard or screen-reader user, I want focus to move to the new page heading after every route change, so that I know which page I am on without having to explore the whole page.

### Acceptance criteria

- 3.1 WHEN a route change completes, THEN the system SHALL move focus to the new page's `<h1>` element (WCAG 2.4.3).
- 3.2 WHEN a route change completes, THEN the page `<h1>` SHALL have `tabindex="-1"` so it can receive programmatic focus without appearing in the tab order (WCAG 2.4.3).
- 3.3 WHEN a route change completes, THEN the system SHALL announce the new page title through the live-region announcer (WCAG 4.1.3).
- 3.4 WHEN the skeleton ships, THEN it SHALL include a Home route (`/`) and an About route (`/about`) as working examples (REQ-1).

---

## REQ-4 Live-region announcer

**User story:** As a screen-reader user, I want status messages to be announced automatically, so that I am notified of changes without losing my place in the page.

### Acceptance criteria

- 4.1 WHEN a component calls the announcer with a message, THEN the system SHALL render a visually-hidden `aria-live="polite"` region and inject the message so assistive technology reads it (WCAG 4.1.3).
- 4.2 WHEN a component calls the announcer with `assertive: true`, THEN the system SHALL use `aria-live="assertive"` for that message (WCAG 4.1.3).
- 4.3 WHEN the same message is announced twice in a row, THEN the system SHALL still trigger a new announcement (e.g. by briefly clearing the region) (WCAG 4.1.3).
- 4.4 WHEN the announcer mounts, THEN the live region SHALL be present in the DOM before any message is sent so assistive technology has registered it (WCAG 4.1.3).

---

## REQ-5 Button primitive

**User story:** As a developer, I want a typed `<Button>` component, so that I can render accessible buttons consistently without re-implementing ARIA every time.

### Acceptance criteria

- 5.1 WHEN `<Button>` renders, THEN the system SHALL use a native `<button>` element so keyboard activation (Enter and Space) works without extra event handlers (WCAG 2.1.1).
- 5.2 WHEN `<Button>` renders with a `variant` prop, THEN the system SHALL apply the corresponding design-token-based styles without changing the underlying element or ARIA role.
- 5.3 WHEN `<Button>` is focused via keyboard, THEN the system SHALL show a `:focus-visible` outline with at least 3:1 contrast against its background (WCAG 2.4.7, 1.4.11).
- 5.4 WHEN `<Button>` renders, THEN the system SHALL meet the 24×24 CSS px minimum touch-target size (WCAG 2.5.8).

---

## REQ-6 Link primitive

**User story:** As a developer, I want a typed `<AppLink>` component wrapping React Router's `<Link>`, so that internal navigation is consistent and distinguishable from buttons.

### Acceptance criteria

- 6.1 WHEN `<AppLink>` renders, THEN the system SHALL produce an `<a href>` element, never a `<div>` or `<span>` (WCAG 4.1.2).
- 6.2 WHEN `<AppLink>` is focused via keyboard, THEN the system SHALL show a `:focus-visible` outline with at least 3:1 contrast (WCAG 2.4.7).
- 6.3 WHEN `<AppLink>` renders with an external URL, THEN the system SHALL add visually-hidden text "opens in new tab" and `target="_blank" rel="noopener noreferrer"` (WCAG 2.4.4).

---

## REQ-7 Field primitive

**User story:** As a developer, I want a `<Field>` component that bundles a label, hint, and error message with a form input, so that every form field is accessible without manual ARIA wiring.

### Acceptance criteria

- 7.1 WHEN `<Field>` renders, THEN the system SHALL render a visible `<label>` element associated with the input via matching `for`/`id` attributes (WCAG 1.3.1, 3.3.2).
- 7.2 WHEN a `hint` prop is provided, THEN the system SHALL render hint text and reference its `id` in the input's `aria-describedby` (WCAG 1.3.1).
- 7.3 WHEN an `error` prop is provided, THEN the system SHALL render error text, reference its `id` in the input's `aria-describedby`, and set `aria-invalid="true"` on the input (WCAG 3.3.1, 3.3.3).
- 7.4 WHEN both `hint` and `error` are provided, THEN the system SHALL include both IDs in `aria-describedby` so neither is lost (WCAG 1.3.1).
- 7.5 WHEN an error is present, THEN the system SHALL convey the error state with text and an icon, never by colour alone (WCAG 1.4.1).
- 7.6 WHEN `<Field>` renders, THEN the placeholder SHALL NOT be the sole label for the input (WCAG 3.3.2).

---

## REQ-8 Dialog primitive

**User story:** As a keyboard user, I want modal dialogs to trap focus inside and close on Escape, so that I cannot accidentally interact with content behind the modal.

### Acceptance criteria

- 8.1 WHEN a `<Dialog>` opens, THEN the system SHALL move focus to the first focusable element inside the dialog (WCAG 2.4.3).
- 8.2 WHILE a `<Dialog>` is open, THEN the system SHALL trap Tab and Shift+Tab focus inside the dialog (WCAG 2.1.2).
- 8.3 WHEN a user presses Escape while a `<Dialog>` is open, THEN the system SHALL close the dialog (WCAG 2.1.1).
- 8.4 WHEN a `<Dialog>` closes, THEN the system SHALL return focus to the element that triggered it (WCAG 2.4.3).
- 8.5 WHEN a `<Dialog>` renders, THEN the system SHALL use the native `<dialog>` element (or a `<div role="dialog">` with `aria-modal="true"`) and expose an accessible name via `aria-labelledby` pointing to its heading (WCAG 4.1.2).
- 8.6 WHEN a `<Dialog>` is open, THEN content behind the dialog SHALL be inert (via the `inert` attribute or equivalent) so screen readers cannot reach it (WCAG 1.3.1).

---

## REQ-9 Toast primitive

**User story:** As a user, I want brief status notifications that appear and disappear automatically, so that I am kept informed of background actions without blocking my workflow.

### Acceptance criteria

- 9.1 WHEN a toast is shown, THEN the system SHALL announce its message through a polite `aria-live` region (WCAG 4.1.3).
- 9.2 WHEN a toast renders, THEN it SHALL be dismissible by keyboard (a close button activated with Enter or Space) (WCAG 2.1.1).
- 9.3 WHEN `prefers-reduced-motion` is active OR the user has toggled reduced motion on, THEN the system SHALL show the toast without a slide or fade animation (WCAG 2.3.3).
- 9.4 WHEN a toast auto-dismisses, THEN the auto-dismiss timer SHALL be at least 5 seconds and the toast SHALL remain visible until dismissed if the user hovers or focuses it (WCAG 2.2.1).

---

## REQ-10 Tabs primitive

**User story:** As a keyboard user, I want a tabbed interface that follows the ARIA Authoring Practices Guide pattern, so that I can switch tabs with arrow keys and not Tab.

### Acceptance criteria

- 10.1 WHEN `<Tabs>` renders, THEN the system SHALL use `role="tablist"`, `role="tab"`, and `role="tabpanel"` with matching `aria-controls` / `aria-labelledby` wiring (WCAG 4.1.2).
- 10.2 WHEN a tab has focus and the user presses ArrowRight or ArrowLeft, THEN the system SHALL move focus to the next or previous tab (APG carousel/tab pattern, WCAG 2.1.1).
- 10.3 WHEN a tab has focus and the user presses Home or End, THEN the system SHALL move focus to the first or last tab respectively (WCAG 2.1.1).
- 10.4 WHEN a tab is selected, THEN the system SHALL set `aria-selected="true"` on that tab and `aria-selected="false"` on all others (WCAG 4.1.2).
- 10.5 WHEN a tab panel is not selected, THEN the system SHALL hide it from both visual display and the accessibility tree (WCAG 1.3.1).

---

## REQ-11 Design tokens — light and dark themes

**User story:** As a developer, I want a single set of CSS custom properties for colour, spacing, and typography, so that every component uses consistent, contrast-checked values in both light and dark mode.

### Acceptance criteria

- 11.1 WHEN the page renders in light mode, THEN all text/background token pairs SHALL have a contrast ratio of at least 4.5:1 for body text and 3:1 for large text (WCAG 1.4.3).
- 11.2 WHEN the page renders in dark mode (via `prefers-color-scheme: dark` or the in-app toggle), THEN the same contrast ratios SHALL hold (WCAG 1.4.3).
- 11.3 WHEN any interactive component renders, THEN its border or indicator token SHALL have at least 3:1 contrast against the adjacent background (WCAG 1.4.11).
- 11.4 WHEN the user's OS is in dark mode, THEN the app SHALL default to the dark theme without JavaScript intervention (WCAG 1.4.3).
- 11.5 WHEN a developer adds a new component, THEN it SHALL use only design-token custom properties for colour; hardcoded colour values SHALL fail lint.
- 11.6 WHEN the page is zoomed to 400% (320 px viewport width), THEN no content SHALL require horizontal scrolling (WCAG 1.4.10).
- 11.7 WHEN the WCAG text-spacing bookmarklet overrides are applied (letter-spacing, word-spacing, line-height, paragraph spacing), THEN no content or functionality SHALL be lost (WCAG 1.4.12).

---

## REQ-12 Reduced-motion support

**User story:** As a user who experiences motion sickness, I want all animations to be suppressed or reduced, so that the app does not trigger vestibular discomfort.

### Acceptance criteria

- 12.1 WHEN `prefers-reduced-motion: reduce` is set in the OS, THEN the system SHALL suppress all transitions, parallax, and auto-playing animations in CSS and JavaScript (WCAG 2.3.3, 2.2.2).
- 12.2 WHEN the app renders, THEN it SHALL provide an in-app toggle to override the motion preference without requiring an OS setting change (WCAG 2.3.3).
- 12.3 WHEN the user activates the reduced-motion toggle, THEN the system SHALL persist the preference for the session and apply it immediately without a page reload (WCAG 2.3.3).
- 12.4 WHEN the in-app toggle is off (motion enabled) but `prefers-reduced-motion` is set, THEN the system SHALL still respect the OS preference (WCAG 2.3.3).

---

## REQ-13 Decorative spooky art

**User story:** As a screen-reader user, I want decorative images and illustrations to be hidden from the accessibility tree, so that they do not add noise to my reading experience.

### Acceptance criteria

- 13.1 WHEN a decorative image or SVG renders, THEN the system SHALL set `alt=""` on `<img>` elements or `aria-hidden="true"` on inline SVGs (WCAG 1.1.1).
- 13.2 WHEN spooky decorative elements (ghosts, fog, bats) render, THEN they SHALL carry no meaning — all informational content SHALL be in real text (WCAG 1.1.1).

---

## REQ-14 ESLint with jsx-a11y

**User story:** As a developer, I want accessibility lint rules to run on every file save and in CI, so that common mistakes are caught before they reach review.

### Acceptance criteria

- 14.1 WHEN the developer runs `npm run lint`, THEN `eslint-plugin-jsx-a11y` in strict mode SHALL run across all `.tsx` and `.ts` files and report any violations.
- 14.2 WHEN the developer runs `npm run lint` on the unmodified scaffold, THEN the system SHALL report zero lint violations.

---

## REQ-15 Component axe tests (Vitest)

**User story:** As a developer, I want automated axe tests for every primitive, so that regressions in accessibility are caught in the test suite before they ship.

### Acceptance criteria

- 15.1 WHEN the developer runs `npm test`, THEN every primitive component (Button, AppLink, Field, Dialog, Toast, Tabs) SHALL have at least one `vitest-axe` test that renders the component and asserts zero axe violations.
- 15.2 WHEN the developer runs `npm test`, THEN the PageShell component SHALL have an axe test that asserts zero violations.
- 15.3 WHEN any axe test fails, THEN `npm test` SHALL exit with a non-zero code.

---

## REQ-16 Page-level Playwright + axe test

**User story:** As a developer, I want a Playwright test that runs axe against a real rendered page, so that integration-level accessibility issues not caught by unit tests are surfaced.

### Acceptance criteria

- 16.1 WHEN the developer runs `npm run test:e2e`, THEN a Playwright test SHALL load the Home page, run `@axe-core/playwright`, and assert zero violations.
- 16.2 WHEN the developer runs `npm run test:e2e`, THEN a Playwright test SHALL load the About page and assert zero axe violations.
- 16.3 WHEN any page-level axe violation is found, THEN `npm run test:e2e` SHALL exit with a non-zero code.

---

## REQ-17 Dev-time axe overlay

**User story:** As a developer, I want axe violations logged to the browser console during development, so that I get immediate feedback without running the test suite.

### Acceptance criteria

- 17.1 WHEN the app runs in development mode (`import.meta.env.DEV`), THEN `@axe-core/react` SHALL be initialised and log any violations to the browser console.
- 17.2 WHEN the app runs in production mode, THEN `@axe-core/react` SHALL NOT be bundled or initialised (WCAG n/a — performance and security).
