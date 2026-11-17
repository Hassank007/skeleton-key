---
inclusion: always
---

# Tech stack and conventions

- **Build:** Vite + React 19 + TypeScript (strict mode).
- **Routing:** React Router.
- **Styling:** plain CSS with CSS custom properties (design tokens). No UI component library: the point is that the primitives are ours and accessible.
- **Testing:** Vitest + Testing Library + `vitest-axe` for component axe tests; Playwright + `@axe-core/playwright` for page-level tests.
- **Dev-time checks:** `@axe-core/react` logs violations in the browser console in development only.
- **Lint:** ESLint with `eslint-plugin-jsx-a11y` (strict config).
- **Node:** 20+. Package manager: npm.

## Conventions
- Components are small, typed, and documented with a one-line comment on what accessibility guarantee they provide.
- No new dependency without a reason written in the spec's design doc.
- Keep the skeleton lean: if a feature only one app needs, it belongs in that app, not the skeleton.
