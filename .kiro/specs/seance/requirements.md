# Seance: Requirements

This spec describes `apps/seance`, a three-step form for booking a séance with a spirit. It is created with `npm run new-app seance` (see `.kiro/specs/new-app-script/`) and then customised. Requirements use EARS notation (WHEN, WHILE, IF/THEN, WHERE, or no trigger for always-true rules). Every requirement that affects accessibility names the WCAG 2.2 success criterion (SC) it protects.

**Scope.** Everything inside `apps/seance/`: pages, components, local data, form logic, colour theme and tests. Out of scope: a back end, payment, user accounts, e-mail or SMS sending, saving a draft between visits, a custom date picker, and changes to `skeleton/` unless REQ-19 applies. Grimoire is a separate spec (`.kiro/specs/grimoire/`).

**Terms.**
- *Skeleton*: the `skeleton/` folder. *Announcer*: the shared live-region announcer (`useAnnounce`, `AnnouncerContext`) that the skeleton provides.
- *Spirit*: one of the four bookable spirits in the local data. *Booking*: the set of answers the user gives: spirit, date, time, name, e-mail, phone.
- *Step*: one of the three pages of the flow: 1 Spirit, 2 Date and time, 3 Your details.
- *Field error*: the text message shown next to one invalid field. *Error summary*: the block at the top of the form that lists every field error as a link.
- *Touched*: a field the user has left (blur) at least once, or that was part of a failed submit.
- *Cool band*: hues 160° to 280° on the HSL colour wheel. *Warm band*: hues 0° to 45°. Grimoire uses the warm band.
- *Booking window*: from tomorrow to 90 days after today, in the user's local time. *Visiting hours*: 6:00 PM to 11:30 PM, in 30-minute steps.

---

## REQ-1 Creation from the skeleton

**User story:** As a maintainer, I want Seance generated from the skeleton, so that it inherits the accessible shell and its tests.

### Acceptance criteria

- 1.1 The system SHALL create `apps/seance` by running `npm run new-app seance` from the repository root. The files SHALL NOT be copied by hand.
- 1.2 The app SHALL be a standalone Vite project with its own `package.json` named `seance`, so it can be deployed on its own.
- 1.3 The app SHALL keep every skeleton test (`tests/unit/`, `tests/unit/properties/`, `tests/e2e/`) and the skeleton primitives (`Button`, `AppLink`, `Field`, `Dialog`, `Toast`, `Tabs`) unchanged in behaviour. Skeleton tests that name "Skeleton Key" MAY be edited only to name Seance.
- 1.4 The app SHALL serve its dev server and Playwright web server on port 5175 with `--strictPort`, so a Playwright run cannot silently test Grimoire (5174) or the skeleton (5173) when one of them is already running.
- 1.5 The system SHALL NOT add a runtime or development dependency to Seance. The design document records this (tech rule). Dates, times, e-mail and phone use native inputs and plain functions.

---

## REQ-2 Page shell, routes and titles

**User story:** As a keyboard or screen-reader user, I want every page to have the same predictable structure and to know where I am, so that I can find my way (WCAG 1.3.1, 2.4.x, 3.2.3).

### Acceptance criteria

- 2.1 The app SHALL have these routes: `/` (introduction), `/book/spirit` (step 1), `/book/time` (step 2), `/book/details` (step 3), `/about`, and a fallback `*` (page not found).
- 2.2 Every page SHALL be rendered inside the skeleton `PageShell`: skip link as the first focusable element, one `header`, one labelled `nav`, exactly one `main`, one `footer` *(SC 1.3.1, 2.4.1)*.
- 2.3 Every page SHALL have exactly one `h1`, and headings SHALL NOT skip levels *(SC 1.3.1, 2.4.6)*.
- 2.4 WHEN a page is shown, THEN the system SHALL set a unique `document.title` of the form `<Page> — Seance`. Step pages SHALL start with the progress text: `Step 1 of 3: Choose a spirit — Seance`, `Step 2 of 3: Pick a date and time — Seance`, `Step 3 of 3: Your details — Seance`. The success state SHALL use `Séance booked — Seance`. The fallback SHALL use `Page not found — Seance` *(SC 2.4.2)*.
- 2.5 WHEN the pathname changes, THEN the system SHALL move focus to the new page `h1` (which has `tabindex="-1"`) and announce the page title through the announcer, using the skeleton's `useFocusOnRouteChange` *(SC 2.4.3, 4.1.3)*.
- 2.6 The shell text SHALL say "Seance", not "Skeleton Key", in the header site name, the footer, `index.html` and the page titles. The header navigation SHALL contain the links "Book a séance" (`/book/spirit`) and "About" (`/about`) in that order on every page *(SC 3.2.3)*.
- 2.7 The `lang` attribute of `index.html` SHALL stay `en` *(SC 3.1.1)*.
- 2.8 The introduction page (`/`) SHALL explain in plain text what the flow asks for (three steps, about two minutes) and that the app is a demo that stores and sends nothing, and SHALL offer one link "Start booking" to step 1.

