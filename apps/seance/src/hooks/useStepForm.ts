/**
 * Wires touch-on-blur, live re-validation, the error summary and its focus for one step.
 * Guarantees: no error on a field the user has not touched (WCAG 3.3.1), focus moves to the summary on a failed
 * submit (2.4.3), one assertive announcement (4.1.3), and focus is never lost when the summary disappears (2.4.3).
 */
import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type RefObject } from 'react'
import { useBooking } from '../contexts/BookingContext'
import { useAnnounce } from './useAnnounce'
import { problemsMessage } from '../lib/format'
import { STEPS, type FieldId, type StepId } from '../lib/steps'
import { FIELD_IDS, validateStep, type FieldErrors } from '../lib/validate'

export interface SummaryItem {
  field?: FieldId
  message: string
}

export interface StepForm {
  /** Errors to show next to fields: only fields that are touched. */
  errors: FieldErrors
  /** One item per invalid field of the step, in DOM order. */
  summaryItems: SummaryItem[]
  showSummary: boolean
  summaryRef: RefObject<HTMLDivElement | null>
  onBlur(field: FieldId): void
  onChange(field: FieldId, value: string): void
  onSubmit(event: FormEvent): void
}

export function useStepForm(step: StepId, onValid: () => void): StepForm {
  const { state, dispatch, today } = useBooking()
  const announce = useAnnounce()
  const def = STEPS.find((s) => s.id === step)
  const fields = def ? def.fields : []

  const allErrors = validateStep(step, state.values, today)
  const errors: FieldErrors = {}
  for (const field of fields) {
    if (state.touched[field] && allErrors[field]) errors[field] = allErrors[field]
  }
  const summaryItems: SummaryItem[] = fields.flatMap((field) => {
    const message = allErrors[field]
    return message ? [{ field, message }] : []
  })

  const [showSummary, setShowSummary] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const summaryRef = useRef<HTMLDivElement>(null)
  const countRef = useRef(0)

  // A failed submit: focus the summary and send one assertive message. Runs again for every failed attempt.
  useEffect(() => {
    if (attempt === 0) return
    summaryRef.current?.focus()
    announce(problemsMessage(countRef.current), { assertive: true })
  }, [attempt, announce])

  // Every error is fixed: remove the summary. If focus was inside it, move focus to the first field first.
  useLayoutEffect(() => {
    if (!showSummary || summaryItems.length > 0) return
    const summary = summaryRef.current
    if (summary && summary.contains(document.activeElement)) {
      document.getElementById(FIELD_IDS[fields[0]])?.focus()
    }
    setShowSummary(false)
  })

  // True from a pointer press on a submit button until the pointer is released. The press blurs the focused field
  // before the click; touching it then would render an inline error that moves the button, so the click would miss.
  // The submit touches every field of the step anyway.
  const pressingSubmit = useRef(false)
  useEffect(() => {
    const down = (event: PointerEvent) => {
      const target = event.target
      pressingSubmit.current = target instanceof Element && target.closest('button[type="submit"]') !== null
    }
    const up = () => {
      pressingSubmit.current = false
    }
    document.addEventListener('pointerdown', down, true)
    document.addEventListener('pointerup', up, true)
    document.addEventListener('pointercancel', up, true)
    return () => {
      document.removeEventListener('pointerdown', down, true)
      document.removeEventListener('pointerup', up, true)
      document.removeEventListener('pointercancel', up, true)
    }
  }, [])

  return {
    errors,
    summaryItems,
    showSummary,
    summaryRef,
    onBlur(field) {
      if (pressingSubmit.current) return
      dispatch({ type: 'touch', fields: [field] })
    },
    onChange(field, value) {
      dispatch({ type: 'setField', field, value })
    },
    onSubmit(event) {
      event.preventDefault()
      if (state.status === 'submitting') return
      dispatch({ type: 'touch', fields })
      const count = Object.keys(allErrors).length
      if (count > 0) {
        countRef.current = count
        setShowSummary(true)
        setAttempt((n) => n + 1)
        return
      }
      setShowSummary(false)
      onValid()
    },
  }
}