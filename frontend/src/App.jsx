import { useMemo, useState } from 'react'
import './App.css'

const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

const defaultTask = {
  target_latitude: '36.7',
  target_longitude: '-122.2',
  area_of_interest_name: 'Pacific Maritime Corridor',
  mission_priority: 'High',
  sensor_type: 'SAR',
  requested_time_window: '2026-07-07T12:00:00Z/2026-07-07T18:00:00Z',
  classification_level: 'CUI_IL5',
  commercial_provider_preference: 'Maxar',
  mission_justification: 'Support representative naval monitoring operations',
}

function App() {
  const [credentials, setCredentials] = useState({ username: 'mission_operator', password: 'demo-password' })
  const [taskForm, setTaskForm] = useState(defaultTask)
  const [token, setToken] = useState('')
  const [role, setRole] = useState('')
  const [tasks, setTasks] = useState([])
  const [audit, setAudit] = useState(null)
  const [message, setMessage] = useState('')

  const canApprove = useMemo(() => ['ISRApprover', 'Admin', 'SecurityOfficer'].includes(role), [role])

  const request = async (path, options = {}) => {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
    if (token) headers.Authorization = ['Bearer', token].join(' ')
    const res = await fetch(`${apiBase}${path}`, { ...options, headers })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || JSON.stringify(data) || `HTTP ${res.status}`)
    return data
  }

  const login = async () => {
    try {
      const data = await request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) })
      setToken(data.token)
      setRole(data.role)
      setMessage(`Logged in as ${data.role}`)
    } catch (err) {
      setMessage(`Login failed: ${err.message}`)
    }
  }

  const submitTask = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...taskForm,
        target_latitude: Number(taskForm.target_latitude),
        target_longitude: Number(taskForm.target_longitude),
      }
      const data = await request('/tasks', { method: 'POST', body: JSON.stringify(payload) })
      setMessage(`Task ${data.task_id} processed as ${data.policy_decision}`)
      await refreshTasks()
      await verifyAudit()
    } catch (err) {
      setMessage(`Submit failed: ${err.message}`)
    }
  }

  const refreshTasks = async () => {
    try {
      const data = await request('/tasks')
      setTasks(data)
    } catch (err) {
      setMessage(`Load tasks failed: ${err.message}`)
    }
  }

  const verifyAudit = async () => {
    try {
      const data = await request('/audit/verify')
      setAudit(data)
    } catch (err) {
      setMessage(`Audit verify failed: ${err.message}`)
    }
  }

  const actOnTask = async (taskId, action) => {
    try {
      await request(`/tasks/${taskId}/action`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      })
      setMessage(`Task ${taskId} ${action}d`)
      await refreshTasks()
      await verifyAudit()
    } catch (err) {
      setMessage(`Action failed: ${err.message}`)
    }
  }

  return (
    <main className="container">
      <h1>AstroTask Secure Gateway Dashboard</h1>
      <p className="subtitle">Simulated secure commercial satellite tasking workflow</p>

      <section className="panel">
        <h2>Login</h2>
        <div className="row">
          <input value={credentials.username} onChange={(e) => setCredentials((s) => ({ ...s, username: e.target.value }))} placeholder="username" />
          <input type="password" value={credentials.password} onChange={(e) => setCredentials((s) => ({ ...s, password: e.target.value }))} placeholder="password" />
          <button onClick={login}>Login</button>
          <button onClick={refreshTasks} disabled={!token}>Refresh Tasks</button>
          <button onClick={verifyAudit} disabled={!token}>Verify Audit</button>
        </div>
      </section>

      <section className="panel">
        <h2>Create Task Request</h2>
        <form className="grid" onSubmit={submitTask}>
          {Object.entries(taskForm).map(([key, value]) => (
            <label key={key}>
              <span>{key}</span>
              {['sensor_type', 'classification_level', 'commercial_provider_preference'].includes(key) ? (
                <select value={value} onChange={(e) => setTaskForm((s) => ({ ...s, [key]: e.target.value }))}>
                  {key === 'sensor_type' && ['EO', 'SAR', 'RF'].map((v) => <option key={v}>{v}</option>)}
                  {key === 'classification_level' && ['CUI_IL5', 'SECRET_IL6'].map((v) => <option key={v}>{v}</option>)}
                  {key === 'commercial_provider_preference' && ['Maxar', 'Planet', 'BlackSky', 'Umbra', 'ICEYE'].map((v) => <option key={v}>{v}</option>)}
                </select>
              ) : (
                <input value={value} onChange={(e) => setTaskForm((s) => ({ ...s, [key]: e.target.value }))} />
              )}
            </label>
          ))}
          <button type="submit" disabled={!token}>Submit Task</button>
        </form>
      </section>

      <section className="panel">
        <h2>Mission Tasks</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Status</th>
              <th>Decision</th>
              <th>Provider</th>
              <th>Audit</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.task_id}>
                <td>{task.task_id.slice(0, 8)}</td>
                <td>{task.status}</td>
                <td>{task.policy_decision}</td>
                <td>{task.provider}</td>
                <td>{task.audit_status}</td>
                <td>
                  {canApprove && (
                    <>
                      <button onClick={() => actOnTask(task.task_id, 'approve')}>Approve</button>
                      <button onClick={() => actOnTask(task.task_id, 'deny')}>Deny</button>
                      <button onClick={() => actOnTask(task.task_id, 'flag')}>Flag</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="panel">
        <h2>Audit Status</h2>
        <p>{audit ? `Valid: ${String(audit.valid)} | Records: ${audit.records_checked}` : 'Not checked yet'}</p>
      </section>

      <p className="message">{message}</p>
    </main>
  )
}

export default App
