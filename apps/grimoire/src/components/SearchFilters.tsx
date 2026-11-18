/** Search form: labelled search input with hint, two fieldsets with legends, native checkboxes with a drawn tick (WCAG 1.3.1, 1.4.1, 3.3.2, 4.1.2). */
import type { Ref } from 'react'
import { HAZARDS, SCHOOLS, type Hazard, type School } from '../data/books'
import { isActive, type SearchState } from '../lib/searchState'
import { Button } from './Button'
import { Field } from './Field'
import styles from './SearchFilters.module.css'

interface SearchFiltersProps {
  state: SearchState
  onChange: (next: SearchState) => void
  onClear: () => void
  /** Lets the page move focus to the search input after "Clear" (WCAG 2.4.3). */
  inputRef?: Ref<HTMLInputElement>
}

function toggle<T>(list: T[], value: T, order: readonly T[]): T[] {
  const has = list.includes(value)
  return order.filter((item) => (item === value ? !has : list.includes(item)))
}

export function SearchFilters({ state, onChange, onClear, inputRef }: SearchFiltersProps) {
  return (
    <form
      role="search"
      aria-label="Catalogue search"
      className={styles.form}
      onSubmit={(event) => event.preventDefault()}
    >
      <Field
        id="catalogue-search"
        label="Search spellbooks"
        hint="Searches title, author, summary and tags."
      >
        <input
          ref={inputRef}
          type="search"
          autoComplete="off"
          className={styles.input}
          value={state.q}
          onChange={(event) => onChange({ ...state, q: event.target.value })}
        />
      </Field>

      <div className={styles.groups}>
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>School of magic</legend>
          <div className={styles.options}>
            {SCHOOLS.map((school: School) => (
              <div className={styles.option} key={school}>
                <input
                  type="checkbox"
                  id={`school-${school.toLowerCase()}`}
                  className={styles.checkbox}
                  checked={state.schools.includes(school)}
                  onChange={() => onChange({ ...state, schools: toggle(state.schools, school, SCHOOLS) })}
                />
                <label htmlFor={`school-${school.toLowerCase()}`} className={styles.optionLabel}>
                  {school}
                </label>
              </div>
            ))}
          </div>
        </fieldset>

        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>Hazard</legend>
          <div className={styles.options}>
            {HAZARDS.map((hazard: Hazard) => (
              <div className={styles.option} key={hazard}>
                <input
                  type="checkbox"
                  id={`hazard-${hazard.toLowerCase()}`}
                  className={styles.checkbox}
                  checked={state.hazards.includes(hazard)}
                  onChange={() => onChange({ ...state, hazards: toggle(state.hazards, hazard, HAZARDS) })}
                />
                <label htmlFor={`hazard-${hazard.toLowerCase()}`} className={styles.optionLabel}>
                  {hazard}
                </label>
              </div>
            ))}
          </div>
        </fieldset>
      </div>

      {isActive(state) && (
        <div>
          <Button type="button" variant="secondary" onClick={onClear}>
            Clear search and filters
          </Button>
        </div>
      )}
    </form>
  )
}
