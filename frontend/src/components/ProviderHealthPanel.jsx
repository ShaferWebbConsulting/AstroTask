import StatusPill from './StatusPill.jsx'
import { SIMULATED_PROVIDER_HEALTH } from '../data/demoData.js'
import { providerHealthTone, formatLatency, formatDateTime } from '../utils/format.js'

export default function ProviderHealthPanel({ tasks }) {
  return (
    <section className="panel" aria-labelledby="provider-health-heading">
      <h2 id="provider-health-heading">Provider Health</h2>
      <p className="panel__description">
        Connectivity is simulated for this demonstration; task counts reflect live gateway data.
      </p>
      <div className="provider-grid">
        {SIMULATED_PROVIDER_HEALTH.map((provider) => {
          const assignedTasks = tasks.filter((t) => t.provider === provider.name).length
          return (
            <article className="provider-card" key={provider.name}>
              <div className="provider-card__header">
                <span className="provider-card__name">{provider.name}</span>
                <StatusPill tone={providerHealthTone(provider.state)}>{provider.state}</StatusPill>
              </div>
              <dl className="fact-grid fact-grid--compact">
                <div className="fact-grid__item">
                  <dt>Latency</dt>
                  <dd>{formatLatency(provider.latencyMs)} (simulated)</dd>
                </div>
                <div className="fact-grid__item">
                  <dt>Secure channel</dt>
                  <dd>{provider.secureChannel}</dd>
                </div>
                <div className="fact-grid__item">
                  <dt>Adapter state</dt>
                  <dd>{provider.adapterState}</dd>
                </div>
                <div className="fact-grid__item">
                  <dt>Last health check</dt>
                  <dd>{formatDateTime(provider.lastCheckedAt)}</dd>
                </div>
                <div className="fact-grid__item">
                  <dt>Assigned tasks</dt>
                  <dd>{assignedTasks}</dd>
                </div>
              </dl>
            </article>
          )
        })}
      </div>
    </section>
  )
}