---

## REQ-3 Booking state and step order

**User story:** As a user, I want my answers kept while I move between steps, so that I never have to type something twice (WCAG 3.3.7).

### Acceptance criteria

- 3.1 The system SHALL keep the booking in one in-memory store (a React context with a reducer) that wraps the routes. The store SHALL hold the draft value of every field, the set of touched fields, and the status of the flow (`editing`, `submitting`, `failed`, `booked`).
- 3.2 The system SHALL NOT write the booking to `localStorage`, `sessionStorage`, cookies or the URL, because it holds personal data. A page reload SHALL start a new booking.
- 3.3 IF the user opens `/book/time` before step 1 is valid, or `/book/details` before steps 1 and 2 are valid, THEN the system SHALL redirect with `replace` to the first step that is not valid. The redirect target page SHALL follow REQ-2.5 *(SC 3.3.1)*.
- 3.4 WHEN the user goes to the previous step, THEN the system SHALL keep every value already entered and SHALL show it in the control.
- 3.5 WHEN the booking has succeeded and the user chooses "Book another séance", THEN the system SHALL clear every field and the touched set, and SHALL navigate to step 1.

---

## REQ-4 Step 1: choose a spirit

**User story:** As a user, I want to choose one spirit from a short list, so that I know who I am booking.

### Acceptance criteria

- 4.1 The system SHALL provide four spirits in `src/data/spirits.json` (`id`, `name`, `blurb`, `speciality`). Content SHALL be original and fictional. Each spirit SHALL be described in text; no information SHALL be carried by an image *(SC 1.1.1)*.
- 4.2 Step 1 SHALL render the spirits as native `<input type="radio">` elements with the same `name`, inside one `<fieldset>` whose `<legend>` reads "Which spirit would you like to meet?" *(SC 1.3.1, 3.3.2, 4.1.2)*.
- 4.3 Each radio SHALL have a visible `<label>` tied with `for`/`id`, and its blurb SHALL be linked with `aria-describedby` *(SC 3.3.2)*.
- 4.4 No radio SHALL be selected when the page first loads, so that the user makes a deliberate choice. WHEN a booking already holds a spirit, THEN that radio SHALL be selected.
- 4.5 The group SHALL work with the keyboard as the native radio group does: Tab enters the group, the arrow keys move and select, Tab leaves *(SC 2.1.1)*. The system SHALL NOT replace the native keyboard behaviour with script.
- 4.6 The selected state SHALL be shown by a drawn mark and a thicker border, not by colour alone *(SC 1.4.1, 1.4.11)*.
- 4.7 Each radio row SHALL be at least 24 × 24 CSS px, and the whole label area SHALL be the click target *(SC 2.5.8)*.

---

## REQ-5 Step 2: date and time

**User story:** As a user, I want to pick a date and a time with controls my device already knows how to use, so that I can do it with a keyboard, a screen reader or a touch screen (WCAG 1.3.5, 2.1.1, 3.3.2).

### Acceptance criteria

