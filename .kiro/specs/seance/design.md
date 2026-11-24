# Seance: Design

Implements `requirements.md` in this folder. Paths are relative to `apps/seance/` unless they start with `skeleton/`, `scripts/` or `.kiro/`.

## 1. Decisions

| Decision | Choice | Why |
| --- | --- | --- |
| Creation | `npm run new-app seance`, then edit. | Structure rule: never hand-copy. *(REQ-1.1)* |
| Dependencies | None added. `react-router-dom`, `fast-check`, `vitest-axe` and `@axe-core/playwright` are already in the skeleton. | Tech rule: no new dependency without a written reason. There is none: validation is six small functions, the date and time controls are native, and the flow state is a `useReducer`. A form library would add a second way to wire labels and errors, which is the thing the skeleton exists to control. *(REQ-1.5)* |
| Steps as routes | `/book/spirit`, `/book/time`, `/book/details`, each a page with its own `h1`. | The skeleton's `useFocusOnRouteChange` already moves focus to the `h1` and announces `document.title` on a pathname change. Step titles begin "Step N of 3", so progress is announced with no extra code. The browser Back button also works. *(REQ-2.5, 9.3)* |
| Flow state | `BookingProvider` (context plus reducer) above `<Routes>`, in memory only. | State survives route changes (SC 3.3.7). Nothing is persisted because the data is personal. *(REQ-3.1, 3.2)* |
| Success view | Same route as step 3, rendered when `status === 'booked'`. | A route change would run the skeleton's title announcement after a `setTimeout(0)` and overwrite the success message in the polite region. Staying on the route lets the success message be the last and only status. *(REQ-12.3, 12.4)* |
| Radio group | Native radios in a `fieldset` with `legend`, `role="radiogroup"` on the `fieldset`, `aria-invalid` and `aria-describedby` on it. | `role="radiogroup"` is allowed on `fieldset` (ARIA in HTML) and supports `aria-invalid`; `aria-invalid` is not supported on a bare `radio`. Native keyboard behaviour is untouched. The axe test proves the pairing. *(REQ-4.2, 7.4)* |
| Date and time | `<input type="date">` and `<input type="time">`, `min`, `max`, `step`, `noValidate` form, own messages. | Native controls give a screen reader and a keyboard user a known widget. Browsers differ in how they enforce `min` and `max`, so the app validates the value itself and shows its own text. *(REQ-5.1, 7.1)* |
| `autocomplete` on date and time | None. | SC 1.3.5 covers fields about the user. A booking date is not one. An invalid token would be worse than none. *(REQ-5.5)* |
| Name field | One `name` input, token `name`. | Splitting into given and family name asks the user to do work for a form that does not need it, and fails for single-name users. |
| Validation timing | On blur, then on change while the field has an error. Not on first focus, not on every key press for a clean field. | Early errors on a half-typed e-mail are noise. Fast clearing confirms the fix. *(REQ-7.2, 7.3)* |
| Error summary | New `ErrorSummary` component in the app, not the skeleton. | Product list names six primitives and no summary; only form apps need it. It is the first candidate to promote (REQ-19.2). |
| Summary links | `<a href="#id">` with an `onClick` that calls `preventDefault`, focuses the control and scrolls it into view. | A real link works for assistive technology and for "open link" menus. `BrowserRouter` would otherwise change the URL for a hash. *(REQ-8.4)* |
| Summary announcement | Focus plus one short assertive message ("2 problems found. Fix them to continue."). | The skeleton's `Field` comment asks for this. Focus reads the full list; the assertive message covers screen readers that do not announce a focus move onto a non-interactive container. Errors that block the user are the allowed use of assertive. *(REQ-8.3, 8.5)* |
| Loading and success | Polite "Booking your séance…", then polite success message, both through `useAnnounce()`. | Steering: status messages and loading states go through the shared announcer. *(REQ-12)* |
| Dialog before announce | The dialog closes first, then the service is called. | The skeleton `Dialog` sets `#root` inert, and `AnnouncerProvider` renders its live regions inside `#root`. A message sent while the dialog is open would not be heard. *(REQ-11.6)* |
| Booking service | `submitBooking(booking)` in `src/lib/bookingService.ts`, provided through `BookingServiceContext`. Default resolves after 700 ms. | No back end. A context lets tests inject instant success and failure. *(REQ-12.7)* |
| Clock | `today()` in `src/lib/clock.ts`, provided through a prop on `BookingProvider` with the real clock as default. | Unit tests pass a fixed date. Playwright uses `page.clock.setFixedTime`. *(REQ-5.7, 16.2)* |
| Theme | Change values in `tokens.css` and `dark.css` only. No new colour token. | The existing contrast matrix and property tests then cover Seance with no change. *(REQ-13.1, 13.5)* |
| Dev port | 5175 with `--strictPort`, set in `package.json` (`dev`) and `playwright.config.ts`. | A fixed port 5173 or 5174 plus `reuseExistingServer` could let a running skeleton or Grimoire answer Seance's tests. *(REQ-1.4)* |
| Keyboard-only guard | A unit test that scans the two `*.keyboard.spec.ts` files for forbidden Playwright calls. | The requirement says "keyboard-only". A convention is not proof; a failing test is. *(REQ-16.1)* |

