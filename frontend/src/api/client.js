// Centralized API access for the AstroTask Secure Gateway backend.
// All network calls (auth, tasking, audit) live here so components stay presentation-focused.

/**
 * @typedef {'MissionOperator'|'ISRApprover'|'SecurityOfficer'|'Admin'} Role
 * @typedef {'EO'|'SAR'|'RF'} SensorType
 * @typedef {'CUI_IL5'|'SECRET_IL6'} ClassificationLevel
 * @typedef {'Approved'|'Rejected'|'FlaggedForReview'} PolicyDecision
 * @typedef {'Submitted'|'Approved'|'Rejected'|'Flagged'} TaskStatus
 * @typedef {'Maxar'|'Planet'|'BlackSky'|'Umbra'|'ICEYE'} ProviderName
 *
 * @typedef {Object} TaskRequestInput
 * @property {number} target_latitude
 * @property {number} target_longitude
 * @property {string} area_of_interest_name
 * @property {string} mission_priority
 * @property {SensorType} sensor_type
 * @property {string} requested_time_window
 * @property {ClassificationLevel} classification_level
 * @property {ProviderName} commercial_provider_preference
 * @property {string} mission_justification
 *
 * @typedef {Object} TaskResponse
 * @property {string} task_id
 * @property {TaskStatus} status
 * @property {PolicyDecision} policy_decision
 * @property {ProviderName} provider
 * @property {string} provider_response_id
 * @property {string} provider_message
 *
 * @typedef {Object} TaskSummary
 * @property {string} task_id
 * @property {string} created_by
 * @property {TaskStatus} status
 * @property {PolicyDecision} policy_decision
 * @property {ProviderName} provider
 * @property {string} audit_status
 * @property {string} created_at
 *
 * @typedef {Object} AuditVerifyResponse
 * @property {boolean} valid
 * @property {number} records_checked
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

/** Structured error carrying whatever the backend returned so the UI can render a human summary. */
export class ApiError extends Error {
  constructor(message, { status, kind, body } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.kind = kind || 'unknown'
    this.body = body
  }
}

function classifyFailure(status, body) {
  if (status === undefined) return 'transport'
  if (status === 401 || status === 403) return 'authorization'
  if (body && body.policy_decision === 'Rejected') return 'policy'
  if (status === 400) return 'policy'
  return 'request'
}

export function createApiClient({ getToken } = {}) {
  async function request(path, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
    const token = getToken ? getToken() : undefined
    if (token) headers.Authorization = ['Bearer', token].join(' ')

    let res
    try {
      res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })
    } catch (networkErr) {
      throw new ApiError('Unable to reach the AstroTask gateway.', {
        kind: 'transport',
        body: { message: networkErr.message },
      })
    }

    const rawText = await res.text()
    let data = {}
    if (rawText) {
      try {
        data = JSON.parse(rawText)
      } catch {
        data = { message: rawText }
      }
    }

    if (!res.ok) {
      const kind = classifyFailure(res.status, data)
      const message = data.provider_message || data.message || `Request failed (HTTP ${res.status})`
      throw new ApiError(message, { status: res.status, kind, body: data })
    }

    return data
  }

  return {
    /** @returns {Promise<{token: string, role: Role}>} */
    login(credentials) {
      return request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) })
    },
    /** @returns {Promise<TaskResponse>} */
    submitTask(payload) {
      return request('/tasks', { method: 'POST', body: JSON.stringify(payload) })
    },
    /** @returns {Promise<TaskSummary[]>} */
    listTasks() {
      return request('/tasks')
    },
    /** @returns {Promise<TaskResponse>} */
    actOnTask(taskId, action) {
      return request(`/tasks/${taskId}/action`, { method: 'POST', body: JSON.stringify({ action }) })
    },
    /** @returns {Promise<AuditVerifyResponse>} */
    verifyAudit() {
      return request('/audit/verify')
    },
  }
}