- 5.1 Step 2 SHALL use a native `<input type="date">` with `min` set to tomorrow and `max` set to 90 days from today, and a native `<input type="time">` with `min="18:00"`, `max="23:30"` and `step="1800"`. The system SHALL NOT render a custom calendar, a scripted date picker or a pop-up built from `div` elements.
- 5.2 Each input SHALL have a visible `<label>` ("Date", "Time") built with the skeleton `Field`, and a hint linked with `aria-describedby`: the date hint SHALL name the booking window in words; the time hint SHALL read "Visiting hours are 6:00 PM to 11:30 PM, every 30 minutes." *(SC 3.3.2)*.
- 5.3 Both fields SHALL be required, with the "(required)" text from `Field` and the native `required` attribute.
- 5.4 The date SHALL be valid only when it is a real calendar date inside the booking window. The time SHALL be valid only when it is inside the visiting hours and on the hour or half hour.
- 5.5 The date and time inputs SHALL NOT carry an `autocomplete` token, because the answer is not personal data about the user (SC 1.3.5 does not apply). The design records this decision.
- 5.6 WHERE the browser shows the native picker button, THE system SHALL leave it in place and SHALL NOT hide or restyle it so that it loses its visible focus ring *(SC 2.4.7)*.
- 5.7 The system SHALL read "today" from one function (`today(): Date`) that tests can replace, so the window is the same in every test.

---

## REQ-6 Step 3: your details

**User story:** As a user, I want my browser to fill in my name, e-mail and phone number, so that I type as little as possible (WCAG 1.3.5, 3.3.7, 3.3.8).

### Acceptance criteria

- 6.1 Step 3 SHALL contain exactly three inputs, each built with the skeleton `Field`, with a visible label, "(required)" text and the native `required` attribute: "Full name" (`type="text"`), "Email address" (`type="email"`), "Phone number" (`type="tel"`).
- 6.2 The inputs SHALL carry these `autocomplete` tokens *(SC 1.3.5)*: name `name`, e-mail `email`, phone `tel`. The name field SHALL NOT be split into given and family name, so one token covers it.
- 6.3 The e-mail input SHALL have `spellCheck={false}` and `autoCapitalize="none"`. The phone input SHALL have `inputMode="tel"`. The name input SHALL have `autoCapitalize="words"`.
- 6.4 Each field SHALL have a hint linked with `aria-describedby`: the phone hint SHALL say which characters are allowed ("Digits, spaces, plus, hyphens and brackets. For example +44 20 7946 0000.").
- 6.5 The system SHALL NOT ask for a password, a CAPTCHA, a "confirm e-mail" field or any other cognitive test *(SC 3.3.8)*. Pasting into every field SHALL work (no `onPaste` blocking).
- 6.6 The primary button on step 3 SHALL read "Review and book" and SHALL open the confirmation dialog (REQ-11) only when the step is valid.

---

## REQ-7 Per-field validation

**User story:** As a user, I want to be told right away, in words, what is wrong with a field and how to fix it (WCAG 3.3.1, 3.3.3).

### Acceptance criteria

- 7.1 The system SHALL validate with plain functions in `src/lib/validate.ts`, one per field. Each returns `null` (valid) or a message string. No validation SHALL depend on colour, a placeholder or the browser's built-in bubble. Every `<form>` SHALL have `noValidate`, so the app's own messages are the only ones *(SC 3.3.1)*.
- 7.2 WHEN the user leaves a field (blur), THEN the system SHALL mark it touched and validate it. WHILE a touched field has an error, THEN the system SHALL re-validate it on every change, so the error disappears as soon as the value is valid.
- 7.3 The system SHALL NOT show an error on a field the user has not touched and has not submitted, so Tab-through does not create errors on fields the user has yet to reach.
- 7.4 WHEN a field has an error, THEN the system SHALL render the error as visible text prefixed with "Error:" (and an `aria-hidden` icon), set `aria-invalid="true"` on the control, and link the text through `aria-describedby` (after the hint), using the skeleton `Field`. The radio group SHALL do the same on the `fieldset` (`role="radiogroup"`) *(SC 1.3.1, 1.4.1, 3.3.1, 4.1.2)*.
- 7.5 Every message SHALL say what is wrong and how to fix it *(SC 3.3.3)*, in this wording:
  - Spirit empty: "Choose a spirit to continue."
  - Date empty: "Enter a date." Not a real date: "Enter a real date, for example 11/13/2030." Before tomorrow: "Choose a date from tomorrow onwards." After the window: "Choose a date on or before {last date}."
  - Time empty: "Enter a time." Outside hours: "Choose a time between 6:00 PM and 11:30 PM." Not on a half hour: "Choose a time on the hour or half hour, for example 8:30 PM."
  - Name empty: "Enter your full name." Shorter than 2 or longer than 80 characters after trimming: "Enter a name of 2 to 80 characters."
  - E-mail empty: "Enter your email address." Wrong shape: "Enter an email address in the form name@example.com."
  - Phone empty: "Enter your phone number." Invalid characters: "Use only digits, spaces, plus, hyphens, dots and brackets." Fewer than 7 or more than 15 digits: "Enter a phone number with 7 to 15 digits."