## 2. File layout

Files marked *(new)* are added. Files marked *(edit)* come from the skeleton and are changed. Everything else stays as generated.

```
apps/seance/
  index.html                         (edit) title "Seance"
  package.json                       (edit) name seance; dev: vite --port 5175 --strictPort
  playwright.config.ts               (edit) baseURL, webServer on 5175; use: locale en-US, timezoneId UTC
  README.md                          (edit) Seance readme
  src/
    App.tsx                          (edit) routes, BookingProvider
    data/
      spirits.json                   (new) four spirits
      spirits.ts                     (new) Spirit type, SPIRITS, findSpirit
    lib/
      clock.ts                       (new) today(), addDays(), toIsoDate(), parseIsoDate()
      format.ts                      (new) formatLongDate(), formatTime12h(), problemsMessage()
      validate.ts                    (new) six validators, validateStep(), FIELD_IDS
      bookingState.ts                (new) BookingState, actions, reducer, isStepValid(), firstInvalidStep()
      bookingService.ts              (new) submitBooking(), BookingService type
    contexts/
      BookingContext.tsx             (new) BookingProvider, useBooking()
      BookingServiceContext.tsx      (new) default stub and hook
    hooks/
      useStepForm.ts                 (new) touch/blur/change wiring, submit attempt, summary focus
    components/
      PageShell.tsx                  (edit) site name, nav links
      StepProgress.tsx  (+ .module.css)  (new) "Step N of 3" text and ordered list
      ErrorSummary.tsx  (+ .module.css)  (new) focusable summary with links
      SpiritStep.tsx    (+ .module.css)  (new) fieldset, legend, four radios
      WhenStep.tsx                       (new) date and time Fields
      DetailsStep.tsx                    (new) name, email, phone Fields
      StepActions.tsx   (+ .module.css)  (new) Back and Next buttons
      ConfirmDialog.tsx (+ .module.css)  (new) Dialog with dl summary and two buttons
      SuccessPanel.tsx  (+ .module.css)  (new) success text and "Book another séance"
      MistArt.tsx       (+ .module.css)  (new) decorative moon and mist, aria-hidden
    pages/
      IntroPage.tsx     (+ .module.css)  (new, replaces HomePage)
      BookingPage.tsx   (+ .module.css)  (new) one page component used by all three step routes
      AboutPage.tsx                  (edit) Seance text
      NotFoundPage.tsx               (edit) Seance title
    tokens/tokens.css, dark.css      (edit) Spectral Slate palette (section 7)
  tests/
    unit/
      validate.test.ts, format.test.ts, clock.test.ts, bookingState.test.ts,
      stepGuard.test.tsx, spirits-data.test.ts, no-repeated-questions.test.tsx,
      bookingService.test.tsx, keyboard-only-guard.test.ts, hue.test.ts,
      theme-identity.test.ts, no-hex-in-components.test.ts       (new)
      StepProgress.test.tsx, ErrorSummary.test.tsx, SpiritStep.test.tsx, WhenStep.test.tsx,
      DetailsStep.test.tsx, ConfirmDialog.test.tsx, SuccessPanel.test.tsx,
      MistArt.test.tsx                                            (new) axe + behaviour
      IntroPage.test.tsx, BookingPage.test.tsx                    (new; HomePage.test.tsx removed)
      properties/validate.property.test.ts, errorSummary.property.test.tsx,
      booking.property.test.tsx                                   (new)
      support/hue.ts, support/grimoire-palette.ts, support/booking-fixtures.ts (new)
      (all skeleton tests kept; "Skeleton Key" strings in them renamed)
    e2e/
      booking-happy.keyboard.spec.ts, booking-errors.keyboard.spec.ts,
      axe-steps.spec.ts, responsive.spec.ts, motion.spec.ts,
      about.spec.ts, not-found.spec.ts                            (new; home.spec.ts replaced)
      (dialog.spec.ts kept as is)
      support/keys.ts                (new) typeDate(), typeTime(), tabTo(), fixClock()
```

`HomePage` is renamed to `IntroPage`. `HomePage.module.css` is deleted with it. The skeleton `Dialog`, `Tabs`, `Toast` and `Button` stay in `src/components/`.

## 3. Data model

```ts
export interface Spirit { id: string; name: string; blurb: string; speciality: string }
// spirits.json: four records, e.g. ids 'mara-the-weeping-widow', 'old-tobias-the-lamplighter',
// 'the-hollow-choir', 'captain-ashgrove'. blurb: one sentence, at most 140 characters.

export type FieldId = 'spirit' | 'date' | 'time' | 'name' | 'email' | 'phone'
export type StepId = 'spirit' | 'time' | 'details'
export const STEPS: readonly { id: StepId; path: string; name: string; fields: readonly FieldId[] }[] = [
  { id: 'spirit',  path: '/book/spirit',  name: 'Choose a spirit',      fields: ['spirit'] },
  { id: 'time',    path: '/book/time',    name: 'Pick a date and time', fields: ['date', 'time'] },
  { id: 'details', path: '/book/details', name: 'Your details',         fields: ['name', 'email', 'phone'] },
]

export type BookingValues = Record<FieldId, string>   // date 'YYYY-MM-DD', time 'HH:MM', spirit = spirit id
export type FlowStatus = 'editing' | 'submitting' | 'failed' | 'booked'

export interface BookingState {
  values: BookingValues
  touched: Record<FieldId, boolean>
  status: FlowStatus
}
```

