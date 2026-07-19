import { useMemo, useState } from 'react'
import TaskStatusBadge from './TaskStatusBadge.jsx'
import PolicyDecisionBadge from './PolicyDecisionBadge.jsx'
import StatusPill from './StatusPill.jsx'
import LoadingState from './LoadingState.jsx'
import EmptyState from './EmptyState.jsx'
import { shortId, formatDateTime, auditStatusTone } from '../utils/format.js'

const STATUS_OPTIONS = ['Submitted', 'Approved', 'Rejected', 'Flagged']
const PROVIDER_OPTIONS = ['Maxar', 'Planet', 'BlackSky', 'Umbra', 'ICEYE']
const CLASSIFICATION_OPTIONS = ['CUI_IL5', 'SECRET_IL6']

export default function TaskTable({
  tasks,
  taskDetails,
  loading,
  error,
  onSelectTask,
  selectedTaskId,
  canApprove,
  onAction,
  actingTaskId,
}) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [providerFilter, setProviderFilter] = useState('all')
  const [classificationFilter, setClassificationFilter] = useState('all')
  const [sortKey, setSortKey] = useState('created_at')
  const [sortDir, setSortDir] = useState('desc')
  const [copiedId, setCopiedId] = useState('')

  const enriched = useMemo(
    () =>
      tasks.map((task) => ({
        ...task,
        classification_level: taskDetails[task.task_id]?.classification_level,
        sensor_type: taskDetails[task.task_id]?.sensor_type,
      })),
    [tasks, taskDetails],
  )

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return enriched
      .filter((task) => (statusFilter === 'all' ? true : task.status === statusFilter))
      .filter((task) => (providerFilter === 'all' ? true : task.provider === providerFilter))
      .filter((task) => (classificationFilter === 'all' ? true : task.classification_level === classificationFilter))
      .filter((task) => {
        if (!term) return true
        return (
          task.task_id.toLowerCase().includes(term) ||
          task.created_by?.toLowerCase().includes(term) ||
          task.provider?.toLowerCase().includes(term)
        )
      })
      .sort((a, b) => {
        const dir = sortDir === 'asc' ? 1 : -1
        const av = a[sortKey] ?? ''
        const bv = b[sortKey] ?? ''
        return av > bv ? dir : av < bv ? -dir : 0
      })
  }, [enriched, search, statusFilter, providerFilter, classificationFilter, sortKey, sortDir])

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const copyId = async (id) => {
    try {
      await navigator.clipboard.writeText(id)
      setCopiedId(id)
      setTimeout(() => setCopiedId(''), 1500)
    } catch {
      // Clipboard API may be unavailable (e.g. insecure context); ignore silently.
    }
  }

  return (
    <section className="panel" aria-labelledby="task-table-heading">
      <h2 id="task-table-heading">Mission Tasks</h2>
      <div className="task-table__toolbar">
        <label className="field field--search">
          <span className="field__label">Search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by task ID, submitter, or provider"
          />
        </label>
        <label className="field">
          <span className="field__label">Status</span>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field__label">Provider</span>
          <select value={providerFilter} onChange={(e) => setProviderFilter(e.target.value)}>
            <option value="all">All</option>
            {PROVIDER_OPTIONS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field__label">Classification</span>
          <select value={classificationFilter} onChange={(e) => setClassificationFilter(e.target.value)}>
            <option value="all">All</option>
            {CLASSIFICATION_OPTIONS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>

      {loading && <LoadingState label="Loading mission tasks…" />}
      {!loading && error && (
        <EmptyState title="Unable to load tasks" description={error} />
      )}
      {!loading && !error && filtered.length === 0 && (
        <EmptyState
          title="No tasks match your filters"
          description={tasks.length === 0 ? 'Submit a tasking request to get started.' : 'Try adjusting search or filters.'}
        />
      )}
      {!loading && !error && filtered.length > 0 && (
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>
                  <button type="button" className="sort-button" onClick={() => toggleSort('task_id')}>
                    Task ID
                  </button>
                </th>
                <th>
                  <button type="button" className="sort-button" onClick={() => toggleSort('status')}>
                    Status
                  </button>
                </th>
                <th>Policy decision</th>
                <th>
                  <button type="button" className="sort-button" onClick={() => toggleSort('provider')}>
                    Provider
                  </button>
                </th>
                <th>Classification</th>
                <th>Sensor</th>
                <th>Audit</th>
                <th>
                  <button type="button" className="sort-button" onClick={() => toggleSort('created_at')}>
                    Submitted
                  </button>
                </th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((task) => (
                <tr
                  key={task.task_id}
                  className={selectedTaskId === task.task_id ? 'data-table__row--selected' : ''}
                >
                  <td>
                    <span className="mono" title={task.task_id}>
                      {shortId(task.task_id)}
                    </span>
                    <button type="button" className="icon-button" onClick={() => copyId(task.task_id)} aria-label="Copy full task ID">
                      {copiedId === task.task_id ? 'Copied' : 'Copy'}
                    </button>
                  </td>
                  <td>
                    <TaskStatusBadge status={task.status} />
                  </td>
                  <td>
                    <PolicyDecisionBadge decision={task.policy_decision} />
                  </td>
                  <td>{task.provider}</td>
                  <td>{task.classification_level || '—'}</td>
                  <td>{task.sensor_type || '—'}</td>
                  <td>
                    <StatusPill tone={auditStatusTone(task.audit_status)}>{task.audit_status}</StatusPill>
                  </td>
                  <td>{formatDateTime(task.created_at)}</td>
                  <td>
                    <div className="action-menu">
                      <button type="button" className="button button--secondary" onClick={() => onSelectTask(task.task_id)}>
                        View
                      </button>
                      {canApprove && (
                        <>
                          <button
                            type="button"
                            className="button button--success"
                            disabled={actingTaskId === task.task_id}
                            onClick={() => onAction(task.task_id, 'approve')}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="button button--danger"
                            disabled={actingTaskId === task.task_id}
                            onClick={() => onAction(task.task_id, 'deny')}
                          >
                            Deny
                          </button>
                          <button
                            type="button"
                            className="button button--warning"
                            disabled={actingTaskId === task.task_id}
                            onClick={() => onAction(task.task_id, 'flag')}
                          >
                            Flag
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
