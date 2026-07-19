// Generic color-coded status pill. Color communicates tone but is always paired with text
// so status is never conveyed by color alone (accessibility requirement).
export default function StatusPill({ tone = 'neutral', children }) {
  return (
    <span className={`pill pill--${tone}`} role="status">
      {children}
    </span>
  )
}
