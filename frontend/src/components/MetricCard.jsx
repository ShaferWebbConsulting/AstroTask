export default function MetricCard({ label, value, hint, tone = 'neutral', simulated = false }) {
  return (
    <div className={`metric-card metric-card--${tone}`}>
      <div className="metric-card__label">
        {label}
        {simulated && <span className="metric-card__badge">Simulated</span>}
      </div>
      <div className="metric-card__value">{value}</div>
      {hint && <div className="metric-card__hint">{hint}</div>}
    </div>
  )
}
