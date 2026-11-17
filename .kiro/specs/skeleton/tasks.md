# Skeleton Key — Implementation Tasks

## 1. Project scaffold

- [x] 1. Initialise the `skeleton/` Vite + React 19 + TypeScript project
  - [x] 1.1 Run `npm create vite@latest skeleton -- --template react-ts` from the repo root and confirm it generates `skeleton/` with `index.html`, `vite.config.ts`, `tsconfig.json`, and `src/main.tsx`. *(REQ-1)*
  - [x] 1.2 Enable `strict: true` in `tsconfig.json` and verify `npm run build` exits cleanly with zero type errors. *(REQ-1)*
  - [x] 1.3 Delete the Vite placeholder content (`src/App.css`, `src/assets/react.svg`, boilerplate in `App.tsx`) and replace `App.tsx` with a minimal router root stub. *(REQ-1)*
  - [x] 1.4 Add `react-router-dom` as a dependency and wrap `<App>` in `<BrowserRouter>` in `main.tsx`. *(REQ-1, REQ-3)*

## 2. ESLint with jsx-a11y

- [x] 2. Configure ESLint with `eslint-plugin-jsx-a11y` strict mode
  - [x] 2.1 Install `eslint`, `eslint-plugin-jsx-a11y`, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin` as dev dependencies. *(REQ-14)*
  - [x] 2.2 Create `.eslintrc.cjs` extending `plugin:jsx-a11y/strict` and `plugin:@typescript-eslint/recommended` with `parser: '@typescript-eslint/parser'` and `plugins: ['jsx-a11y']`. *(REQ-14)*
  - [x] 2.3 Add `"lint": "eslint src --ext .ts,.tsx --max-warnings 0"` to `package.json` scripts. *(REQ-14)*
  - [x] 2.4 Run `npm run lint` on the stub project and confirm zero violations. *(REQ-14)*

## 3. Design tokens

- [x] 3. Create the CSS design-token files
  - [x] 3.1 Create `src/tokens/tokens.css` with all light-theme custom properties: surface colours, text colours, accent colours, feedback colours, border/focus-ring, spacing scale (`--space-1` to `--space-8`), typography, radius, and motion duration tokens. *(REQ-11)*
  - [x] 3.2 Create `src/tokens/dark.css` with `@media (prefers-color-scheme: dark)` and `[data-theme="dark"]` overrides for every colour token; verify the same contrast ratios hold in dark mode. *(REQ-11)*
  - [x] 3.3 Import both token files in `src/index.css` and add the global reset, `body` base styles using only token variables, and the `:focus-visible` ring rule with `var(--color-focus-ring)`. *(REQ-11)*
  - [x] 3.4 Add `scroll-margin-top: var(--header-height)` to focusable elements inside `<main>` in the global stylesheet. *(REQ-11)*

## 4. MotionContext and reduced-motion toggle

- [x] 4. Implement `MotionContext` and wire the `data-reduced-motion` attribute
  - [x] 4.1 Create `src/contexts/MotionContext.tsx` that reads `prefers-reduced-motion` via `matchMedia`, exposes `{ reducedMotion: boolean; toggle: () => void }`, and sets `data-reduced-motion="true|false"` on `<html>` whenever the value changes. *(REQ-12)*
  - [x] 4.2 Add a `useMotion` convenience hook that reads `MotionContext`. *(REQ-12)*
  - [x] 4.3 Add a CSS rule in `index.css`: `[data-reduced-motion="true"] { --duration-fast: 0ms; --duration-normal: 0ms; }` so all token-driven animations stop without touching individual components. *(REQ-12)*
  - [x] 4.4 Mount `<MotionProvider>` at the root in `main.tsx` wrapping `<App>`. *(REQ-12)*

## 5. AnnouncerContext (live-region announcer)

- [x] 5. Implement the shared live-region announcer
  - [x] 5.1 Create `src/contexts/AnnouncerContext.tsx` with a visually-hidden `aria-live="polite"` div mounted once at the root; expose `announce(message, { assertive? })`. *(REQ-4)*
  - [x] 5.2 Handle assertive mode by rendering a second `aria-live="assertive"` region and routing calls with `assertive: true` to it. *(REQ-4)*
  - [x] 5.3 Handle duplicate messages: clear the target region on a microtask (`Promise.resolve().then(...)`) before writing, so AT re-reads the same string. *(REQ-4)*
  - [x] 5.4 Add a `useAnnounce` hook in `src/hooks/useAnnounce.ts` that returns the `announce` function from context. *(REQ-4)*
  - [x] 5.5 Mount `<AnnouncerProvider>` at the root in `main.tsx`, inside `<MotionProvider>`. *(REQ-4)*

## 6. Page shell and skip link

- [x] 6. Build the `PageShell` and `SkipLink` components
  - [x] 6.1 Create `src/components/SkipLink.tsx`: an `<a href="#main-content">` that is visually hidden until `:focus-visible`, then becomes visible at the top of the viewport. *(REQ-2)*
  - [x] 6.2 Create `src/components/PageShell.tsx` rendering: `<SkipLink>`, `<header>`, `<nav aria-label="Main">` with navigation links, `<main id="main-content">` wrapping `{children}`, and `<footer>`. *(REQ-2)*
  - [x] 6.3 Ensure `<nav>` contains only `<AppLink>` components (not plain `<a>`) so they pick up focus styles. *(REQ-2, REQ-6)*
  - [x] 6.4 Expose `--header-height` as a CSS custom property on `<header>` using an inline style and a ResizeObserver so the scroll-margin stays accurate. *(REQ-2)*

## 7. Routing and focus management

- [x] 7. Implement route-change focus management
  - [x] 7.1 Create `src/hooks/useFocusOnRouteChange.ts` that uses `useLocation` from React Router; on each location change it calls `announce(document.title)` then focuses the `<h1>` by querying `main h1[tabindex="-1"]`. *(REQ-3)*
  - [x] 7.2 Call `useFocusOnRouteChange()` once inside `App.tsx` (a component that is a child of `<BrowserRouter>`). *(REQ-3)*
  - [x] 7.3 Define routes in `App.tsx`: `<Route path="/" element={<HomePage />} />` and `<Route path="/about" element={<AboutPage />} />`. *(REQ-3)*

## 8. Demo pages (Home and About)

- [x] 8. Create the two demo pages
  - [x] 8.1 Create `src/pages/HomePage.tsx` with `useEffect` setting `document.title = "Home — Skeleton Key"` and rendering `<h1 tabindex="-1">Welcome to Skeleton Key</h1>` plus brief explanatory copy. *(REQ-3)*
  - [x] 8.2 Create `src/pages/AboutPage.tsx` with `useEffect` setting `document.title = "About — Skeleton Key"` and rendering `<h1 tabindex="-1">About</h1>` plus brief explanatory copy. *(REQ-3)*
  - [x] 8.3 Confirm that tabbing through each page never encounters a keyboard trap and that heading order is sequential (no skipped levels). *(REQ-3)*

## 9. Button primitive

- [x] 9. Build and test the `Button` component
  - [x] 9.1 Create `src/components/Button.tsx` using a native `<button>` element; accept `variant?: 'primary' | 'secondary' | 'ghost'` and `size?: 'sm' | 'md' | 'lg'`; apply token-based styles; enforce `min-width: 44px; min-height: 24px` for touch target. *(REQ-5)*
  - [x] 9.2 Add a one-line JSDoc comment: `/** Renders a native <button>; guarantees keyboard activation and visible focus ring (WCAG 2.1.1, 2.4.7). */` *(REQ-5)*
  - [x] 9.3 Create `tests/unit/Button.test.tsx`: render each variant, run `axe(container)`, assert `toHaveNoViolations()`; also assert `getByRole('button')` is present. *(REQ-15)*

## 10. AppLink primitive

- [x] 10. Build and test the `AppLink` component
  - [x] 10.1 Create `src/components/AppLink.tsx` wrapping React Router `<Link>` for internal URLs and `<a target="_blank" rel="noopener noreferrer">` for external; add visually-hidden `<span> (opens in new tab)</span>` for external links. *(REQ-6)*
  - [x] 10.2 Add a one-line JSDoc comment describing the guarantee. *(REQ-6)*
  - [x] 10.3 Create `tests/unit/AppLink.test.tsx`: render an internal link and an external link, run axe on each, assert zero violations; assert the external link contains the visually-hidden "opens in new tab" text. *(REQ-15)*

## 11. Field primitive

- [x] 11. Build and test the `Field` component
  - [x] 11.1 Create `src/components/Field.tsx` accepting `id`, `label`, `hint?`, `error?`, `children` (the input element); wire `<label htmlFor={id}>`, hint `<span id={hintId}>`, error `<span id={errorId}>`; compose `aria-describedby` from whichever are present; set `aria-invalid="true"` on the child input when `error` is set. *(REQ-7)*
  - [x] 11.2 Render the error with a text prefix ("Error:") and an inline SVG icon with `aria-hidden="true"` so the state is never conveyed by colour alone. *(REQ-7)*
  - [x] 11.3 Add a one-line JSDoc comment describing the guarantee. *(REQ-7)*
  - [x] 11.4 Create `tests/unit/Field.test.tsx`: render with label only, with hint, and with error; run axe on each; assert zero violations; assert `aria-describedby` contains the right IDs; assert `aria-invalid` is set when error is present. *(REQ-15)*

## 12. Dialog primitive

- [x] 12. Build and test the `Dialog` component
  - [x] 12.1 Create `src/components/Dialog.tsx` using a `<div role="dialog" aria-modal="true" aria-labelledby={titleId}>` (or native `<dialog>` element); on open, move focus to the first focusable child; trap Tab/Shift+Tab within the dialog; close on Escape; on close, return focus to the trigger ref passed as a prop. *(REQ-8)*
  - [x] 12.2 Apply `inert` to all siblings of the dialog when it is open so screen readers cannot reach background content. *(REQ-8)*
  - [x] 12.3 Add a one-line JSDoc comment describing the guarantee. *(REQ-8)*
  - [x] 12.4 Create `tests/unit/Dialog.test.tsx`: render a Dialog with a trigger button; open it; run axe; assert zero violations; assert focus moves into the dialog; assert Escape closes it and focus returns to the trigger. *(REQ-15)*

## 13. Toast primitive

- [x] 13. Build and test the `Toast` / `ToastRegion` components
  - [x] 13.1 Create `src/components/Toast.tsx` with a `<ToastRegion>` that renders a visually-positioned `aria-live="polite"` container and a list of `<Toast>` items; each item has a close button (`<button aria-label="Dismiss">`). *(REQ-9)*
  - [x] 13.2 Implement auto-dismiss with a minimum 5-second timer; pause the timer on `mouseenter` / `focus` and resume on `mouseleave` / `blur`. *(REQ-9)*
  - [x] 13.3 Suppress the enter/exit CSS transition when `MotionContext.reducedMotion` is true. *(REQ-9, REQ-12)*
  - [x] 13.4 Add a one-line JSDoc comment describing the guarantee. *(REQ-9)*
  - [x] 13.5 Create `tests/unit/Toast.test.tsx`: render a toast message; run axe; assert zero violations; assert the message appears in an `aria-live` region; assert the dismiss button is keyboard-operable. *(REQ-15)*

## 14. Tabs primitive

- [x] 14. Build and test the `Tabs` component
  - [x] 14.1 Create `src/components/Tabs.tsx` with `<Tabs>`, `<Tab>`, `<TabPanel>` sub-components; implement `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-controls`, `aria-labelledby`, `aria-selected`; manage selected state internally or via controlled props. *(REQ-10)*
  - [x] 14.2 Implement arrow-key navigation (ArrowLeft/ArrowRight cycles focus through tabs; Home/End jump to first/last); pressing Enter or Space on a focused tab selects it. *(REQ-10)*
  - [x] 14.3 Hide non-selected panels with `hidden` attribute (removes from both visual display and accessibility tree). *(REQ-10)*
  - [x] 14.4 Add a one-line JSDoc comment describing the guarantee. *(REQ-10)*
  - [x] 14.5 Create `tests/unit/Tabs.test.tsx`: render three tabs; run axe; assert zero violations; simulate ArrowRight and assert focus moves; assert the new panel becomes visible and the old one is hidden. *(REQ-15)*

## 15. PageShell axe test

- [x] 15. Write the axe test for `PageShell`
  - [x] 15.1 Create `tests/unit/PageShell.test.tsx`: render `<PageShell>` inside a `MemoryRouter` with a stub child `<h1>`; run axe; assert zero violations; assert the skip link is the first focusable element; assert all four landmarks are present. *(REQ-15, REQ-2)*

## 16. Dev-time axe overlay

- [ ] 16. Wire `@axe-core/react` for development only
  - [ ] 16.1 Install `@axe-core/react` as a dev dependency. *(REQ-17)*
  - [ ] 16.2 In `main.tsx`, add `if (import.meta.env.DEV) { import('@axe-core/react').then(axe => axe.default(React, ReactDOM, 1000)); }` so the import is dynamic and tree-shaken in production. *(REQ-17)*

## 17. Vitest configuration

- [ ] 17. Configure Vitest for unit tests
  - [ ] 17.1 Install `vitest`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `vitest-axe`, and `axe-core` as dev dependencies. *(REQ-15)*
  - [ ] 17.2 Add a `test` block to `vite.config.ts` with `environment: 'jsdom'` and `setupFiles: ['./tests/unit/setup.ts']`. *(REQ-15)*
  - [ ] 17.3 Create `tests/unit/setup.ts` that imports `@testing-library/jest-dom` and `vitest-axe/extend-expect`. *(REQ-15)*
  - [ ] 17.4 Add `"test": "vitest run"` and `"test:watch": "vitest"` to `package.json` scripts. *(REQ-15)*

## 18. Playwright configuration and E2E axe tests

- [ ] 18. Configure Playwright and write the page-level axe tests
  - [ ] 18.1 Install `playwright` (with Chromium) and `@axe-core/playwright` as dev dependencies. *(REQ-16)*
  - [ ] 18.2 Create `playwright.config.ts` with `baseURL: 'http://localhost:5173'`, one Chromium project, and `webServer` pointing to `npm run dev`. *(REQ-16)*
  - [ ] 18.3 Create `tests/e2e/home.spec.ts`: navigate to `/`; call `checkA11y(page)`; assert zero violations. *(REQ-16)*
  - [ ] 18.4 Create `tests/e2e/about.spec.ts`: navigate to `/about`; call `checkA11y(page)`; assert zero violations. *(REQ-16)*
  - [ ] 18.5 Add `"test:e2e": "playwright test"` to `package.json` scripts. *(REQ-16)*

## 19. Decorative art handling

- [ ] 19. Add decorative spooky art to the Home page and verify it is hidden from AT
  - [ ] 19.1 Add at least one inline SVG decorative illustration (e.g. a simple ghost or bat) to `HomePage.tsx` with `aria-hidden="true"` and no `alt` or `title` text. *(REQ-13)*
  - [ ] 19.2 Add a unit test assertion in the HomePage or PageShell test that the decorative SVG has `aria-hidden="true"`. *(REQ-13, REQ-15)*

## 20. Final verification

- [ ] 20. Verify the complete scaffold passes all checks
  - [ ] 20.1 Run `npm run lint` inside `skeleton/` and confirm zero violations. *(REQ-14)*
  - [ ] 20.2 Run `npm test` and confirm all unit + axe tests pass with zero violations. *(REQ-15)*
  - [ ] 20.3 Run `npm run build` and confirm a clean production bundle with no type errors. *(REQ-1)*
  - [ ] 20.4 Run `npm run test:e2e` and confirm both page-level axe tests pass with zero violations. *(REQ-16)*
  - [ ] 20.5 Manually tab through the Home and About pages in a browser; confirm focus order is logical, the skip link appears on first Tab, the focus ring is always visible, and no focus is ever lost after a route change. *(REQ-2, REQ-3)*