- 7.6 Messages SHALL NOT contain HTML, and SHALL be rendered as text so a user value echoed in a message cannot inject markup. No message SHALL echo the user's own input.
- 7.7 Validation SHALL be deterministic and free of side effects: the same input and the same `today` give the same result.

---

## REQ-8 Error summary

**User story:** As a keyboard or screen-reader user, I want one place that lists everything I must fix, with a link to each problem (WCAG 3.3.1, 2.4.3).

### Acceptance criteria

- 8.1 WHEN the user activates "Next" or "Review and book" and at least one field of the current step is invalid, THEN the system SHALL NOT leave the step, SHALL mark every field of the step touched, SHALL show every field error, and SHALL show an error summary above the form.
- 8.2 The error summary SHALL be a `div` with `tabindex="-1"` and `aria-labelledby` pointing to its heading, "There is a problem" (an `h2`), followed by a `ul` with one link per field error. Each link SHALL read the same text as the field error, without the "Error:" prefix, and SHALL have an `href` of `#<field id>` *(SC 1.3.1, 3.3.1)*.
- 8.3 WHEN the summary appears, THEN the system SHALL move focus to it. WHEN a submit fails again with the same errors, THEN focus SHALL move to the summary again *(SC 2.4.3)*.
- 8.4 WHEN the user activates a summary link, THEN the system SHALL move focus to the field it names (the first radio for the spirit group) and SHALL scroll it into view below the sticky header. The link SHALL NOT change the URL or the history *(SC 2.4.3, 2.4.11)*.
- 8.5 WHEN a summary appears, THEN the system SHALL also send one assertive announcement through the announcer: "{n} problem(s) found. Fix them to continue." (singular for one) *(SC 4.1.3)*.
- 8.6 WHEN every error is fixed, THEN the summary SHALL be removed on the next successful submit or when the last error clears. IF the summary is removed while focus is inside it, THEN the system SHALL move focus to the first field of the step, so focus is never lost to `body`.
- 8.7 The summary SHALL use `--color-error` text on the surface, a border and the prefix word in text, so it does not rely on colour *(SC 1.4.1)*, and SHALL have `scroll-margin-top` for the sticky header.

---

## REQ-9 Step progress

**User story:** As a user, I want to know which step I am on and how many remain, in text, so that I can plan (WCAG 1.3.1, 1.4.1, 2.4.8, 4.1.3).

### Acceptance criteria

- 9.1 Every step page SHALL show the text "Step N of 3" (N = 1, 2 or 3) in a paragraph directly above the `h1`, and the `h1` SHALL name the step ("Choose a spirit", "Pick a date and time", "Your details").
- 9.2 Every step page SHALL show an ordered list of the three step names. Each item SHALL say its state in text: "completed", "current" or "not started". The current item SHALL have `aria-current="step"`. State SHALL NOT be shown by colour or shape alone *(SC 1.4.1)*.
- 9.3 WHEN the user moves to another step, THEN the system SHALL announce the new page title (which begins "Step N of 3") through the announcer and move focus to the `h1` (REQ-2.5) *(SC 4.1.3)*.
- 9.4 The progress list SHALL NOT be a landmark and SHALL NOT be a live region. The visible text and the page title are the only carriers of the step number.
- 9.5 A completed step's item SHALL NOT be a link. Going back uses the "Back" button (REQ-3.4). This keeps one way to move and avoids a link that can skip validation.

---

## REQ-10 No repeated questions

**User story:** As a user, I do not want to answer the same question twice (WCAG 3.3.7 Redundant Entry).

### Acceptance criteria

