import MetricCard from './MetricCard.jsx'
import { SIMULATED_AVERAGE_LATENCY_MS, SIMULATED_PROVIDER_HEALTH } from '../data/demoData.js'
import { formatLatency } from '../utils/format.js'

export default function MetricsRow({ tasks, audit }) {
  const total = tasks.length
  const approved = tasks.filter((t) => t.status === 'Approved').length
  const rejected = tasks.filter((t) => t.status === 'Rejected').length
  const pending = tasks.filter((t) => t.status === 'Submitted' || t.status === 'Flagged').length
  const providersOnline = SIMULATED_PROVIDER_HEALTH.filter((p) => p.state !== 'offline').length
  const auditIntegrity = audit ? (audit.valid ? '100%' : 'Compromised') : '—'

  return (
    <section className="metrics-row" aria-label="Executive summary metrics">
      <MetricCard label="Total tasks" value={total} />
      <MetricCard label="Approved" value={approved} tone="success" />
      <MetricCard label="Rejected" value={rejected} tone="danger" />
      <MetricCard label="Pending / queued" value={pending} tone="warning" />
      <MetricCard
        label="Providers online"
        value={`${providersOnline}/${SIMULATED_PROVIDER_HEALTH.length}`}
        tone="info"
        simulated
      />
      <MetricCard
        label="Audit integrity"
        value={auditIntegrity}
        tone={audit ? (audit.valid ? 'success' : 'danger') : 'neutral'}
        hint={audit ? `${audit.records_checked} records checked` : 'Not verified yet'}
      />
      <MetricCard
        label="Avg. gateway latency"
        value={formatLatency(SIMULATED_AVERAGE_LATENCY_MS)}
        tone="info"
        simulated
      />
    </section>
  )
}
