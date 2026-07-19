import { useState } from 'react'

const KIND_TITLES = {
  policy: 'Task rejected by policy',
  authorization: 'Authorization required',
  transport: 'Unable to reach the gateway',
  request: 'Request failed',
}

/**
 * Structured alert used in place of raw JSON errors. Renders a human-readable summary first,
 * with technical (status, policy_decision, provider, provider_response_id, provider_message,
 * raw body) details available behind a disclosure toggle for debugging.
 */
export default function Alert({ tone = 'neutral', title, message, detail, onDismiss }) {
  const [expanded, setExpanded] = useState(false)

  if (!title && !message) return null

  return (
    <div className={`alert alert--${tone}`} role="alert">
      <div className="alert__body">
        {title && <p className="alert__title">{title}</p>}
        {message && <p className="alert__message">{message}</p>}
        {detail && (
          <dl className="alert__facts">
            {Object.entries(detail.facts || {})
              .filter(([, value]) => value !== undefined && value !== null && value !== '')
              .map(([key, value]) => (
                <div key={key} className="alert__fact">
                  <dt>{key}</dt>
                  <dd>{String(value)}</dd>
                </div>
              ))}
          </dl>
        )}
        {detail?.raw && (
          <>
            <button type="button" className="link-button" onClick={() => setExpanded((v) => !v)}>
              {expanded ? 'Hide technical details' : 'Show technical details'}
            </button>
            {expanded && <pre className="alert__raw">{JSON.stringify(detail.raw, null, 2)}</pre>}
          </>
        )}
      </div>
      {onDismiss && (
        <button type="button" className="alert__dismiss" aria-label="Dismiss notification" onClick={onDismiss}>
          ×
        </button>
      )}
    </div>
  )
}

/** Builds Alert props from an ApiError (or plain Error) instance. */
export function alertFromError(err) {
  if (!err) return null
  const kind = err.kind || 'request'
  const body = err.body || {}
  return {
    tone: kind === 'policy' ? 'danger' : 'warning',
    title: KIND_TITLES[kind] || 'Request failed',
    message: err.message,
    detail: {
      facts: {
        Status: err.status,
        'Policy decision': body.policy_decision,
        Provider: body.provider,
        'Task ID': body.task_id,
        'Provider response ID': body.provider_response_id,
        'Provider message': body.provider_message,
      },
      raw: body,
    },
  }
}

/** Builds Alert props for a successful task submission response. */
export function alertFromSubmission(data) {
  const decision = data.policy_decision
  const tone = decision === 'Approved' ? 'success' : decision === 'FlaggedForReview' ? 'warning' : 'neutral'
  const title =
    decision === 'Approved'
      ? 'Task submitted and approved'
      : decision === 'FlaggedForReview'
        ? 'Task submitted and flagged for review'
        : 'Task submitted'
  return {
    tone,
    title,
    message: data.provider_message,
    detail: {
      facts: {
        'Task ID': data.task_id,
        Status: data.status,
        Provider: data.provider,
        'Provider response ID': data.provider_response_id,
      },
      raw: data,
    },
  }
}