- 10.1 Each piece of information SHALL be asked for in exactly one place. The flow SHALL NOT contain two inputs for the same fact. A unit test SHALL collect every control's accessible name and `autocomplete` token across the three steps and fail on a duplicate.
- 10.2 WHEN information was entered in an earlier step, THEN a later step SHALL NOT ask for it again. The confirmation dialog SHALL show earlier answers as read-only text.
- 10.3 WHEN the user returns to a step, THEN the earlier entry SHALL be shown (REQ-3.4). WHEN the user fixes an error and submits, THEN the other valid entries SHALL stay.
- 10.4 The confirmation dialog SHALL NOT contain an input.

---

## REQ-11 Confirmation dialog

**User story:** As a user, I want to check my booking and confirm it before it is made, so that I do not book by accident (WCAG 3.3.4).

### Acceptance criteria

- 11.1 WHEN the user activates "Review and book" on a valid step 3, THEN the system SHALL open the skeleton `Dialog` titled "Confirm your séance", with the description "Check your booking. Nothing is booked until you confirm."
- 11.2 The dialog body SHALL list the booking as a description list (`dl`): Spirit, Date (long form, for example "Wednesday, November 13, 2030"), Time (for example "8:30 PM"), Name, Email, Phone. Values SHALL be text *(SC 1.3.1)*.
- 11.3 The dialog SHALL have two buttons: "Book my séance" (primary) and "Go back and edit" (secondary).
- 11.4 The dialog SHALL follow the APG modal pattern as the skeleton `Dialog` already does: focus moves in, Tab and Shift+Tab are trapped, Escape closes, the background is inert, and focus returns to the "Review and book" button on close *(SC 2.1.2, 2.4.3)*. The app SHALL NOT re-implement it.
- 11.5 WHEN the user activates "Go back and edit", presses Escape, or activates the close button, THEN the dialog SHALL close, the booking SHALL be unchanged, and focus SHALL be on "Review and book".
- 11.6 The dialog SHALL close before the submission starts (REQ-12.1), because the skeleton `Dialog` makes `#root` inert and the shared live regions are inside `#root`; a message sent while the dialog is open would not be announced.

---

## REQ-12 Submission, status and success

**User story:** As a user, I want to be told that my booking went through, in a way my assistive technology reports (WCAG 4.1.3, 3.3.4).

### Acceptance criteria

- 12.1 WHEN the user activates "Book my séance", THEN the system SHALL close the dialog, set the status to `submitting`, and call the booking service (`src/lib/bookingService.ts`, a local function that resolves after a short delay and sends nothing).
- 12.2 WHILE the status is `submitting`, THEN the system SHALL announce "Booking your séance…" once through the announcer (polite), SHALL set `aria-busy="true"` on the form, and SHALL set `aria-disabled="true"` on "Review and book" while ignoring its activation. The button SHALL NOT use the `disabled` attribute, so focus is not lost *(SC 2.4.3, 4.1.3)*.
- 12.3 WHEN the service resolves, THEN the system SHALL show the success view on the same route: the `h1` "Your séance is booked", a paragraph "{Spirit} will meet you on {long date} at {time}." and the sentence "This is a demo. Nothing was stored or sent." with a "Book another séance" button. The system SHALL set `document.title` to `Séance booked — Seance`, move focus to the `h1`, and announce "Séance booked with {Spirit} on {long date} at {time}." politely through the announcer *(SC 2.4.2, 2.4.3, 4.1.3)*.
- 12.4 The success announcement SHALL NOT come from a route change, so the skeleton's title announcement cannot overwrite it. The success view SHALL NOT render a separate live region.
- 12.5 IF the service rejects, THEN the system SHALL set the status to `failed`, keep every answer, show the error summary with one item "We could not book your séance. Your answers are kept. Press Review and book to try again." (a non-link item), move focus to the summary, and announce the same text assertively *(SC 3.3.1, 4.1.3)*.
- 12.6 WHEN the user starts a new submission after a failure, THEN the failure summary SHALL be removed.
- 12.7 The booking service SHALL be passed through a context, so tests can replace it with an instant success or a failure.

---

## REQ-13 Colour theme

**User story:** As a user and as a judge, I want Seance to look clearly different from Grimoire, with no loss of contrast, so that the skeleton is seen to be flexible.

