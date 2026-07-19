import StatusPill from './StatusPill.jsx'
import LoadingState from './LoadingState.jsx'
import EmptyState from './EmptyState.jsx'
import { formatDateTime } from '../utils/format.js'

/**
 * The backend currently exposes only aggregate audit-chain validity (valid + records_checked).
 * The panel is structured so a future `event-level` array can be dropped in without reshaping
 * the UI — see the commented `events` section below.
 */
export default function AuditPanel({ audit, loading, error, onVerify, lastVerifiedAt }) {
  return (
    <section className="panel" aria-labelledby="audit-panel-heading">
      <div className="panel__header-row">
        <h2 id="audit-panel-heading">Audit Log</h2>
        <button type="button" className="button button--secondary" onClick={onVerify} disabled={loading}>
          {loading ? 'Verifying…' : 'Verify Audit Chain'}
        </button>
      </div>

      {loading && <LoadingState label="Verifying audit chain…" />}

      {!loading && error && <EmptyState title="Verification failed" description={error} />}

      {!loading && !error && !audit && (
        <EmptyState
          title="No verification run yet"
          description="Run Verify Audit Chain to check tamper-evident audit-ledger integrity."
        />
      )}

      {!loading && !error && audit && (
        <>
          <dl className="fact-grid">
            <div className="fact-grid__item">
              <dt>Chain validity</dt>
              <dd>
                <StatusPill tone={audit.valid ? 'success' : 'danger'}>
                  {audit.valid ? 'Valid — no tampering detected' : 'Invalid — integrity failure detected'}
                </StatusPill>
              </dd>
            </div>
            <div className="fact-grid__item">
              <dt>Records checked</dt>
              <dd>{audit.records_checked}</dd>
            </div>
            <div className="fact-grid__item">
              <dt>Latest verification</dt>
              <dd>{lastVerifiedAt ? formatDateTime(lastVerifiedAt) : '—'}</dd>
            </div>
          </dl>
          {audit.records_checked === 0 && (
            <EmptyState title="No audit records yet" description="Submit or act on a task to generate audit events." />
          )}
          <p className="panel__footnote">
            Event-level detail (actor, event type, timestamp, hash chain) is not yet exposed by the
            backend audit API; this panel is structured to render a chronological event list here
            once that endpoint is available.
          </p>
        </>
      )}
    </section>
  )
}
