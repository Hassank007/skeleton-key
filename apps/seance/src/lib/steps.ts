/** Field and step identifiers and the step order. Kept free of imports so validation and state can both use it. */

export type FieldId = 'spirit' | 'date' | 'time' | 'name' | 'email' | 'phone'
export type StepId = 'spirit' | 'time' | 'details'

export interface StepDefinition {
  id: StepId
  path: string
  name: string
  fields: readonly FieldId[]
}

export const STEPS: readonly StepDefinition[] = [
  { id: 'spirit', path: '/book/spirit', name: 'Choose a spirit', fields: ['spirit'] },
  { id: 'time', path: '/book/time', name: 'Pick a date and time', fields: ['date', 'time'] },
  { id: 'details', path: '/book/details', name: 'Your details', fields: ['name', 'email', 'phone'] },
]

/** Date is `YYYY-MM-DD`, time is `HH:MM` (24-hour), spirit is a spirit id. Everything else is free text. */
export type BookingValues = Record<FieldId, string>

export const FIELD_IDS_LIST: readonly FieldId[] = ['spirit', 'date', 'time', 'name', 'email', 'phone']

export function stepIndex(step: StepId): number {
  return STEPS.findIndex((s) => s.id === step)
}