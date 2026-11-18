# Trusted Tester review: skeleton/src

Method: DHS Section 508 Trusted Tester, run by the `trusted-tester` agent as a one-off dry run. Static review only: the agent read the code but did not run tests or a browser. Contrast ratios are hand calculations. This is not a conformance statement.

## Resolution status

| Finding | Status |
|---|---|
| Serious, 1.4.3: dark `--color-accent-hover` `#a855f7` gives white text 3.96:1 | **Fixed.** Now `#7e22ce` (6.98:1). Test: `tests/unit/tokens-contrast.test.ts`. |
| Moderate, 2.4.2: unknown routes keep a stale title and have no h1 | **Fixed.** Added `NotFoundPage` and a `*` route. Test: `tests/unit/NotFoundPage.test.tsx`. |
| All other findings | Reported only, not changed (see below). |

Fixes were limited to real WCAG failures, as requested. The agent could not confirm several items without a browser or screen reader, so they stay open.

## Findings (agent output)

```
[Serious] 1.4.3 Contrast (Minimum)   -> FIXED
Location: skeleton/src/components/Button.module.css:48-51 (.primary:hover) with skeleton/src/tokens/dark.css (--color-accent-hover: #a855f7)
Issue: In the dark theme, a hovered primary button shows white text on #a855f7, about 3.96:1, below 4.5:1.
Fix: Darken dark-theme --color-accent-hover; add a test over accent and accent-hover.
```

```
[Moderate] 2.4.2 Page Titled / 1.3.1   -> FIXED
Location: skeleton/src/App.tsx:13-16
Issue: Only "/" and "/about" are routed. Other URLs render an empty <main>, no h1, and a stale document.title.
Fix: Add a catch-all NotFoundPage with its own title and h1, plus an axe test.
```

```
[Moderate] 4.1.3 Status Messages   -> OPEN (needs screen reader to confirm)
Location: skeleton/src/components/Dialog.tsx:64-72, skeleton/src/contexts/AnnouncerContext.tsx:52-62
Issue: Dialog sets inert on #root while open. The announcer live regions are inside #root, so announce() calls made while a dialog is open may not be spoken.
Fix: Render the live regions with createPortal into document.body, outside #root. Verify with NVDA or VoiceOver.
```

```
[Moderate] 2.2.1 Timing Adjustable / 2.4.3 Focus Order   -> OPEN
Location: skeleton/src/components/Toast.tsx:54-57, 84-87
Issue: startTimer() never clears an existing timer and ignores hover/focus state. After mouseenter, focus and mouseleave, the timer restarts while focus is on Dismiss, so the toast can vanish under a keyboard user. The toast is after <main> in DOM order, so it is hard to reach within 5 s.
Fix: Track hovered and focused flags; clear the timer first; consider a longer default or persistent toasts for needed information.
```

```
[Moderate] 1.4.3 test evidence gap   -> PARTLY ADDRESSED (token-level test added; browser dark-mode axe still open)
Location: skeleton/tests/e2e/home.spec.ts, about.spec.ts
Issue: Playwright axe runs only in light scheme and never with the dialog open.
Fix: Add dark-scheme and dialog-open axe runs.
```

```
[Minor] 4.1.2  MotionToggle shows aria-pressed="true" under OS reduced motion but does nothing when activated.  -> OPEN
        Fix: disabled={osReducedMotion} plus a hint.
[Minor] 2.4.11 scroll-margin-top only applies to `main *:focus-visible` (index.css:37-40).  -> OPEN
[Minor] 2.4.7  .main has outline: none (PageShell.module.css:44-45); skip-link target shows no focus position.  -> OPEN
[Minor] 1.3.1  Site name "Skeleton Key" is aria-hidden (PageShell.tsx:40-42); only the emoji should be hidden.  -> OPEN
[Minor] 1.3.1  Nav links expose no aria-current="page" (AppLink.tsx, PageShell.tsx).  -> OPEN
[Minor] 3.2.2  Button has no default type="button" (Button.tsx:34-35).  -> OPEN
[Minor] 3.3.2 / 4.1.2  Field does not forward required, and cloneElement overwrites the child's aria-describedby (Field.tsx:60-73).  -> OPEN
[Minor] 1.1.1  Decorative SVG has both aria-hidden and role="img" (HomePage.tsx:15).  -> OPEN
[Minor] 1.3.3  "Use the navigation above" relies on position (HomePage.tsx:44).  -> OPEN
[Minor] Test coverage: no unit axe tests for AboutPage, SkipLink, MotionToggle, AnnouncerProvider; route-focus hook covered only by e2e.  -> OPEN
```

### Notes (not findings)

- Some token comments overstate ratios (light `--color-link` commented about 9.25:1, calculated about 7.6:1). Still passes.
- `--header-height` from contentBoxSize excludes the 1px border.
- MotionContext calls matchMedia on every render, so the effect re-subscribes each render.
- Toast ids use a counter that resets each render plus Date.now(), so ids can collide in the same millisecond.
- No `@media (prefers-reduced-motion: reduce)` CSS fallback for first paint or JS failure.

## Test results

| Test | Result |
|---|---|
| 1. Keyboard access, no traps | Pass (static) |
| 2. Focus order, visibility, not obscured | Fail (minor) |
| 3. Non-interference | Pass (static) |
| 4. Colour and contrast | Fail (fixed after review) |
| 5. Page title and language | Fail (fixed after review) |
| 6. Headings, landmarks, bypass | Pass (static), plus minor finding |
| 7. Forms | Fail (minor) |
| 8. Link and button names | Pass (static) |
| 9. Images and alternatives | Pass (static) |
| 10. Dynamic content, status messages | Fail (moderate, open) |
| 11. Timing | Fail (open) |
| 12. Flashing and motion | Not tested |
| 13. Reflow, resize, spacing, target size | Not tested |
| 14. Sensory characteristics | Fail (minor) |

## Manual steps still needed

- Keyboard walk of `/` and `/about`; confirm focus lands on the h1 after a mouse click on a nav link.
- Dark theme: hover a primary button and run axe in dark mode.
- 400% zoom and 320px width; text-spacing bookmarklet.
- NVDA or VoiceOver: route-change announcement, announce() while a dialog is open, Toast announcement.
- Ghost animation stops with the OS setting and the in-app toggle.
