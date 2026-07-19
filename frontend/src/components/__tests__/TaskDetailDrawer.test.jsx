import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import TaskDetailDrawer from '../TaskDetailDrawer.jsx'

const task = {
  task_id: 'aaaa1111-bbbb-2222-cccc-333344445555',
  created_by: 'mission_operator',
  status: 'Rejected',
  policy_decision: 'Rejected',
  provider: 'Maxar',
  audit_status: 'Valid',
  created_at: '2026-07-07T12:00:00Z',
}

const detail = {
  area_of_interest_name: 'Pacific Maritime Corridor',
  target_latitude: 36.7,
  target_longitude: -122.2,
  mission_justification: 'Support representative naval monitoring operations',
  provider_message: 'Only ISRApprover or Admin may submit SECRET_IL6 tasks (Rejected)',
  provider_response_id: 'MAXAR-abc',
}

describe('TaskDetailDrawer', () => {
  it('renders nothing when no task is selected', () => {
    const { container } = render(<TaskDetailDrawer task={null} onClose={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the full task id and policy rejection reason', () => {
    render(<TaskDetailDrawer task={task} detail={detail} onClose={() => {}} canApprove={false} />)
    expect(screen.getByText(task.task_id)).toBeInTheDocument()
    expect(screen.getByText(/Only ISRApprover or Admin may submit SECRET_IL6/)).toBeInTheDocument()
  })

  it('marks unreached workflow stages as not reached for a rejected task', () => {
    render(<TaskDetailDrawer task={task} detail={detail} onClose={() => {}} canApprove={false} />)
    expect(screen.getAllByText('Not reached').length).toBeGreaterThan(0)
  })

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn()
    render(<TaskDetailDrawer task={task} detail={detail} onClose={onClose} canApprove={false} />)
    screen.getByLabelText('Close task detail').click()
    expect(onClose).toHaveBeenCalled()
  })
})
