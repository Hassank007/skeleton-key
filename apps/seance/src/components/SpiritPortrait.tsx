/** Decorative portrait of a spirit: aria-hidden, no title or text, never the only carrier of the spirit's name (WCAG 1.1.1, 1.4.1). */
import styles from './SpiritPortrait.module.css'

const PORTRAITS: Record<string, string[]> = {
  'mara-the-weeping-widow': [
    'M32 6C19 6 14 16 14 29c0 14-5 30-10 51h56c-5-21-10-37-10-51C50 16 45 6 32 6zm0 13c7 0 10 6 10 12s-4 14-10 14-10-8-10-14 3-12 10-12z',
    'M35 29c3 5 4 6 4 8a3.5 3.5 0 0 1-7 0c0-2 1-3 3-8z',
  ],
  'old-tobias-the-lamplighter': [
    'M30 6h20v15h6v5H24v-5h6zM20 80c0-18 7-31 20-31s20 13 20 31zM10 12h3v22h4l3 5v17H4V39l3-5h3zM8 40v11h8V40z',
    'M40 28a9 9 0 1 1 0 18 9 9 0 0 1 0-18z',
  ],
  'the-hollow-choir': [
    'M14 8a8 8 0 1 1 0 16 8 8 0 0 1 0-16zM14 16.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z' +
      'M32 4a8 8 0 1 1 0 16 8 8 0 0 1 0-16zM32 12.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z' +
      'M50 8a8 8 0 1 1 0 16 8 8 0 0 1 0-16zM50 16.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z' +
      'M23 26a8 8 0 1 1 0 16 8 8 0 0 1 0-16zM23 34.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z' +
      'M41 26a8 8 0 1 1 0 16 8 8 0 0 1 0-16zM41 34.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z' +
      'M12 44a8 8 0 1 1 0 16 8 8 0 0 1 0-16zM12 52.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z' +
      'M52 44a8 8 0 1 1 0 16 8 8 0 0 1 0-16zM52 52.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z',
    'M0 80c0-10 5-17 12-17s12 7 12 17zM40 80c0-10 5-17 12-17s12 7 12 17zM20 80c0-20 4-34 12-34s12 14 12 34z',
  ],
  'captain-ashgrove': [
    'M32 15a21 21 0 1 1 0 42 21 21 0 0 1 0-42zM32 21a15 15 0 1 1 0 30 15 15 0 0 1 0-30zM32 29a7 7 0 1 1 0 14 7 7 0 0 1 0-14z',
    'M30 6h4v24h-4zM30 42h4v18h-4zM2 34h24v4H2zM38 34h24v4H38zM9.5 16.3l2.8-2.8 15.5 15.5-2.8 2.8zM39 45.8l2.8-2.8 9 9-2.8 2.8zM51.7 13.5l2.8 2.8L39 31.8l-2.8-2.8zM22.2 43l2.8 2.8-9 9-2.8-2.8zM0 70c8-5 14-5 21 0s14 5 21 0 14-5 22 0v10H0z',
  ],
}

export function SpiritPortrait({ id }: { id: string }) {
  const [first, ...rest] = PORTRAITS[id] ?? []
  if (!first) return null
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className={styles.art}
      viewBox="0 0 64 80"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path fillRule="evenodd" d={first} />
      {rest.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}