The DOM id of every control is `field-<FieldId>`. `FIELD_IDS` in `validate.ts` is the one source of those ids, used by the components, the summary and the tests. Radio ids are `field-spirit` for the first radio (the summary link target) and `spirit-<spirit id>` for the others, so the link target is always the first radio.

## 4. Logic

### 4.1 Validators

```ts
export type Validator = (value: string, today: Date) => string | null
export const validators: Record<FieldId, Validator>
export function validateStep(step: StepId, values: BookingValues, today: Date): Partial<Record<FieldId, string>>
```

Rules (messages are in REQ-7.5):

| Field | Rule |
| --- | --- |
| spirit | non-empty and equal to the id of a spirit in `SPIRITS` |
| date | non-empty; matches `^\d{4}-\d{2}-\d{2}$`; `parseIsoDate` round-trips (rejects `2030-02-31`); not before `addDays(today, 1)`; not after `addDays(today, 90)` |
| time | non-empty; matches `^\d{2}:\d{2}$`; minutes are `00` or `30`; from `18:00` to `23:30` by string comparison (zero-padded, so it sorts) |
| name | `value.trim()` length 1 or more, then 2 to 80 |
| email | trimmed; exactly one `@`; local part 1 to 64 characters with no space; domain has a dot, no empty label, no space, total at most 255; no leading or trailing dot. Deliberately loose: the browser's `type="email"` and the user's own typing catch the rest, and a strict regex rejects real addresses. |
| phone | trimmed; only `0-9`, space, `+ - . ( )`; `+` only at the start; 7 to 15 digits |

All validators are total: they never throw, whatever the string. Messages never include the input (REQ-7.6).

`today` is a `Date` at local midnight. `addDays` uses `setDate`, so it is right across daylight-saving changes. Dates are compared as ISO strings (zero padded, so string order is date order).

### 4.2 Reducer

```ts
type Action =
  | { type: 'setField'; field: FieldId; value: string }
  | { type: 'touch'; fields: FieldId[] }
  | { type: 'submitStart' } | { type: 'submitOk' } | { type: 'submitFail' }
  | { type: 'reset' }
```

- `setField` changes one value only. It does not touch the field.
- `touch` adds fields to the touched set.
- `submitStart` sets `submitting`; `submitOk` sets `booked`; `submitFail` sets `failed`; `reset` returns the initial state.
- `isStepValid(state, step, today)` is `Object.keys(validateStep(...)).length === 0`.
- `firstInvalidStep(state, today)` returns the first step in `STEPS` whose fields are not all valid, or `null`.

### 4.3 Step guard

`BookingPage` computes `const blocking = firstInvalidStep(state, today)`; for the step at index `i`, if the blocking step has index `< i`, it renders `<Navigate to={STEPS[blocking].path} replace />`. Step 1 is never guarded. After `booked`, step 3 stays on the success view.

### 4.4 `useStepForm`

```ts
useStepForm(step: StepId): {
  errors: Partial<Record<FieldId, string>>        // only fields that are touched
  summaryItems: { field: FieldId; message: string }[]
  summaryRef: RefObject<HTMLDivElement | null>
  onBlur(field: FieldId): void
  onChange(field: FieldId, value: string): void
  onSubmit(e: FormEvent): void                    // returns true to continue
}
```

- `errors` = `validateStep(...)` filtered to touched fields. Because `setField` changes the value and validation runs on render, the error clears as soon as the value is valid (REQ-7.2), and a field that was never touched shows nothing (REQ-7.3).
- `onBlur` touches the field.
- `onSubmit` calls `preventDefault`. It touches every field of the step. If `validateStep` returns errors, it sets `showSummary`, increments `attempt`, and an effect keyed on `attempt` focuses `summaryRef` and calls `announce(problemsMessage(n), { assertive: true })`. If there are none, it hides the summary and runs the step's `onValid` callback (navigate, or open the dialog).
- The summary lists `validateStep` results for the step, so it shrinks as the user fixes fields. When it becomes empty, `showSummary` is set false in an effect. If `document.activeElement` is inside the summary at that moment, focus moves to the first field of the step (REQ-8.6).
- `summaryItems` order is the field order of `STEPS`, which is the DOM order, so the list matches the visual order.

### 4.5 Focus rules

