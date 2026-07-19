import StatusPill from './StatusPill.jsx'
import { taskStatusTone } from '../utils/format.js'

export default function TaskStatusBadge({ status }) {
  return <StatusPill tone={taskStatusTone(status)}>{status || 'Unknown'}</StatusPill>
}
