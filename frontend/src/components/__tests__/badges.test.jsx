import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import TaskStatusBadge from '../TaskStatusBadge.jsx'
import PolicyDecisionBadge from '../PolicyDecisionBadge.jsx'

describe('TaskStatusBadge', () => {
  it('renders the status text', () => {
    render(<TaskStatusBadge status="Approved" />)
    expect(screen.getByText('Approved')).toBeInTheDocument()
  })
})

describe('PolicyDecisionBadge', () => {
  it('renders a readable label for FlaggedForReview', () => {
    render(<PolicyDecisionBadge decision="FlaggedForReview" />)
    expect(screen.getByText('Flagged for review')).toBeInTheDocument()
  })

  it('renders Rejected decisions', () => {
    render(<PolicyDecisionBadge decision="Rejected" />)
    expect(screen.getByText('Rejected')).toBeInTheDocument()
  })
})
