import type { BookingValues, FieldId } from '../lib/steps'
import type { FieldErrors } from '../lib/validate'

/** Props shared by the three step bodies: controlled values, the errors to show, and change/blur callbacks. */
export interface StepProps {
  values: BookingValues
  errors: FieldErrors
  onChange(field: FieldId, value: string): void
  onBlur(field: FieldId): void
}