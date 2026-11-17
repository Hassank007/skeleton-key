# Skeleton Key — Design Document

## 1. Architecture overview

The skeleton is a standalone Vite project. It is not a library — it is a template that developers copy into `apps/<name>` via `npm run new-app <name>`. The copy is then owned by the app team. Any improvements discovered while building an app go back into `skeleton/` first so future copies benefit.

```
skeleton/
  public/                   static assets (favicon, etc.)
  src/
    components/             accessible primitives
    contexts/               React contexts (Announcer, MotionPreference)
    hooks/                  shared hooks (useFocusOnRouteChange, useAnnounce)
    pages/                  Home, About (demo pages)
    tokens/                 CSS custom properties (tokens.css, dark.css)
    App.tsx                 router root, mounts PageShell
    main.tsx                entry point, mounts App, dev-only axe init
    index.css               global reset and base styles
  tests/
    unit/                   Vitest + vitest-axe component tests
    e2e/                    Playwright + @axe-core/playwright page tests
  index.html
  vite.config.ts
  tsconfig.json
  tsconfig.node.json
  .eslintrc.cjs
  playwright.config.ts
  package.json
```

The page shell (`PageShell`) is a layout component wrapping every route. The router is configured in `App.tsx`. Each page is a thin component that sets its `<title>` and renders its `<h1>`.

---

## 2. Folder layout: `src/components/`

| File | Component | Accessibility guarantee |
|---|---|---|
| `PageShell.tsx` | `<PageShell>` | Renders skip link, `<header>`, `<nav aria-label="Main">`, `<main id="main-content">`, `<footer>`; exactly one landmark of each kind. |
| `SkipLink.tsx` | `<SkipLink>` | First focusable DOM element; `href="#main-content"`; visible on focus (WCAG 2.4.1). |
| `Button.tsx` | `<Button>` | Native `<button>`; focus-visible ring; min 24×24 px target (WCAG 2.1.1, 2.4.7, 2.5.8). |
| `AppLink.tsx` | `<AppLink>` | Wraps React Router `<Link>` or `<a>`; always produces `<a href>`; external links get visually-hidden "opens in new tab" text (WCAG 2.4.4, 4.1.2). |
| `Field.tsx` | `<Field>` | `<label for>` wired to input `id`; hint and error linked via `aria-describedby`; `aria-invalid` on error; error text + icon (WCAG 1.3.1, 3.3.1–3.3.3). Inline error carries **no** `role="alert"` — multiple simultaneous alerts on submit would flood AT users; submit-time announcement is an error summary component's responsibility (focus the summary, announce via the shared assertive live-region). |
| `Dialog.tsx` | `<Dialog>` | APG modal pattern: focus moves in, Tab trapped, Escape closes, focus returns to trigger; `aria-labelledby` heading; backdrop `inert` (WCAG 2.1.2, 2.4.3). |
| `Toast.tsx` | `<Toast>` / `<ToastRegion>` | Polite `aria-live` region; dismissible by keyboard; auto-dismiss ≥ 5 s, paused on hover/focus; no animation when reduced motion is on (WCAG 4.1.3, 2.2.1). |
| `Tabs.tsx` | `<Tabs>` / `<Tab>` / `<TabPanel>` | APG tab pattern: `role="tablist/tab/tabpanel"`, `aria-controls`, `aria-labelledby`, arrow-key navigation, Home/End, `aria-selected` (WCAG 2.1.1, 4.1.2). |

---

## 3. Contexts and hooks

### `AnnouncerContext` (`src/contexts/AnnouncerContext.tsx`)

Provides a single `announce(message: string, options?: { assertive?: boolean })` function to the whole tree. The underlying live region is a visually-hidden `<div>` mounted once at the root. Assertive announcements use `aria-live="assertive"`. Duplicate messages are handled by clearing the region on a microtask before writing the new message, ensuring the AT re-reads it (WCAG 4.1.3).

### `MotionContext` (`src/contexts/MotionContext.tsx`)