### Acceptance criteria

- 13.1 The system SHALL give Seance its own palette, **Spectral Slate**, by changing values in `src/tokens/tokens.css` and `src/tokens/dark.css`. The system SHALL NOT add, remove or rename a `--color-*` token, so the skeleton's contrast matrix keeps covering it.
- 13.2 In the light theme and in both dark sources (the `prefers-color-scheme` block and `[data-theme='dark']`), every pair in the skeleton token matrix SHALL meet its minimum: text 4.5:1 *(SC 1.4.3)*, UI components and the focus ring 3:1 *(SC 1.4.11)*. The two dark sources SHALL be identical.
- 13.3 The hue of `--color-surface`, `--color-surface-raised`, `--color-accent`, `--color-link` and `--color-border` SHALL be inside the cool band (160° to 280°) in the light theme and in the dark theme. The feedback colours (`--color-error`, `--color-success`, `--color-warning`) are semantic and are not bound to a band, but SHALL NOT equal any Grimoire value.
- 13.4 The system SHALL NOT reuse the skeleton's purple values or any Grimoire value for surface, accent, link, border or focus ring. A test SHALL compare against a fixed list of Grimoire values and fail with the token name.
- 13.5 The existing contrast tests (`contrast.property.test.ts`, `tokens-contrast.test.ts`) SHALL pass unchanged against Seance's own CSS. The system SHALL NOT weaken them.
- 13.6 Component CSS SHALL use tokens only. A test SHALL fail on a hex, `rgb(`, `hsl(` or named colour in any `src/**/*.css` outside `src/tokens/`.
- 13.7 Seance SHALL differ from Grimoire in more than colour: a sans-serif heading font token, larger corner radii (`--radius-md` 0.75 rem), a single narrow centred column (the "ticket"), and numbered step markers. These changes SHALL use existing tokens or plain CSS and SHALL NOT break REQ-14.
- 13.8 Decorative art (moon, mist) SHALL be `aria-hidden="true"` inline SVG or CSS, SHALL carry no meaning, and SHALL NOT sit behind text in a way that lowers its contrast *(SC 1.1.1, 1.4.3)*.

---

## REQ-14 Responsive, text and motion

**User story:** As a user with low vision, a motion sensitivity or a small screen, I want the form to stay usable.

### Acceptance criteria

- 14.1 At a viewport of 320 CSS px width, every step SHALL have no horizontal scroll, and no content or control SHALL be clipped *(SC 1.4.10)*.
- 14.2 WHEN the WCAG text-spacing overrides are applied (line height 1.5, paragraph spacing 2× font size, letter spacing 0.12 em, word spacing 0.16 em), THEN no text, label, hint, error or button SHALL be clipped or overlap *(SC 1.4.12)*. Labels, hints, errors and buttons SHALL NOT have a fixed height.
- 14.3 Every control, link and button SHALL be at least 24 × 24 CSS px *(SC 2.5.8)*. Form inputs SHALL be at least 2.75 rem high.
- 14.4 Every focusable element SHALL show the global `:focus-visible` ring (at least 3:1, at least 2 px) and SHALL have `scroll-margin-top` at least the header height *(SC 2.4.7, 2.4.11, 1.4.11)*.
- 14.5 WHEN `prefers-reduced-motion: reduce` is set or the in-app motion toggle is on, THEN the drifting mist and any step transition SHALL not animate *(SC 2.3.3, 2.2.2)*. The animation SHALL be off by the skeleton's existing rule and nothing SHALL flash more than three times a second *(SC 2.3.1)*.
- 14.6 Instructions SHALL NOT rely on shape, position or sound alone *(SC 1.3.3)*.

---

## REQ-15 Axe tests for every step and state

**User story:** As a maintainer, I want zero axe violations on every page and state, proven by tests.

### Acceptance criteria

