import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AuditPanel from '../AuditPanel.jsx'

describe('AuditPanel', () => {
  it('shows a no-verification-yet empty state', () => {
    render(<AuditPanel audit={null} loading={false} error="" onVerify={() => {}} />)
    expect(screen.getByText('No verification run yet')).toBeInTheDocument()
  })

  it('shows a loading state while verifying', () => {
    render(<AuditPanel audit={null} loading error="" onVerify={() => {}} />)
    expect(screen.getByText('Verifying audit chain…')).toBeInTheDocument()
  })

  it('shows valid chain results', () => {
    render(
      <AuditPanel
        audit={{ valid: true, records_checked: 4 }}
        loading={false}
        error=""
        onVerify={() => {}}
        lastVerifiedAt="2026-07-07T12:00:00Z"
      />,
    )
    expect(screen.getByText(/Valid — no tampering detected/)).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('shows an invalid-chain warning', () => {
    render(<AuditPanel audit={{ valid: false, records_checked: 2 }} loading={false} error="" onVerify={() => {}} />)
    expect(screen.getByText(/Invalid — integrity failure detected/)).toBeInTheDocument()
  })

  it('invokes onVerify when the button is clicked', () => {
    const onVerify = vi.fn()
    render(<AuditPanel audit={null} loading={false} error="" onVerify={onVerify} />)
    fireEvent.click(screen.getByText('Verify Audit Chain'))
    expect(onVerify).toHaveBeenCalled()
  })
})
