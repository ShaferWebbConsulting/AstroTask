// Centralized status labels, colors and formatting helpers.
// Keeping these in one place avoids duplicated inline styling/logic across components.

/** Semantic tone used to drive color-coded badges/pills across the app. */
export const TONE = {
  SUCCESS: 'success',
  WARNING: 'warning',
  DANGER: 'danger',
  NEUTRAL: 'neutral',
}

const TASK_STATUS_TONE = {
  Approved: TONE.SUCCESS,
  Submitted: TONE.NEUTRAL,
  Flagged: TONE.WARNING,
  Rejected: TONE.DANGER,
}

const POLICY_DECISION_TONE = {
  Approved: TONE.SUCCESS,
  FlaggedForReview: TONE.WARNING,
  Rejected: TONE.DANGER,
}

export function taskStatusTone(status) {
  return TASK_STATUS_TONE[status] || TONE.NEUTRAL
}

export function policyDecisionTone(decision) {
  return POLICY_DECISION_TONE[decision] || TONE.NEUTRAL
}

export function policyDecisionLabel(decision) {
  if (decision === 'FlaggedForReview') return 'Flagged for review'
  return decision || 'Unknown'
}

export function auditStatusTone(auditStatus) {
  if (auditStatus === 'Valid') return TONE.SUCCESS
  if (auditStatus === 'Invalid') return TONE.DANGER
  return TONE.NEUTRAL
}

export function providerHealthTone(state) {
  if (state === 'online') return TONE.SUCCESS
  if (state === 'degraded') return TONE.WARNING
  if (state === 'offline') return TONE.DANGER
  return TONE.NEUTRAL
}

/** Shortens a UUID-style task id to a readable fragment, e.g. `a1b2c3d4…`. */
export function shortId(id, length = 8) {
  if (!id) return '—'
  return id.length > length ? `${id.slice(0, length)}…` : id
}

export function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Splits an ISO interval such as `2026-07-07T12:00:00Z/2026-07-07T18:00:00Z` into readable start/end labels. */
export function formatTimeWindow(value) {
  if (!value) return { start: '—', end: '—', raw: '' }
  const [start, end] = String(value).split('/')
  return {
    start: start ? formatDateTime(start) : '—',
    end: end ? formatDateTime(end) : '—',
    raw: value,
  }
}

export function formatLatency(ms) {
  if (ms === undefined || ms === null) return '—'
  return `${Math.round(ms)} ms`
}

export function formatCoordinate(value, axis) {
  const num = Number(value)
  if (Number.isNaN(num)) return '—'
  const hemisphere = axis === 'lat' ? (num >= 0 ? 'N' : 'S') : num >= 0 ? 'E' : 'W'
  return `${Math.abs(num).toFixed(4)}° ${hemisphere}`
}