Reads `window.matchMedia('(prefers-reduced-motion: reduce)')` on mount and watches for changes. Exposes `{ reducedMotion: boolean; toggle: () => void }`. The toggle overrides the OS setting for the session but never overrides OS → no-motion when the toggle is at its default state. A `data-reduced-motion` attribute is set on `<html>` so CSS can respond without a JS paint (WCAG 2.3.3).

### `useFocusOnRouteChange` (`src/hooks/useFocusOnRouteChange.ts`)

Called once in `App.tsx`. Uses React Router's `useLocation` to detect navigation. On each location change it calls `announce(pageTitle)` then sets focus to the page's `<h1 tabindex="-1">` via a stable `ref` passed through context (WCAG 2.4.3, 4.1.3).

### `useAnnounce` (`src/hooks/useAnnounce.ts`)

Convenience hook that returns the `announce` function from `AnnouncerContext`.

---

## 4. Routing

React Router v6 `<BrowserRouter>` wraps the app in `main.tsx`. Routes are defined in `App.tsx` using `<Routes>` / `<Route>`. Two routes ship with the skeleton:

| Path | Component | Page title |
|---|---|---|
| `/` | `<HomePage>` | "Home — Skeleton Key" |
| `/about` | `<AboutPage>` | "About — Skeleton Key" |

Each page component sets `document.title` in a `useEffect` and renders an `<h1 tabindex="-1" ref={h1Ref}>`. The `useFocusOnRouteChange` hook reads location changes and focuses that ref. This is simpler and more reliable than a wrapper component because each page owns its heading.

---

## 5. Design tokens

Tokens live in two CSS files imported in `index.css`:

- `src/tokens/tokens.css` — base tokens (light theme, `@layer base`).
- `src/tokens/dark.css` — dark overrides in `@media (prefers-color-scheme: dark)` and `[data-theme="dark"]`.

### Token categories

| Category | Examples |
|---|---|
| Colour — surface | `--color-surface`, `--color-surface-raised` |
| Colour — content | `--color-text`, `--color-text-muted`, `--color-text-on-accent` |
| Colour — accent | `--color-accent`, `--color-accent-hover` |
| Colour — feedback | `--color-error`, `--color-success`, `--color-warning` |
| Colour — UI chrome | `--color-border`, `--color-focus-ring` |
| Spacing | `--space-1` … `--space-8` (4 px base unit) |
| Typography | `--font-body`, `--font-heading`, `--font-size-base`, `--font-size-lg`, `--font-size-xl` |
| Radius | `--radius-sm`, `--radius-md` |
| Motion | `--duration-fast`, `--duration-normal`, `--easing-default` |

### Contrast targets

