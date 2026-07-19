import StatusPill from './StatusPill.jsx'
import { SIMULATED_SECURITY_POSTURE } from '../data/demoData.js'
import { formatDateTime } from '../utils/format.js'

export default function SecurityPostureCard({ role, authenticated, auditVerifiedAt, auditValid }) {
  return (
    <section className="panel security-posture" aria-labelledby="security-posture-heading">
      <h2 id="security-posture-heading">Security Posture</h2>
      <p className="panel__description">Demonstration mode — illustrative Zero Trust control surface.</p>
      <dl className="fact-grid">
        <div className="fact-grid__item">
          <dt>Authentication</dt>
          <dd>
            <StatusPill tone={authenticated ? 'success' : 'neutral'}>
              {authenticated ? 'Authenticated (JWT)' : 'Not authenticated'}
            </StatusPill>
          </dd>
        </div>
        <div className="fact-grid__item">
          <dt>Active role</dt>
          <dd>{role || '—'}</dd>
        </div>
        <div className="fact-grid__item">
          <dt>Policy engine</dt>
          <dd>{SIMULATED_SECURITY_POSTURE.policyEngineStatus}</dd>
        </div>
        <div className="fact-grid__item">
          <dt>Transport encryption</dt>
          <dd>{SIMULATED_SECURITY_POSTURE.transportEncryption}</dd>
        </div>
        <div className="fact-grid__item">
          <dt>Audit-chain integrity</dt>
          <dd>
            <StatusPill tone={auditValid === undefined ? 'neutral' : auditValid ? 'success' : 'danger'}>
              {auditValid === undefined ? 'Not yet verified' : auditValid ? 'Intact' : 'Integrity failure'}
            </StatusPill>
            <span className="fact-grid__note">{SIMULATED_SECURITY_POSTURE.auditChainIntegrityLabel}</span>
          </dd>
        </div>
        <div className="fact-grid__item">
          <dt>Crypto-agility</dt>
          <dd>{SIMULATED_SECURITY_POSTURE.pqcReadiness}</dd>
        </div>
        <div className="fact-grid__item">
          <dt>Latest verification</dt>
          <dd>{auditVerifiedAt ? formatDateTime(auditVerifiedAt) : 'Not yet run'}</dd>
        </div>
      </dl>
    </section>
  )
}