| Event | Focus |
| --- | --- |
| Route change (pathname) | `h1` of the new page, by `useFocusOnRouteChange` *(REQ-2.5)* |
| Failed submit (steps 1 to 3) | Error summary, by the `attempt` effect *(REQ-8.3)* |
| Summary link activated | The named control (first radio for the group) *(REQ-8.4)* |
| Summary becomes empty while focus is inside | First field of the step *(REQ-8.6)* |
| Dialog opens | First focusable inside (the skeleton close button) *(REQ-11.4)* |
| Dialog closes by Escape, close, or "Go back and edit" | "Review and book" (skeleton `Dialog` returns it) *(REQ-11.5)* |
| "Book my séance" | The dialog closes (focus returns to "Review and book", which stays mounted and `aria-disabled`); when the success view renders, an effect focuses the success `h1` in a `setTimeout(0)`, so it runs after the dialog's own return-focus effect and after the button has gone *(REQ-12.3)* |
| Failure | Error summary *(REQ-12.5)* |
| "Book another séance" | The step 1 `h1`, by the route change *(REQ-3.5)* |

Typing, blur and change never move focus.

## 5. Components and pages

All components are small, typed, and start with a one-line comment about the accessibility guarantee.

### 5.1 `BookingPage`

One component serves the three step routes. It takes `step: StepId` and renders:

```
<article>
  <MistArt />                           // aria-hidden
  <StepProgress current={index} />      // <p>Step 2 of 3</p> + <ol>
  <h1 tabIndex={-1}>{step.name}</h1>    // or "Your séance is booked" in the success view
  <form noValidate aria-busy={submitting} onSubmit={onSubmit}>
    {showSummary && <ErrorSummary ref items onLinkActivate />}
    {step === 'spirit'  && <SpiritStep ... />}
    {step === 'time'    && <WhenStep ... />}
    {step === 'details' && <DetailsStep ... />}
    <StepActions step canGoBack onBack />   // Back (type=button), Next / "Review and book" (type=submit)
  </form>
  <ConfirmDialog ... />
</article>
```

`document.title` is set in an effect from `STEPS`: `Step N of 3: <name> — Seance`, or `Séance booked — Seance`. The page `h1` has `tabIndex={-1}` for the route-change hook. Heading outline: `h1` step name, then `h2` "There is a problem" (summary only), `h2` or `legend` for groups. The legend is not a heading; the step `h1` is the section title.

"Next" is `type="submit"`, so Enter inside a text input submits the step, which is the expected form behaviour. "Back" is `type="button"` and renders only on steps 2 and 3. The primary button label is "Next" on steps 1 and 2 and "Review and book" on step 3.

### 5.2 `StepProgress`

```
<p class="step-count">Step 2 of 3</p>
<ol class="steps" aria-label="Booking steps">
  <li>1. Choose a spirit <span>(completed)</span></li>
  <li aria-current="step">2. Pick a date and time <span>(current)</span></li>
  <li>3. Your details <span>(not started)</span></li>
</ol>
```

The state words are visible text. A numbered marker and a tick or ring drawn by CSS are redundant extras; the text carries the meaning (REQ-9.2). It is a plain `ol`, so there is nothing to focus and no live region (REQ-9.4). The `<p>` sits above the `h1` so reading order is "Step 2 of 3", then the heading.

### 5.3 `SpiritStep`

```
<fieldset role="radiogroup" aria-invalid={error ? 'true' : undefined} aria-describedby={error ? 'field-spirit-error' : undefined}>
  <legend>Which spirit would you like to meet?</legend>
  {error && <span id="field-spirit-error">Error: …</span>}      // same markup as Field's error
  {SPIRITS.map(s => (
    <div class="option">
      <input type="radio" name="spirit" id=… value={s.id} checked onChange aria-describedby=`${id}-blurb` required />
      <label for=…>{s.name}</label>
      <span id=`${id}-blurb`>{s.blurb} Speciality: {s.speciality}.</span>
    </div>
  ))}
</fieldset>
```

- The error text uses the same classes and `ErrorIcon` markup as `Field`. If a second form app appears, `FieldError` should be exported from the skeleton (REQ-19.1).
- The group error sits after the legend and before the first radio, so it is read with the group when focus enters it.
- The option is a card: the native input is visually the mark (`appearance: none`, a 1.5 rem circle with a border, a drawn inner dot when `:checked`); the `label` is a block with padding that fills the card, so the whole card is the click target and no `::after` trick is needed. The blurb sits inside the card after the label. Selected state also adds a thicker border (3 px against 1 px), so it is not colour alone. `forced-colors: active` keeps the border and uses `Highlight` for the dot.
- Native radio keyboard behaviour is untouched. There is no script on arrow keys.
- Spirits stay in the data order. Nothing is selected on first render (REQ-4.4).

### 5.4 `WhenStep` and `DetailsStep`

Use the skeleton `Field` for every input, with `required`, `hint` and `error`:

