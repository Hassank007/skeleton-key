/**
 * One page for the three steps and the success view. Guarantees: a unique title per step, one h1 that receives focus,
 * a noValidate form with an error summary, the confirmation dialog, and announced loading, success and failure
 * through the shared announcer (WCAG 2.4.2, 2.4.3, 3.3.1, 3.3.4, 4.1.3).
 */
import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { DetailsStep } from '../components/DetailsStep'
import { ErrorSummary } from '../components/ErrorSummary'
import { MistArt } from '../components/MistArt'
import { SpiritStep } from '../components/SpiritStep'
import { StepActions } from '../components/StepActions'
import { StepProgress } from '../components/StepProgress'
import { SuccessPanel } from '../components/SuccessPanel'
import { WhenStep } from '../components/WhenStep'
import { useBooking } from '../contexts/BookingContext'
import { useBookingService } from '../contexts/BookingServiceContext'
import { useAnnounce } from '../hooks/useAnnounce'
import { useStepForm } from '../hooks/useStepForm'
import { findSpirit } from '../data/spirits'
import { firstInvalidStep } from '../lib/bookingState'
import { FAILURE_MESSAGE, formatSuccess } from '../lib/format'
import { STEPS, stepIndex, type FieldId, type StepId } from '../lib/steps'
import { FIELD_IDS } from '../lib/validate'
import styles from './BookingPage.module.css'

export function BookingPage({ step }: { step: StepId }) {
  const { state, dispatch, today } = useBooking()
  const navigate = useNavigate()
  const announce = useAnnounce()
  const service = useBookingService()
  const index = stepIndex(step)
  const def = STEPS[index]
  const isLast = index === STEPS.length - 1
  const booked = state.status === 'booked'
  const submitting = state.status === 'submitting'
  const failed = state.status === 'failed'

  const [dialogOpen, setDialogOpen] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)

  const form = useStepForm(step, () => {
    if (isLast) setDialogOpen(true)
    else navigate(STEPS[index + 1].path)
  })

  // Unique title for every step and for the success view.
  useEffect(() => {
    document.title = booked ? 'Séance booked — Seance' : `Step ${index + 1} of ${STEPS.length}: ${def.name} — Seance`
  }, [booked, index, def.name])

  // A submission that was running when this page was left cannot report back; do not leave the flow stuck.
  useEffect(() => {
    if (state.status === 'submitting') dispatch({ type: 'submitFail' })
    // Runs on mount only.
  }, [])

  // Submission: announce once, call the service, apply the result unless this page has gone.
  useEffect(() => {
    if (!submitting) return
    let cancelled = false
    announce('Booking your séance…')
    service(state.values).then(
      () => {
        if (!cancelled) dispatch({ type: 'submitOk' })
      },
      () => {
        if (!cancelled) dispatch({ type: 'submitFail' })
      },
    )
    return () => {
      cancelled = true
    }
    // The values are fixed while submitting; only the status starts a submission.
  }, [submitting])

  // Success: announce politely and focus the h1. The timeout runs after the dialog has returned focus and the button is gone.
  useEffect(() => {
    if (!booked) return
    const name = findSpirit(state.values.spirit)?.name ?? ''
    announce(formatSuccess(name, state.values.date, state.values.time))
    const id = setTimeout(() => headingRef.current?.focus(), 0)
    return () => clearTimeout(id)
    // Only the status change starts the success announcement.
  }, [booked])

  // Failure: focus the summary and announce it assertively.
  const summaryRef = form.summaryRef
  useEffect(() => {
    if (!failed) return
    summaryRef.current?.focus()
    announce(FAILURE_MESSAGE, { assertive: true })
  }, [failed, announce, summaryRef])

  // Guards. After booking, every step route shows the success view on step 3.
  if (booked && !isLast) return <Navigate to={STEPS[STEPS.length - 1].path} replace />
  const blocking = firstInvalidStep(state, today)
  if (!booked && blocking !== null && blocking < index) return <Navigate to={STEPS[blocking].path} replace />

  function activate(field: FieldId) {
    const control = document.getElementById(FIELD_IDS[field])
    if (!control) return
    control.focus()
    control.scrollIntoView?.({ block: 'center' })
  }

  const summaryItems = form.showSummary ? form.summaryItems : failed ? [{ message: FAILURE_MESSAGE }] : []

  if (booked) {
    return (
      <article className={styles.ticket}>
        <MistArt phase={3} />
        <h1 ref={headingRef} tabIndex={-1} className={styles.title}>
          Your séance is booked
        </h1>
        <SuccessPanel
          values={state.values}
          onBookAnother={() => {
            dispatch({ type: 'reset' })
            navigate(STEPS[0].path)
          }}
        />
      </article>
    )
  }

  const common = { values: state.values, errors: form.errors, onChange: form.onChange, onBlur: form.onBlur }

  return (
    <article className={styles.ticket}>
      <MistArt phase={index as 0 | 1 | 2} />
      <StepProgress
        current={index}
        heading={
          <h1 ref={headingRef} tabIndex={-1} className={styles.title}>
            {def.name}
          </h1>
        }
      />
      <form noValidate aria-busy={submitting || undefined} onSubmit={form.onSubmit} className={styles.form}>
        {(form.showSummary || failed) && <ErrorSummary ref={form.summaryRef} items={summaryItems} onActivate={activate} />}
        {step === 'spirit' && <SpiritStep {...common} />}
        {step === 'time' && <WhenStep {...common} today={today} />}
        {step === 'details' && <DetailsStep {...common} />}
        {submitting && <p className={styles.status}>Booking your séance…</p>}
        <StepActions index={index} submitting={submitting} onBack={() => navigate(STEPS[index - 1].path)} />
      </form>
      <ConfirmDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onConfirm={() => {
          setDialogOpen(false)
          dispatch({ type: 'submitStart' })
        }}
        values={state.values}
      />
    </article>
  )
}