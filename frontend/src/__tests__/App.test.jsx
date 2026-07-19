import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import App from '../App.jsx'

function jsonResponse(body, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(JSON.stringify(body)),
  })
}

describe('App', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('logs in successfully and reveals the mission dashboard', async () => {
    global.fetch.mockImplementation((url) => {
      if (String(url).endsWith('/auth/login')) {
        return jsonResponse({ token: 'test-token', role: 'MissionOperator' })
      }
      if (String(url).endsWith('/tasks')) return jsonResponse([])
      if (String(url).endsWith('/audit/verify')) return jsonResponse({ valid: true, records_checked: 0 })
      return jsonResponse({})
    })

    render(<App />)
    fireEvent.click(screen.getByText('Sign in'))

    await waitFor(() => expect(screen.getByText(/Authenticated as MissionOperator/)).toBeInTheDocument())
    expect(screen.getByText('New Collection Request')).toBeInTheDocument()
    expect(screen.getByText('Security Posture')).toBeInTheDocument()
  })

  it('submits a task successfully and shows an approval notification', async () => {
    global.fetch.mockImplementation((url, options) => {
      if (String(url).endsWith('/auth/login')) {
        return jsonResponse({ token: 'test-token', role: 'MissionOperator' })
      }
      if (String(url).endsWith('/tasks') && options?.method === 'POST') {
        return jsonResponse({
          task_id: 'task-123',
          status: 'Approved',
          policy_decision: 'Approved',
          provider: 'Maxar',
          provider_response_id: 'MAXAR-task-123',
          provider_message: 'Maxar EO task queued (CUI task accepted)',
        })
      }
      if (String(url).endsWith('/tasks')) return jsonResponse([])
      if (String(url).endsWith('/audit/verify')) return jsonResponse({ valid: true, records_checked: 1 })
      return jsonResponse({})
    })

    render(<App />)
    fireEvent.click(screen.getByText('Sign in'))
    await waitFor(() => expect(screen.getByText('New Collection Request')).toBeInTheDocument())

    fireEvent.click(screen.getByText('Submit Task'))

    await waitFor(() => expect(screen.getByText('Task submitted and approved')).toBeInTheDocument())
    expect(screen.getByText(/Maxar EO task queued/)).toBeInTheDocument()
  })

  it('shows a structured policy rejection notification', async () => {
    global.fetch.mockImplementation((url, options) => {
      if (String(url).endsWith('/auth/login')) {
        return jsonResponse({ token: 'test-token', role: 'MissionOperator' })
      }
      if (String(url).endsWith('/tasks') && options?.method === 'POST') {
        return jsonResponse(
          {
            task_id: 'task-999',
            status: 'Rejected',
            policy_decision: 'Rejected',
            provider: 'Maxar',
            provider_response_id: 'MAXAR-task-999',
            provider_message: 'Only ISRApprover or Admin may submit SECRET_IL6 tasks',
          },
          400,
        )
      }
      if (String(url).endsWith('/tasks')) return jsonResponse([])
      if (String(url).endsWith('/audit/verify')) return jsonResponse({ valid: true, records_checked: 1 })
      return jsonResponse({})
    })

    render(<App />)
    fireEvent.click(screen.getByText('Sign in'))
    await waitFor(() => expect(screen.getByText('New Collection Request')).toBeInTheDocument())

    fireEvent.click(screen.getByText('Submit Task'))

    await waitFor(() => expect(screen.getByText('Task rejected by policy')).toBeInTheDocument())
    expect(screen.getAllByText(/Only ISRApprover or Admin may submit SECRET_IL6/).length).toBeGreaterThan(0)
  })

  it('runs audit verification and reports an invalid chain', async () => {
    global.fetch.mockImplementation((url) => {
      if (String(url).endsWith('/auth/login')) {
        return jsonResponse({ token: 'test-token', role: 'Admin' })
      }
      if (String(url).endsWith('/tasks')) return jsonResponse([])
      if (String(url).endsWith('/audit/verify')) return jsonResponse({ valid: false, records_checked: 3 })
      return jsonResponse({})
    })

    render(<App />)
    fireEvent.click(screen.getByText('Sign in'))
    await waitFor(() => expect(screen.getByText('New Collection Request')).toBeInTheDocument())

    fireEvent.click(screen.getByText('Verify Audit Chain'))

    await waitFor(() => expect(screen.getByText(/Invalid — integrity failure detected/)).toBeInTheDocument())
  })
})
