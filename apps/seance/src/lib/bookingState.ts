/** Pure state of the booking flow: answers, touched fields and status. Lives in memory only, because it holds personal data (REQ-3.2). */
import { FIELD_IDS_LIST, STEPS, type BookingValues, type FieldId, type StepId } from './steps'
import { validateStep } from './validate'

export { STEPS } from './steps'
export type { BookingValues, FieldId, StepId, StepDefinition } from './steps'

export type FlowStatus = 'editing' | 'submitting' | 'failed' | 'booked'

export interface BookingState {
  values: BookingValues
  touched: Record<FieldId, boolean>
  status: FlowStatus
}

export type Action =
  | { type: 'setField'; field: FieldId; value: string }
  | { type: 'touch'; fields: readonly FieldId[] }
  | { type: 'submitStart' }
  | { type: 'submitOk' }
  | { type: 'submitFail' }
  | { type: 'reset' }

function blankRecord<T>(value: T): Record<FieldId, T> {
  const out = {} as Record<FieldId, T>
  for (const field of FIELD_IDS_LIST) out[field] = value
  return out
}

export function initialState(): BookingState {
  return { values: blankRecord(''), touched: blankRecord(false), status: 'editing' }
}

export function bookingReducer(state: BookingState, action: Action): BookingState {
  switch (action.type) {
    case 'setField':
      if (state.values[action.field] === action.value) return state
      return { ...state, values: { ...state.values, [action.field]: action.value } }
    case 'touch': {
      if (action.fields.every((f) => state.touched[f])) return state
      const touched = { ...state.touched }
      for (const field of action.fields) touched[field] = true
      return { ...state, touched }
    }
    case 'submitStart':
      return { ...state, status: 'submitting' }
    case 'submitOk':
      return { ...state, status: 'booked' }
    case 'submitFail':
      return { ...state, status: 'failed' }
    case 'reset':
      return initialState()
  }
}

/** True when every field of the step passes its validator. */
export function isStepValid(state: BookingState, step: StepId, today: Date): boolean {
  return Object.keys(validateStep(step, state.values, today)).length === 0
}

/** Index in STEPS of the first step that is not valid, or null when all are. */
export function firstInvalidStep(state: BookingState, today: Date): number | null {
  const index = STEPS.findIndex((s) => !isStepValid(state, s.id, today))
  return index === -1 ? null : index
}