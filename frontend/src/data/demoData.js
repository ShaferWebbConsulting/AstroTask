// Centralized simulated demonstration data.
//
// The Phase I backend does not yet expose provider telemetry, gateway latency history,
// or a fine-grained security posture feed. Rather than scattering placeholder values across
// components, every simulated value used by the dashboard lives in this single module and is
// clearly labeled so it can be swapped for a real endpoint later without touching UI code.

/** @typedef {{name: string, state: 'online'|'degraded'|'offline', latencyMs: number, secureChannel: string, lastCheckedAt: string, adapterState: string}} ProviderHealth */

export const SIMULATED_DATA_NOTICE =
  'Values marked "Simulated" are representative demonstration data. They illustrate the intended production telemetry surface and are not sourced from a live provider or monitoring feed.'

/**
 * Baseline provider health used to render the Provider Health panel.
 * `assignedTasks` is intentionally omitted here — it is derived from real task data at render time.
 * @type {ProviderHealth[]}
 */
export const SIMULATED_PROVIDER_HEALTH = [
  {
    name: 'Maxar',
    state: 'online',
    latencyMs: 182,
    secureChannel: 'TLS 1.3 mutual auth',
    lastCheckedAt: new Date().toISOString(),
    adapterState: 'Adapter healthy',
  },
  {
    name: 'Planet',
    state: 'online',
    latencyMs: 231,
    secureChannel: 'TLS 1.3 mutual auth',
    lastCheckedAt: new Date().toISOString(),
    adapterState: 'Adapter healthy',
  },
  {
    name: 'BlackSky',
    state: 'degraded',
    latencyMs: 640,
    secureChannel: 'TLS 1.3 (renegotiating)',
    lastCheckedAt: new Date().toISOString(),
    adapterState: 'Adapter retrying — elevated latency',
  },
]

/** Simulated average gateway/provider round-trip latency shown in the executive metrics row. */
export const SIMULATED_AVERAGE_LATENCY_MS = 284

/**
 * Security posture card content. Authentication status and active role are derived from real
 * session state by the caller; the remaining fields describe the Phase I demonstration security
 * architecture rather than an accredited production deployment.
 */
export const SIMULATED_SECURITY_POSTURE = {
  policyEngineStatus: 'Active — evaluating every submission (demonstration mode)',
  transportEncryption: 'AES-256-GCM payload encryption + simulated secure provider channel',
  auditChainIntegrityLabel: 'Cryptographically chained (SHA-256)',
  pqcReadiness: 'PQC-ready architecture — Kyber/Dilithium adapter reserved, not yet active',
}

/** Ordered list of checkpoints rendered by the architecture flow visualization. */
export const ARCHITECTURE_CHECKPOINTS = [
  { id: 'auth', label: 'Authentication' },
  { id: 'policy', label: 'Policy Evaluation' },
  { id: 'encryption', label: 'Encryption' },
  { id: 'audit', label: 'Audit Logging' },
]

export const ARCHITECTURE_STAGES = [
  { id: 'mission', label: 'Government Mission System' },
  { id: 'gateway', label: 'AstroTask Secure Gateway' },
  { id: 'adapter', label: 'Provider Adapter Layer' },
  { id: 'provider', label: 'Commercial Provider' },
]

/**
 * Workflow timeline stage catalog for the task detail drawer. `reached(task)` decides whether a
 * given task has actually progressed to that stage using only real task fields — stages that are
 * not justified by the data are rendered as "not reached" rather than falsely completed.
 */
export const WORKFLOW_STAGES = [
  { id: 'submitted', label: 'Submitted', reached: () => true },
  { id: 'authenticated', label: 'Authenticated', reached: () => true },
  {
    id: 'policy_evaluated',
    label: 'Policy evaluated',
    reached: (task) => Boolean(task.policy_decision),
  },
  {
    id: 'decision',
    label: 'Approved / Rejected',
    reached: (task) => task.policy_decision === 'Approved' || task.status === 'Rejected',
  },
  {
    id: 'encrypted',
    label: 'Encrypted',
    reached: (task) => task.policy_decision !== 'Rejected',
  },
  {
    id: 'routed',
    label: 'Routed to provider',
    reached: (task) => task.policy_decision !== 'Rejected' && Boolean(task.provider),
  },
  {
    id: 'acknowledged',
    label: 'Provider acknowledged',
    reached: (task) => task.policy_decision !== 'Rejected' && Boolean(task.provider_response_id),
  },
  {
    id: 'queued',
    label: 'Queued',
    reached: (task) => task.status === 'Approved' || task.status === 'Submitted',
  },
  {
    id: 'completed',
    label: 'Completed',
    reached: (task) => task.status === 'Approved' && task.policy_decision === 'Approved',
  },
]