```
<Field id="field-date" label="Date" hint={`Choose a day from ${long(min)} to ${long(max)}.`} required error={errors.date}>
  <input type="date" min={iso(min)} max={iso(max)} required value onChange onBlur />
</Field>
<Field id="field-time" label="Time" hint="Visiting hours are 6:00 PM to 11:30 PM, every 30 minutes." required error={errors.time}>
  <input type="time" min="18:00" max="23:30" step={1800} required value onChange onBlur />
</Field>

<Field id="field-name"  label="Full name"     hint="As you would like the spirit to address you." required error>
  <input type="text"  autoComplete="name"  autoCapitalize="words" />
<Field id="field-email" label="Email address" hint="For example name@example.com." required error>
  <input type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} />
<Field id="field-phone" label="Phone number"  hint="Digits, spaces, plus, hyphens and brackets. For example +44 20 7946 0000." required error>
  <input type="tel"   autoComplete="tel"   inputMode="tel" />
```

`Field` already builds `aria-describedby` as hint id then error id and sets `aria-invalid` (verified in `skeleton/src/components/Field.tsx`). The skeleton `Field` receives the `id`; `FIELD_IDS` supplies it.

The date `min` and `max` and the date hint come from `today` via the booking context, so a clock change in a test moves both. `max` is 90 days from today.

### 5.5 `ErrorSummary`

```
<div ref tabIndex={-1} aria-labelledby="error-summary-title" class="summary">
  <h2 id="error-summary-title">There is a problem</h2>
  <ul>
    <li><a href="#field-spirit" onClick={activate}>Choose a spirit to continue.</a></li>
  </ul>
</div>
```

`items: { field: FieldId; message: string; href?: string }[]`. The failure from REQ-12.5 is passed as an item with no `field`, rendered as plain text instead of a link. `onActivate(field)` is passed in by the page: it calls `document.getElementById(FIELD_IDS[field])`, `focus()`, and `scrollIntoView({ block: 'center' })` (reduced to `auto` behaviour when motion is off, which is the default for `scrollIntoView` with no `behavior`). `scroll-margin-top: calc(var(--header-height) + var(--space-4))` is set on every form control wrapper and the summary itself (REQ-8.7, SC 2.4.11).

The container is not `role="alert"`, to avoid a second announcement of the same content. It is focusable only by script (`tabindex="-1"`), so it is not a Tab stop.

### 5.6 `ConfirmDialog`

```
<Dialog isOpen onClose title="Confirm your séance" description="Check your booking. Nothing is booked until you confirm.">
  <dl>
    <dt>Spirit</dt><dd>Mara the Weeping Widow</dd>
    <dt>Date</dt><dd>Wednesday, November 13, 2030</dd>
    <dt>Time</dt><dd>8:30 PM</dd>
    <dt>Name</dt><dd>…</dd> <dt>Email</dt><dd>…</dd> <dt>Phone</dt><dd>…</dd>
  </dl>
  <Button variant="primary" onClick={onConfirm}>Book my séance</Button>
  <Button variant="secondary" onClick={onClose}>Go back and edit</Button>
</Dialog>
```

The user's values are rendered as React text children, so they are escaped. `onConfirm` runs: `onClose()` (state in the page: `dialogOpen = false`), then in the same handler `dispatch(submitStart)` and `submit()`. React batches the two state changes, so the dialog closes in the same commit that sets `submitting`. The announcement (`Booking your séance…`) is sent from an effect that runs after that commit. The skeleton `Dialog` removes `inert` from `#root` in its effect clean-up, which runs in the same commit phase, so the live region is reachable by then. The unit test and the e2e test read the polite region to prove it. If the e2e test shows the text is lost, the fallback is to send the announcement inside `setTimeout(0)`; the task records which was needed.

### 5.7 Submission and success

```ts
export type BookingService = (booking: BookingValues) => Promise<void>
export const submitBooking: BookingService = (b) => new Promise((resolve) => setTimeout(resolve, 700))
```

An effect on `status === 'submitting'` calls the service once per submit. It uses an `AbortController`-style `cancelled` flag in the clean-up, so a StrictMode double run or an unmount cannot apply a late result. On resolve it dispatches `submitOk`; on reject, `submitFail`.

- `submitting`: `announce('Booking your séance…')`, `aria-busy` on the form, "Review and book" gets `aria-disabled="true"` and its handler returns early.
- `booked`: `SuccessPanel` replaces the form. Effects: title, `announce(successMessage)` (polite), focus the `h1` in `setTimeout(0)`. `successMessage = "Séance booked with {name} on {long date} at {time}."` built by `formatSuccess()` in `format.ts`.
- `failed`: the form shows `ErrorSummary` with the one non-link item and focuses it; the assertive announcement is the same text.

`SuccessPanel` has the text from REQ-12.3 and a "Book another séance" button (`reset` then `navigate('/book/spirit')`). The button is a real `button`, because it changes state, not only location.

### 5.8 `IntroPage`

`h1` "Book a séance with a spirit", `MistArt`, a paragraph on what the flow asks, the `StepProgress`-style list of the three steps (a plain `ol`, no state words), the demo notice, and `<AppLink href="/book/spirit">Start booking</AppLink>` styled as a primary button by class (a link, because it navigates). Title: `Book a séance — Seance`.

### 5.9 `MistArt`