- 15.1 Every page and state SHALL have a Vitest + `vitest-axe` test with zero violations: introduction, step 1 (clean, with error and summary), step 2 (clean, with errors and summary), step 3 (clean, with errors and summary), the confirmation dialog open, the submitting state, the failed state, the success view, about, and not found.
- 15.2 Every new component SHALL have its own axe unit test: `StepProgress`, `ErrorSummary`, `SpiritStep` (the radio group), `WhenStep`, `DetailsStep`, `ConfirmDialog`, `SuccessPanel`, `MistArt`.
- 15.3 Every step SHALL have a Playwright + `@axe-core/playwright` test using the skeleton `scanPage` helper with the WCAG 2.2 AA tag set, in the light scheme and again with `colorScheme: 'dark'`. Each SHALL assert that `violations` is empty. The scans SHALL also cover each step with its error summary shown, the open confirmation dialog, and the success view.
- 15.4 Test titles SHALL carry `[SC x.y.z]` tags where one criterion is protected, so the ACR generator can link the evidence.
- 15.5 Axe in jsdom cannot compute colour contrast. Contrast SHALL be covered by the token tests (REQ-13.5) and the real-browser scans (REQ-15.3).

---

## REQ-16 Keyboard-only Playwright tests

**User story:** As a maintainer, I want proof that the whole flow works without a mouse, on the happy path and the error path.

### Acceptance criteria

- 16.1 The system SHALL provide `tests/e2e/booking-happy.keyboard.spec.ts` and `tests/e2e/booking-errors.keyboard.spec.ts`. These specs SHALL drive the page only with `page.keyboard` (`press`, `type`) and SHALL read state with `expect(...)`, `page.evaluate` and the `focusStop` helper. They SHALL NOT call `click`, `fill`, `check`, `selectOption`, `dispatchEvent` or `focus()` on a locator. A unit test (`keyboard-only-guard.test.ts`) SHALL scan these two files for those calls and fail on a hit, and SHALL include a negative control on a sample string *(SC 2.1.1)*.
- 16.2 The specs SHALL fix the browser clock with `page.clock.setFixedTime` (2030-10-30 12:00 local), the locale `en-US` and the time zone `UTC`, so the date and time segments typed by the keyboard and the booking window are the same on every machine.
- 16.3 **Happy path.** The test SHALL: open `/`; press Tab and check the skip link is first; Tab to "Start booking" and press Enter; check focus is on the step 1 `h1`, the title is `Step 1 of 3: Choose a spirit — Seance`, and the polite region holds that title; Tab to the radio group, press ArrowDown to select a spirit, Tab to "Next", press Enter; on step 2 check "Step 2 of 3" text, focus on the `h1`, and the polite message; Tab to the date input and type `11132030`, Tab to the time input and type `0830P`, Tab to "Next", press Enter; on step 3 type name, e-mail and phone into the three inputs and check their `autocomplete` values; Tab to "Review and book", press Enter; check the dialog is open, focus is inside it, Shift+Tab and Tab stay inside it, Escape closes it and focus returns to "Review and book"; press Enter again, Tab to "Book my séance", press Enter; check that the polite region contains "Séance booked with …", that focus is on the success `h1`, that the title is `Séance booked — Seance`, and that the assertive region holds no text.
- 16.4 **Back and no repeated questions.** The happy-path test SHALL also check that "Back" on step 3 shows the chosen date and time still in the inputs, that step 3 has exactly three text-entry controls, and that no label on any step repeats.
- 16.5 **Error path.** The test SHALL: on step 1 press Enter on "Next" with nothing selected; check the error summary has focus and lists "Choose a spirit to continue."; check the group has `aria-invalid="true"` and `aria-describedby` pointing to the error text; press Tab to the summary link and Enter, and check the first radio has focus; select a spirit with the keyboard and continue. On step 2, press "Next" with both fields empty; check two errors in the summary, in DOM order; follow the first link with Enter, check the date input has focus; type a date before the window, leave the field with Tab, and check the field error appears at once (per-field validation) with `aria-describedby` that resolves to the error text; type a valid date and check the error disappears; fix the time; continue. On step 3 type an invalid e-mail and a phone with letters, Tab out, check each field error and its link; submit; check the summary lists exactly the invalid fields; fix each by keyboard; check the summary and field errors are gone; finish the booking to the success view.
- 16.6 **Keyboard trap check.** One test SHALL Tab through the whole of every step, forward and back, and check that focus leaves the page content to the browser UI or returns to the first element, and that focus is never on `body` while the page has focusable content *(SC 2.1.2, 2.4.3)*.
- 16.7 Every Tab stop in the specs SHALL be checked for a visible outline of at least 2 px with `focusStop` *(SC 2.4.7)*.
- 16.8 One test at 320 px width and one with the text-spacing overrides SHALL cover REQ-14.1 and 14.2 on step 3 with errors showing. One test SHALL cover the motion toggle and `prefers-reduced-motion` on the mist art.