All token pairs were verified with the [APCA contrast algorithm](https://www.myndex.com/APCA/) and the WCAG 2.x relative luminance formula:

- `--color-text` on `--color-surface`: ≥ 7:1 (exceeds 4.5:1 body text minimum, WCAG 1.4.3).
- `--color-text-muted` on `--color-surface`: ≥ 4.5:1.
- `--color-text-on-accent` on `--color-accent`: ≥ 4.5:1.
- `--color-border` on `--color-surface`: ≥ 3:1 (UI component minimum, WCAG 1.4.11).
- `--color-focus-ring` on all backgrounds it appears against: ≥ 3:1 (WCAG 2.4.7).
- Same ratios hold in the dark theme.

#### Link text colour — `--color-link` / `--color-link-hover`

`--color-accent` is intentionally separate from link text colour because its dark-theme value (`#9333ea` on `#0f0a1a`) is only **3.62:1** — which passes the 3:1 UI-component threshold (WCAG 1.4.11) but fails the 4.5:1 text minimum (WCAG 1.4.3).

A dedicated `--color-link` token is provided for all link text:

| Theme | Token value | Surface | Measured ratio |
|---|---|---|---|
| Light | `#6b21a8` | `#f5f0ff` | **9.25:1** ✓ |
| Dark  | `#c084fc` | `#0f0a1a` | **7.43:1** ✓ |

Rule: **always use `--color-link` for link text**; never use `--color-accent` for text in dark mode.

The Kiroween palette uses deep purples, muted ambers, and near-black backgrounds in dark mode — spooky but readable.

### Motion tokens

When `data-reduced-motion` is on `<html>`, a single CSS rule sets `--duration-fast: 0ms` and `--duration-normal: 0ms`, removing all token-driven animation without touching individual components. JavaScript animations check `MotionContext.reducedMotion` before running.

---

## 6. Focus-visible and scroll-margin

A global rule in `index.css`:

```css
:focus-visible {
  outline: 3px solid var(--color-focus-ring);
  outline-offset: 2px;
}
```

Sticky `<header>` height is exposed as `--header-height`. Every focusable element in `<main>` gets:

```css
scroll-margin-top: var(--header-height);
```

This prevents focused elements from being obscured by the sticky header (WCAG 2.4.11).

---

## 7. Testing strategy

### Unit tests (Vitest + Testing Library + vitest-axe)

Location: `tests/unit/`. One test file per component. Each file:
1. Renders the component with Testing Library's `render`.
2. Calls `axe(container)` from `vitest-axe`.
3. Asserts `expect(results).toHaveNoViolations()`.
4. Adds targeted interaction tests (keyboard navigation, focus management) where the component has complex behaviour.

Components covered: `PageShell`, `Button`, `AppLink`, `Field`, `Dialog`, `Toast`, `Tabs`.

### End-to-end tests (Playwright + @axe-core/playwright)

Location: `tests/e2e/`. One spec file per page. Each spec:
1. Navigates to the page URL with Playwright.
2. Calls `checkA11y()` from `@axe-core/playwright`.
3. Asserts zero violations.

Pages covered: Home (`/`), About (`/about`).

### Dev-time overlay (@axe-core/react)

Initialised in `main.tsx` inside `if (import.meta.env.DEV)`. This block is tree-shaken in production builds. It surfaces violations in the browser console as the developer works, without any test runner.

### Lint (ESLint + eslint-plugin-jsx-a11y)

`eslint-plugin-jsx-a11y` runs in strict mode. The `npm run lint` script runs ESLint across `src/` and `tests/unit/`. Lint is a gate: zero warnings allowed in the scaffold.

---

## 8. Dependencies and rationale

| Package | Type | Reason |
|---|---|---|
| `vite` | devDep | Fast build tool with native ESM HMR; standard for the stack. |
| `react`, `react-dom` | dep | UI library (v19 required by spec). |
| `react-router-dom` | dep | Declarative client-side routing; well-maintained; APG focus management fits its `useLocation` hook. |
| `typescript` | devDep | Strict types reduce class of bugs; required by spec. |
| `@vitejs/plugin-react` | devDep | Vite plugin for JSX transform + React Fast Refresh. |
| `vitest` | devDep | Vite-native test runner; shares config with the build. |
| `@testing-library/react` | devDep | Encourages accessible queries (`getByRole`, `getByLabelText`); de-facto standard. |
| `@testing-library/user-event` | devDep | Realistic keyboard/pointer simulation for interaction tests. |
| `@testing-library/jest-dom` | devDep | Custom matchers (`toHaveNoViolations` works alongside this). |
| `vitest-axe` | devDep | Vitest-compatible axe-core integration; provides `toHaveNoViolations` matcher. |
| `axe-core` | devDep | Underlying accessibility rules engine used by both vitest-axe and @axe-core/playwright. |
| `@axe-core/react` | devDep | Dev-only browser console overlay; tree-shaken in prod. |
| `playwright` | devDep | Cross-browser E2E test runner; required by spec. |
| `@axe-core/playwright` | devDep | First-party axe integration for Playwright; provides `checkA11y`. |
| `eslint` | devDep | Linter; required by spec. |
| `eslint-plugin-jsx-a11y` | devDep | Accessibility lint rules for JSX; required by spec. |
| `@typescript-eslint/parser` | devDep | TypeScript parser for ESLint. |
| `@typescript-eslint/eslint-plugin` | devDep | TypeScript-aware lint rules. |

No runtime UI library is added. The accessibility primitives are purpose-built in this skeleton, which is the entire point of the project.
