import TaskStatusBadge from './TaskStatusBadge.jsx'
import PolicyDecisionBadge from './PolicyDecisionBadge.jsx'
import StatusPill from './StatusPill.jsx'
import { WORKFLOW_STAGES } from '../data/demoData.js'
import { formatCoordinate, formatDateTime, formatTimeWindow, auditStatusTone } from '../utils/format.js'

/**
 * Detail drawer for a selected task. `detail` merges the real TaskSummary (from GET /tasks)
 * with the real TaskResponse captured at submission time in this session, when available.
 * Fields that were never returned by the backend for this task show as "Not available in
 * this session" instead of fabricated values.
 */
export default function TaskDetailDrawer({ task, detail, onClose, onAction, canApprove, acting }) {
  if (!task) return null

  const notAvailable = 'Not available in this session'
  const window = formatTimeWindow(detail?.requested_time_window)

  return (
    <div className="drawer-overlay" role="presentation" onClick={onClose}>
      <aside
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-detail-heading"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="drawer__header">
          <h2 id="task-detail-heading">Task Detail</h2>
          <button type="button" className="icon-button" aria-label="Close task detail" onClick={onClose}>
            ×
          </button>
        </div>

        <p className="mono drawer__task-id">{task.task_id}</p>

        <div className="drawer__badges">
          <TaskStatusBadge status={task.status} />
          <PolicyDecisionBadge decision={task.policy_decision} />
          <StatusPill tone={auditStatusTone(task.audit_status)}>Audit: {task.audit_status}</StatusPill>
        </div>

        <dl className="fact-grid">
          <div className="fact-grid__item">
            <dt>Area of interest</dt>
            <dd>{detail?.area_of_interest_name || notAvailable}</dd>
          </div>
          <div className="fact-grid__item">
            <dt>Coordinates</dt>
            <dd>
              {detail
                ? `${formatCoordinate(detail.target_latitude, 'lat')}, ${formatCoordinate(detail.target_longitude, 'lon')}`
                : notAvailable}
            </dd>
          </div>
          <div className="fact-grid__item">
            <dt>Requested collection window</dt>
            <dd>{detail ? `${window.start} → ${window.end}` : notAvailable}</dd>
          </div>
          <div className="fact-grid__item">
            <dt>Sensor</dt>
            <dd>{detail?.sensor_type || notAvailable}</dd>
          </div>
          <div className="fact-grid__item">
            <dt>Priority</dt>
            <dd>{detail?.mission_priority || notAvailable}</dd>
          </div>
          <div className="fact-grid__item">
            <dt>Classification</dt>
            <dd>{detail?.classification_level || notAvailable}</dd>
          </div>
          <div className="fact-grid__item fact-grid__item--wide">
            <dt>Mission justification</dt>
            <dd>{detail?.mission_justification || notAvailable}</dd>
          </div>
          <div className="fact-grid__item fact-grid__item--wide">
            <dt>Policy reason / provider message</dt>
            <dd>{detail?.provider_message || notAvailable}</dd>
          </div>
          <div className="fact-grid__item">
            <dt>Assigned provider</dt>
            <dd>{task.provider}</dd>
          </div>
          <div className="fact-grid__item">
            <dt>Provider response ID</dt>
            <dd className="mono">{detail?.provider_response_id || notAvailable}</dd>
          </div>
          <div className="fact-grid__item">
            <dt>Submitted</dt>
            <dd>{formatDateTime(task.created_at)}</dd>
          </div>
          <div className="fact-grid__item">
            <dt>Submitted by</dt>
            <dd>{task.created_by}</dd>
          </div>
        </dl>

        <h3>Workflow timeline</h3>
        <ol className="timeline">
          {WORKFLOW_STAGES.map((stage) => {
            const reached = stage.reached(task)
            return (
              <li key={stage.id} className={`timeline__item ${reached ? 'timeline__item--reached' : ''}`}>
                <span className="timeline__dot" aria-hidden="true" />
                <span className="timeline__label">{stage.label}</span>
                <span className="timeline__state">{reached ? 'Completed' : 'Not reached'}</span>
              </li>
            )
          })}
        </ol>

        {canApprove && task.status !== 'Approved' && task.status !== 'Rejected' && (
          <div className="drawer__actions">
            <button
              type="button"
              className="button button--success"
              disabled={acting}
              onClick={() => onAction(task.task_id, 'approve')}
            >
              Approve
            </button>
            <button
              type="button"
              className="button button--danger"
              disabled={acting}
              onClick={() => onAction(task.task_id, 'deny')}
            >
              Deny
            </button>
            <button
              type="button"
              className="button button--warning"
              disabled={acting}
              onClick={() => onAction(task.task_id, 'flag')}
            >
              Flag
            </button>
          </div>
        )}
      </aside>
    </div>
  )
}