An inline SVG moon and two blurred CSS-drawn bands, `aria-hidden="true"`, `focusable="false"`, no `title`, behind the heading, not behind form text. The bands drift with a CSS animation that the skeleton's reduced-motion rule and the in-app toggle switch off (the rule works through `[data-motion='reduced']` and the media query, as the skeleton does for the ghost). Contrast checks never include it (REQ-13.8).

### 5.10 Shell

`PageShell` header: the site name text changes from "Skeleton Key" to "Seance" (kept `aria-hidden`, as in the skeleton, because the titles and the `h1` name the page). Nav links: "Book a séance" (`/book/spirit`) and "About" (`/about`). Footer: "Seance. A demo booking form for invented spirits. Nothing you type is stored or sent."

## 6. Accessibility mapping

| Concern | Mechanism | SC |
| --- | --- | --- |
| Radio group | `fieldset` + `legend`, native radios, label per radio, blurb in `aria-describedby` | 1.3.1, 3.3.2, 4.1.2 |
| Native date and time | `input type="date"` and `"time"`, labels, hints | 1.3.1, 2.1.1, 3.3.2 |
| Autocomplete | `name`, `email`, `tel` | 1.3.5 |
| Field errors | Text with "Error:" prefix, `aria-invalid`, `aria-describedby` | 1.4.1, 3.3.1, 3.3.3, 4.1.2 |
| Error summary | Focus on submit, links to fields, one assertive message | 2.4.3, 3.3.1, 4.1.3 |
| Step progress | Visible "Step N of 3", state words, `aria-current="step"`, title announced | 1.3.1, 1.4.1, 2.4.2, 4.1.3 |
| Redundant entry | One store, values kept on Back, summary as read-only text | 3.3.7 |
| Confirmation | Skeleton `Dialog` (APG modal), review before commit | 2.1.2, 2.4.3, 3.3.4 |
| Loading and success | Polite announcements via the shared announcer, focus on success `h1` | 2.4.3, 4.1.3 |
| No cognitive test | No CAPTCHA, no confirm-email, paste allowed | 3.3.8 |
| Focus and sticky header | Global ring, `scroll-margin-top` | 2.4.7, 2.4.11, 1.4.11 |
| Targets | 2.75 rem controls, full-card radio labels | 2.5.8 |
| Reflow and spacing | One narrow column, no fixed text heights | 1.4.10, 1.4.12 |
| Motion | Mist animation off under OS setting and in-app toggle | 2.2.2, 2.3.3 |
| Decorative art | `aria-hidden="true"` | 1.1.1 |

## 7. Theme

Name: **Spectral Slate**. Only the values change. Each pair below was computed with the WCAG formula used in `tests/unit/support/contrast.ts`; the tests recompute them from the real CSS.

### 7.1 Light (`tokens.css`)

| Token | Value | Check |
| --- | --- | --- |
| `--color-surface` | `#eef5f6` | ghost white-blue, hue 188° |
| `--color-surface-raised` | `#dce9ed` | the "ticket" panel, hue 194° |
| `--color-text` | `#0d1f26` | 15.33:1 on surface, 13.63:1 on raised |
| `--color-text-muted` | `#34505c` | 7.77:1, 6.91:1 |
| `--color-text-on-accent` | `#ffffff` | 7.24:1 on accent, 9.82:1 on accent-hover |
| `--color-link` | `#0b5566` | 7.59:1, 6.75:1 |
| `--color-link-hover` | `#073f4d` | 10.41:1, 9.26:1 |
| `--color-accent` | `#0b5f73` | 6.56:1, 5.84:1 (UI needs 3:1) |
| `--color-accent-hover` | `#084a5a` | fill for white text |
| `--color-error` | `#a3173f` | 6.91:1, 6.15:1; rose, not Grimoire's crimson |
| `--color-success` | `#0f6040` | 6.88:1, 6.11:1 |
| `--color-warning` | `#7a4d00` | 6.59:1, 5.86:1 |
| `--color-border` | `#4f7280` | 4.70:1 on surface, 4.18:1 on raised (UI needs 3:1) |
| `--color-focus-ring` | `#3d3a9e` | 8.28:1, 7.37:1; indigo, easy to tell from the teal accent |

### 7.2 Dark (`dark.css`, media query and `[data-theme='dark']`, identical values)

| Token | Value | Check |
| --- | --- | --- |
| `--color-surface` | `#0a1418` | midnight teal, hue 197° |
| `--color-surface-raised` | `#14242b` | hue 198° |
| `--color-text` | `#e3f2f5` | 16.24:1, 13.88:1 |
| `--color-text-muted` | `#a9c4cc` | 10.17:1, 8.70:1 |
| `--color-text-on-accent` | `#ffffff` | 4.79:1 on accent, above 6:1 on accent-hover |
| `--color-link` | `#6ee7e0` | 12.58:1, 10.76:1; spectral cyan |
| `--color-link-hover` | `#a5f3ee` | 14.79:1, 12.65:1 |
| `--color-accent` | `#108078` | 3.89:1 on surface, 3.33:1 on raised (UI needs 3:1); never text |
| `--color-accent-hover` | `#0d6962` | fill for white text; exempt as a foreground, as in the skeleton |
| `--color-error` | `#ff9fb4` | 9.65:1, 8.25:1 |
| `--color-success` | `#7fe3b5` | 12.04:1, 10.29:1 |
| `--color-warning` | `#f2d06b` | 12.44:1, 10.64:1 |
| `--color-border` | `#5fa3b3` | 6.55:1, 5.60:1 |
| `--color-focus-ring` | `#a5b4fc` | 9.35:1, 8.00:1; periwinkle |

