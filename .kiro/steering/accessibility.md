---
inclusion: always
---

# Accessibility rules (WCAG 2.2 AA) — non-negotiable

Every piece of UI you generate must follow these. If a request conflicts with them, follow these and say why.

## Structure
- Use semantic HTML first. A native element beats ARIA every time (`<button>`, `<a href>`, `<label>`, `<dialog>`, `<nav>`, `<main>`).
- Never put click handlers on `div` or `span`. Interactive = `button` or `a`.
- One `h1` per page. Headings go in order; don't skip levels for styling.
- Every page has a unique, descriptive `<title>` (2.4.2).
- Landmarks: `header`, `nav` (labelled if more than one), `main` (exactly one), `footer`.
- A "Skip to main content" link is the first focusable element (2.4.1).

## Keyboard and focus
- Everything works with keyboard only: Tab, Shift+Tab, Enter, Space, Escape, arrow keys where the APG pattern says so.
- Never remove focus outlines. Use a visible `:focus-visible` style with at least 3:1 contrast (2.4.7).
- Focused elements must not be hidden behind sticky headers: set `scroll-margin-top` (2.4.11).
- On route change, move focus to the new page's `h1` (with `tabindex="-1"`) and announce the page title.
- Dialogs follow the APG modal pattern: focus moves in, Tab is trapped inside, Escape closes, focus returns to the trigger.
- No keyboard traps anywhere else (2.1.2).

## Forms
- Every input has a visible `<label>` tied with `for`/`id`. Placeholders are never the only label (3.3.2).
- Hints and errors are linked with `aria-describedby`. Invalid fields get `aria-invalid="true"`.
- Errors are text, never colour alone (1.4.1, 3.3.1), and say how to fix it (3.3.3).
- On submit with errors: show an error summary at the top, move focus to it, and link each error to its field.
- Use the right `autocomplete` tokens for personal data (1.3.5).
- Don't ask for the same information twice in one flow (3.3.7).

## Dynamic content
- Status messages ("Added", "Saved", "3 results") go through the shared live-region announcer (4.1.3). Polite by default; assertive only for errors that block the user.
- Loading states are announced, not just shown as spinners.

## Visual
- Text contrast at least 4.5:1, large text at least 3:1, UI components and focus rings at least 3:1 (1.4.3, 1.4.11). Use the design tokens; don't invent colours.
- Works at 400% zoom / 320px width with no horizontal scroll (1.4.10).
- Survives the WCAG text-spacing overrides (1.4.12).
- Touch/click targets at least 24×24 CSS px (2.5.8).
- Respect `prefers-reduced-motion`: no parallax, auto-animation or flashing when it's set, and always offer the in-app motion toggle (2.3.3, 2.2.2).

## Images and media
- Meaningful images get real `alt` text. Decorative images get `alt=""` (1.1.1).
- Spooky decorative art (ghosts, fog, bats) is `aria-hidden="true"` and never carries meaning.

## Testing
- Every component and page has an axe test that must pass with zero violations.
- Don't claim something is accessible without a test or a manual keyboard check backing it.