---

## REQ-17 Unit and property-based tests

**User story:** As a maintainer, I want the form logic proven over many inputs, not only a few examples.

### Acceptance criteria

- 17.1 Each validator SHALL have unit tests for every message in REQ-7.5 and for the boundary values: the first and last day of the window, 6:00 PM and 11:30 PM, 5:59 PM and 11:31 PM, 2 and 80 name characters, 7 and 15 phone digits.
- 17.2 The system SHALL provide fast-check properties (using the skeleton's `tests/unit/support/pbt.ts` helpers and the existing `fast-check` dev dependency) for these invariants:
  - every day offset from 1 to 90 gives a valid date and every other offset gives an error;
  - every time on a half-hour step from 18:00 to 23:30 is valid and every other `HH:MM` is not;
  - every generated name of 2 to 80 non-blank characters is valid, and every whitespace-only string is not;
  - every address from `fc.emailAddress()` is accepted, and any string without `@` is rejected;
  - any phone built from 7 to 15 digits and allowed separators is valid, and any string containing a letter is rejected;
  - every validator is total (never throws) over any generated string, and returns `null` or a non-empty message that ends with a full stop;
  - for any generated set of invalid fields, the error summary has one link per error, in order, and every `href` matches the id of a rendered control;
  - for any generated booking, the confirmation dialog shows all six values, and the formatted date round-trips to the same calendar day.
- 17.3 The booking reducer SHALL have tests for each action and a property: any sequence of valid `setField` and `touch` actions never changes the value of an untouched field to a value that was not set.
- 17.4 A unit test SHALL cover the step guard (REQ-3.3) for every route and every partial booking.
- 17.5 A unit test SHALL cover REQ-12 with an injected service: loading text announced once, success announced politely, failure announced assertively, answers kept after failure.
- 17.6 The accessibility properties SHALL be stated as properties in test titles (for example "for any invalid field, aria-describedby resolves to its error text").

---

## REQ-18 Evidence, documentation and checks

**User story:** As a judge, I want a conformance report and recorded checks I can trust.

### Acceptance criteria

- 18.1 `npm run lint`, `npx tsc --noEmit`, `npm test` and `npm run test:e2e` SHALL all pass in `apps/seance` with zero warnings.
- 18.2 The system SHALL generate `apps/seance/ACR.md` with `npm run acr -- apps/seance` from the repository root after the tests ran, and SHALL NOT edit it by hand. The report SHALL NOT claim "Supports" for a criterion without evidence.
- 18.3 The app SHALL have a short `README.md`: what it is, how to run it, the port (5175), the pages, the theme, that nothing is stored or sent, and the test commands.
- 18.4 The system SHALL NOT claim a criterion is met without a test or a manual keyboard check recorded in the tasks (steering rule).
- 18.5 The Trusted Tester reviewer agent SHALL review the finished app once, and its findings SHALL be written to `docs/trusted-tester-review-seance.md`. Every finding SHALL be fixed or listed with a reason.
- 18.6 The system SHALL record one manual screen-reader or keyboard check of the three steps, the dialog and the success view in the tasks, stating what was and was not tested.

---

## REQ-19 Shared improvements go to the skeleton first

**User story:** As a maintainer, I want fixes that every app needs to land in the template, so that the next app gets them.

### Acceptance criteria

- 19.1 IF a defect or missing feature is found that every app would need (for example a bug in `PageShell`, `Field`, `Dialog` or the announcer), THEN the change SHALL be made in `skeleton/` first, with its test, and then brought into `apps/seance`.
- 19.2 IF a feature only Seance needs (the step flow, the error summary, the radio group, the booking store, the spirits), THEN it SHALL stay in `apps/seance` and SHALL NOT be added to `skeleton/`. The design document notes `ErrorSummary` as the first candidate to promote if a third form app appears.