The dark accent is a compromise: it must hold 3:1 on both surfaces and 4.5:1 with white text, and `#108078` is the brightest teal that keeps white text above 4.5:1. The tasks re-run the contrast tests to confirm the numbers above, and a task allows adjusting the colour (not the test) if one fails.

### 7.3 Why it looks different from Grimoire

Hue bands are the contract (REQ-13.3). Seance surfaces sit at 188° to 198°, accent 175° to 192°, link 177° to 191°, border 191° to 197°: the cool band. Grimoire is in the warm band (0° to 45°). Beyond hue: a sans-serif heading token (`--font-heading: 'Gill Sans', 'Trebuchet MS', Candara, 'Segoe UI', sans-serif`), `--radius-md: 0.75rem` and `--radius-sm: 0.375rem`, one centred column 36 rem wide rendered as a raised "ticket" panel with a dashed border, numbered step markers, and radio "cards" with a drawn dot. Grimoire uses a book serif, a card grid and checkboxes.

`tests/unit/support/grimoire-palette.ts` holds Grimoire's light and dark values for surface, surface-raised, accent, link, border and focus ring (copied as constants from `.kiro/specs/grimoire/design.md` section 6, with the section named in a comment). `theme-identity.test.ts` fails if any Seance value equals one of them, or if the hue distance for surface, accent, link or border is under 90°. Seance is a standalone project, so it must not import from `apps/grimoire`.

### 7.4 What proves contrast

No new ratio test is written. These existing files, copied unchanged, read `src/tokens/tokens.css` and `dark.css` of the app:

- `tests/unit/properties/contrast.property.test.ts`: every matrix pair in the light theme and both dark sources.
- `tests/unit/tokens-contrast.test.ts`: white text on accent and accent-hover in both themes at 4.5:1.

`theme-identity.test.ts` adds: the token set equals the skeleton's, hue bands, no skeleton purple, no Grimoire value, with a negative control. `hue.ts` (`hueOf(hex)`) has its own unit test on known colours. `no-hex-in-components.test.ts` scans CSS outside `src/tokens/` with a negative control.

## 8. Test plan

| Requirement | Vitest (`tests/unit/`) | Playwright (`tests/e2e/`) |
| --- | --- | --- |
| REQ-2 shell, titles | `IntroPage`, `BookingPage` (title, one `h1`), skeleton `PageShell` test renamed | every spec: title, landmarks, `h1` focus |
| REQ-3 state, guard | `bookingState`, `stepGuard` | happy path (Back keeps values), guard redirect in the error spec |
| REQ-4 spirit step | `SpiritStep`, `spirits-data` | happy and error specs |
| REQ-5 date and time | `WhenStep`, `clock`, `validate` | typed date and time in both specs |
| REQ-6 details | `DetailsStep` (autocomplete tokens) | happy spec reads tokens |
| REQ-7 validation | `validate`, `validate.property`, step tests | error spec (blur validation, aria-describedby) |
| REQ-8 summary | `ErrorSummary`, `errorSummary.property`, `BookingPage` | error spec (focus, links, order) |
| REQ-9 progress | `StepProgress`, `BookingPage` | happy spec (text, title, polite region) |
| REQ-10 no repeats | `no-repeated-questions` | happy spec (control count) |
| REQ-11 dialog | `ConfirmDialog`, `BookingPage` | happy spec (trap, Escape, return) |
| REQ-12 submit, success | `bookingService`, `SuccessPanel`, `BookingPage` | happy spec (polite message, focus, title) |
| REQ-13 theme | skeleton contrast tests, `theme-identity`, `hue`, `no-hex` | `axe-steps.spec.ts` in dark scheme |
| REQ-14 reflow, motion | none | `responsive.spec.ts`, `motion.spec.ts` |
| REQ-15 axe | every component, page and state | `axe-steps.spec.ts` with `scanPage`, light and dark |
| REQ-16 keyboard | `keyboard-only-guard` | the two `*.keyboard.spec.ts` files |
| REQ-17 properties | `validate.property`, `errorSummary.property`, `booking.property` | none |

Rules for the tests:

