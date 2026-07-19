import StatusPill from './StatusPill.jsx'
import { policyDecisionTone, policyDecisionLabel } from '../utils/format.js'

export default function PolicyDecisionBadge({ decision }) {
  return <StatusPill tone={policyDecisionTone(decision)}>{policyDecisionLabel(decision)}</StatusPill>
}
