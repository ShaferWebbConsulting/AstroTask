import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import TaskTable from '../TaskTable.jsx'

const baseTasks = [
  {
    task_id: 'aaaa1111-bbbb-2222-cccc-333344445555',
    created_by: 'mission_operator',
    status: 'Approved',
    policy_decision: 'Approved',
    provider: 'Maxar',
    audit_status: 'Valid',
    created_at: '2026-07-07T12:00:00Z',
  },
  {
    task_id: 'zzzz9999-8888-7777-6666-555544443333',
    created_by: 'mission_operator',
    status: 'Rejected',
    policy_decision: 'Rejected',
    provider: 'Planet',
    audit_status: 'Valid',
    created_at: '2026-07-08T12:00:00Z',
  },
]

describe('TaskTable', () => {
  it('shows a loading state', () => {
    render(<TaskTable tasks={[]} taskDetails={{}} loading error="" onSelectTask={() => {}} />)
    expect(screen.getByText('Loading mission tasks…')).toBeInTheDocument()
  })

  it('shows an error state', () => {
    render(<TaskTable tasks={[]} taskDetails={{}} loading={false} error="boom" onSelectTask={() => {}} />)
    expect(screen.getByText('Unable to load tasks')).toBeInTheDocument()
    expect(screen.getByText('boom')).toBeInTheDocument()
  })

  it('shows an empty state when there are no tasks', () => {
    render(<TaskTable tasks={[]} taskDetails={{}} loading={false} error="" onSelectTask={() => {}} />)
    expect(screen.getByText('No tasks match your filters')).toBeInTheDocument()
  })

  it('renders task rows with status and policy badges', () => {
    render(<TaskTable tasks={baseTasks} taskDetails={{}} loading={false} error="" onSelectTask={() => {}} />)
    const table = within(screen.getByRole('table'))
    expect(table.getAllByText('Approved').length).toBeGreaterThan(0)
    expect(table.getAllByText('Rejected').length).toBeGreaterThan(0)
    expect(table.getByText('Maxar')).toBeInTheDocument()
    expect(table.getByText('Planet')).toBeInTheDocument()
  })

  it('filters rows by status', () => {
    render(<TaskTable tasks={baseTasks} taskDetails={{}} loading={false} error="" onSelectTask={() => {}} />)
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'Rejected' } })
    const table = within(screen.getByRole('table'))
    expect(table.queryByText('Maxar')).not.toBeInTheDocument()
    expect(table.getByText('Planet')).toBeInTheDocument()
  })

  it('filters rows by search term', () => {
    render(<TaskTable tasks={baseTasks} taskDetails={{}} loading={false} error="" onSelectTask={() => {}} />)
    fireEvent.change(screen.getByPlaceholderText('Search by task ID, submitter, or provider'), {
      target: { value: 'planet' },
    })
    const table = within(screen.getByRole('table'))
    expect(table.queryByText('Maxar')).not.toBeInTheDocument()
    expect(table.getByText('Planet')).toBeInTheDocument()
  })

  it('calls onSelectTask when View is clicked', () => {
    const onSelectTask = vi.fn()
    render(<TaskTable tasks={baseTasks} taskDetails={{}} loading={false} error="" onSelectTask={onSelectTask} />)
    fireEvent.click(within(screen.getByRole('table')).getAllByText('View')[0])
    expect(onSelectTask).toHaveBeenCalledWith(baseTasks[1].task_id)
  })
})