- Unit page tests render inside `MemoryRouter`, `MotionProvider`, `AnnouncerProvider` (the real providers, so live regions exist and can be read) and `BookingProvider` with a fixed `today` and an injected service.
- The announcer writes on two microtasks. Tests `await` a microtask flush before reading `[aria-live]`.
- Playwright tests wait for text with `expect(...).toHaveText(...)`, never a fixed sleep. The 700 ms service delay is waited for by the success text, not by time.
- The keyboard specs type dates with `typeDate('11132030')` and times with `typeTime('0830P')` from `support/keys.ts`. Both call `page.keyboard.type`; the helper owns the "segments are typed in order for `en-US`" knowledge. Fixed clock: `page.clock.setFixedTime(new Date('2030-10-30T12:00:00'))`. The window is then 2030-10-31 to 2031-01-28, and 2030-11-13 is a Wednesday.
- Playwright axe scans use `scanPage` from `tests/e2e/support/axe.ts`, so evidence files reach the ACR generator. Dark scans use `test.use({ colorScheme: 'dark' })` in a nested `describe`.
- Test titles carry `[SC x.y.z]` tags for the criterion they protect.
- Page-load animations are off in e2e through the skeleton's reduced-motion rule (`reducedMotion: 'reduce'` in the config's `use`), except in `motion.spec.ts`.

## 9. Risks and answers

| Risk | Answer |
| --- | --- |
| `aria-invalid` on the radio group `fieldset` is flagged by axe. | `role="radiogroup"` supports `aria-invalid`. The `SpiritStep` axe test runs with an error shown. If axe still objects, the fallback is `aria-describedby` on the fieldset only and `aria-invalid` on each radio is NOT used; the decision is recorded in the task and the ACR notes it. |
| Date and time segment typing differs by browser and locale. | Only Chromium is tested; the config sets `locale: 'en-US'` and `timezoneId: 'UTC'`. The helper asserts the resulting `input.value` immediately after typing, so a failure points at typing, not at the app. |
| Polite message lost because the live region sits inside `#root` while the dialog is open. | The dialog closes first (REQ-11.6). The test reads the polite region after the dialog is gone. |
| Skeleton `Dialog` returns focus to a button that unmounts on success. | Focus on the success `h1` is set in `setTimeout(0)` after the render, and the e2e test asserts focus is on the `h1`. |
| `useFocusOnRouteChange` skips the first load, so a direct visit to a step leaves focus at the top. | That is the skeleton's intended behaviour (skip link stays first). A guard redirect is a pathname change and does move focus to the new `h1`. |
| Validation on blur fires when the user clicks "Back" or a summary link. | Allowed. The field becomes touched and may show its error; the error is true. |
| A re-render clears the typed date segments in some browsers when `min` or `max` change. | `min` and `max` depend on `today`, which is computed once per provider mount, not on each render. |
| Chromium shows a date input as valid-looking text for a partial date (value is `''`). | The validator treats `''` as "Enter a date." The message covers a partial entry. The hint says to fill the day, month and year. |
| Personal data in a failed-test trace or evidence file. | Tests use invented values (`Ada Example`, `ada@example.com`, `+44 20 7946 0000`). `scanPage` stores no HTML. Nothing is written to storage. |
| A shared defect is found while building. | REQ-19: fix in `skeleton/` first, then bring it in. |


## 10. Visual refresh

A styling pass. Copy, accessible names, roles, ids, DOM order, focus moves, announcements, routes and the `--color-*` tokens are unchanged, and no dependency, font or image file was added.

- **Scene.** `MistArt` is now a lit seance room at the top of the ticket (moon, ground, table, three candles, drifting mist). It meets the ticket edges through negative margins that match the ticket padding. It has one `<g>`, the drifting one, and the drift still stops under the OS setting and the in-app toggle.
- **Moon phase.** `MistArt` takes `phase` 0 to 3: crescent on the intro, half and gibbous on steps 1 to 3 (index 0 to 2 maps to phases 0 to 2), full on the booked view. It repeats "Step N of 3" in a picture and does not animate between phases.
- **Portraits.** `SpiritPortrait` is an inline SVG per spirit, `aria-hidden`, with no title or text, placed first inside each radio label so it is part of the click target. The radio keeps its `aria-labelledby` name. The spirit's name stays real text.
- **Step rail.** Markers are 2.5rem. From 40rem the list is three columns joined by a dashed line, solid green once a step is done. Below 40rem it stays vertical. State words stay visible. In forced colours the current marker uses `Highlight` and drops its ring.
- **Selected card.** A tinted background, a ring and the drawn radio dot. In forced colours the ring (removed by the browser) is replaced by a real outline.
- **Review and success.** The review panel gets an accent top edge and a headline spirit row. The success text sits in a dashed "invitation" with the spirit's portrait above it.
- **Colour.** Components use tokens only. Mixes use `color-mix(in srgb, ...)`. The selected-card tint was checked against the token matrix: text 12.81 (light) and 14.54 (dark), text-muted 6.50 and 9.11, border 3.92 and 5.87, accent 5.49 and 3.48, focus ring 6.92 and 8.38.
- **Motion.** The only loop is the mist drift. Hover and selected transitions use `--duration-fast` (0ms under the toggle) and are also removed under `prefers-reduced-motion: reduce`.
- **Tests added.** `SpiritPortrait.test.tsx` (all four ids: hidden, no title or text, no `<g>`, axe) and phase cases in `MistArt.test.tsx` (one `<g>` per phase, hidden, axe).