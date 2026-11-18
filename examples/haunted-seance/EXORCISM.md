# EXORCISM report: haunted-seance

## Summary

The app had no axe violations on its first screen, but that screen is only one of five states. A source review found problems the tools cannot reach: no skip link, one static page title, focus lost after every step change, no error summary, a hand-rolled dialog with no focus trap, no Escape handling and no focus return, ungated decorative animation with no pause control, and several text and border colours below contrast. All were fixed in `src/App.jsx` and `src/styles.css`, without new dependencies and without changing text, features or the visual design beyond slightly darker purples and lighter borders. `npm run build` succeeds.

## Findings and fixes

| # | Criterion | Severity | What was wrong | What changed | File |
|---|-----------|----------|----------------|--------------|------|
| 1 | 2.4.1 Bypass Blocks | Serious | No skip link. | Added "Skip to main content" as the first focusable element, visible on focus. `main` got `id="main"` and `tabIndex=-1`. | App.jsx, styles.css |
| 2 | 2.4.2 Page Titled | Serious | Title stayed "Seance Booking" for every step and the success view. | `document.title` is now "Step N of 3: <name> - Séance Booking" and "Séance booked - Séance Booking". | App.jsx |
| 3 | 2.4.3 Focus Order, 3.2.2 | Critical | After Continue, Back, Seal the Pact or Book Another, the clicked button was removed or left behind and focus fell to the page start. | Each step has a visually hidden `h2` ("Step N of 3: ...") that receives focus after a step change. The success `h2` receives focus after booking. | App.jsx |
| 4 | 3.3.1, 3.3.3 | Serious | Errors were only inline `role="alert"` paragraphs. No summary, no focus move, and each message fired as a separate alert. | Added an error summary above the step with links to each field. Focus moves to it on a failed submit. Removed the per-field `role="alert"`. | App.jsx, styles.css |
| 5 | 1.3.1, 4.1.2, 3.3.1 | Moderate | The date input and both radio groups had no `aria-describedby` link to their errors. `aria-invalid` was written as `"false"`. | Linked errors by `aria-describedby` on the date input and on the radio fieldsets. `aria-invalid` is now only set when true. | App.jsx |
| 6 | 3.3.3 | Minor | The past-date message did not say how to fix it. | Appended "Pick today or a later date." | App.jsx |
| 7 | 2.1.2, 2.4.3 | Critical | The dialog was a `div` with `aria-modal`. Tab left it, Escape did nothing, and focus was not returned. The page behind it stayed reachable. | Replaced with a native `<dialog>` opened with `showModal()`. This gives a focus trap, Escape to close and an inert background. Focus goes to "Seal the Pact" on open and returns to the Review & Book button when the dialog is dismissed. Backdrop click still closes it. | App.jsx, styles.css |
| 8 | 4.1.3 Status Messages | Serious | `role="status"` was on a container that was inserted with its content, which is unreliable. | Added a persistent polite live region that announces "Your séance is booked." The success heading also takes focus. | App.jsx |
| 9 | 2.2.2, 2.3.3 | Serious | The OS reduced-motion media query existed, but there was no in-app way to pause the infinite animations (flicker, fog, ghosts, floating icons). | Added a "Pause animations" toggle button (`aria-pressed`) that sets `html[data-motion=paused]` and disables all animation and transition. It starts pressed when the OS asks for reduced motion. | App.jsx, styles.css |
| 10 | 1.4.3 | Serious | White text on the button gradient end `#8b5cf6` was 4.23:1. Light text on the selected time chip (`#8b5cf6`) was 3.30:1. The "done" step number was white on `#8b5cf6`. | Gradient end is `#7c3aed` (5.69:1 with white). Selected chip and done dot use `#6d28d9` (5.54:1 with `#e7e0f5`). | styles.css |
| 11 | 1.4.11 | Serious | Input and radio-card borders `#3a2d57` were 1.54:1 against their background. | Changed to `#7a6aa3` (4.04:1). | styles.css |
| 12 | 1.4.1 | Moderate | A selected spirit or time was shown only by colour and glow. The native radio is visually hidden. | Added a "✓" prefix (CSS generated) to the selected card or chip. | styles.css |
| 13 | 2.4.7 | Minor | Text inputs removed the outline and used only a translucent box-shadow, which disappears in forced-colours mode. | Added a 2px outline in `--green`. | styles.css |
| 14 | 1.1.1, 1.3.1 | Minor | Emoji icons (spirit, orb, dialog) were read aloud. The progress dots and the "done" state were not conveyed in text. | Emoji marked `aria-hidden`. Dots marked `aria-hidden`. Completed steps get a hidden " (completed)". | App.jsx |
| 15 | 1.3.1, 2.4.6 | Minor | Steps had no headings, and the card was not a named region. | Hidden `h2` per step (see #3). Card is `section` with `aria-label="Séance booking"`. | App.jsx |

## Tool results, before vs after

All three tools were run against `http://localhost:4181/`. They load the page without clicking, so they only ever see step 1.

| Check | Before | After |
|-------|--------|-------|
| audit_page (AA): violations | 0 | 0 |
| audit_page: incomplete | 1 rule (`color-contrast`, 17 nodes) | 1 rule (`color-contrast`, 18 nodes; the extra node is the new toggle button) |
| keyboard_walk: Tab stops | 2 (first radio, Continue) | 4 (skip link, Pause animations, first radio, Continue) |
| keyboard_walk: traps | none | none |
| keyboard_walk: missing focus indicators | 0 | 0 |
| keyboard_walk: missing accessible names | 0 | 0 |
| page_outline: title | "Seance Booking" | "Step 1 of 3: Spirit - Séance Booking" |
| page_outline: landmarks | `main` | `main`, named region |
| page_outline: headings | h1 only | h1, h2 |
| page_outline: issues | none | none |

The zero-violation baseline means the main defects above were found by source review, not by axe. The axe `incomplete` items are contrast checks that axe could not resolve (text over gradients and translucent backgrounds). I checked the key pairs by hand with `check_contrast` (values in the table above), but I did not check every node.

## What I could NOT verify

- Steps 2 and 3, the error state, the confirm dialog and the success view. The MCP tools do not click or type, so none of these were audited in a browser. The fixes there come from code review and `npm run build`, not from a live run. They need a manual keyboard pass or a Playwright test.
- Native `<dialog>` behaviour (Tab trap, Escape, focus return) is implemented from the standard and not exercised in a browser here.
- Real screen readers (NVDA, JAWS, VoiceOver). Announcement of the live region, the focused hidden headings and the error summary is untested.
- The native date picker pop-up, which is outside the page DOM.
- Reflow at 320px / 400% zoom (1.4.10), text-spacing overrides (1.4.12) and target size (2.5.8) were reviewed in CSS only. Buttons and radio cards are well above 24px, but this was not measured in a browser.
- Contrast of text over translucent or gradient backgrounds and the glowing title was checked only for the colour pairs listed.
- Unchanged and out of scope: the web font is loaded from Google Fonts, the date minimum uses UTC (`toISOString`), and Enter inside a text field does not submit because there is no `<form>`. Changing the last one would alter behaviour.
- When the OS prefers reduced motion, the CSS media query still wins, so the toggle cannot turn animation back on in that case.
