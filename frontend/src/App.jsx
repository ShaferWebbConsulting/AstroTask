import { useMemo, useState } from 'react'
import './App.css'
import { createApiClient, ApiError } from './api/client.js'
import AppShell from './components/AppShell.jsx'
import LoginPanel from './components/LoginPanel.jsx'
import MetricsRow from './components/MetricsRow.jsx'
import SecurityPostureCard from './components/SecurityPostureCard.jsx'
import ProviderHealthPanel from './components/ProviderHealthPanel.jsx'
import ArchitectureFlow from './components/ArchitectureFlow.jsx'
import TaskRequestForm from './components/TaskRequestForm.jsx'
import TaskTable from './components/TaskTable.jsx'
import TaskDetailDrawer from './components/TaskDetailDrawer.jsx'
import AuditPanel from './components/AuditPanel.jsx'
import Alert, { alertFromError, alertFromSubmission } from './components/Alert.jsx'

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
  const [taskDetails, setTaskDetails] = useState({}) // task_id -> real data captured at submission time
  const [audit, setAudit] = useState(null)
  const [auditVerifiedAt, setAuditVerifiedAt] = useState(null)

  const [loggingIn, setLoggingIn] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [verifyingAudit, setVerifyingAudit] = useState(false)
  const [actingTaskId, setActingTaskId] = useState('')
  const [tasksError, setTasksError] = useState('')
  const [auditError, setAuditError] = useState('')

  const [alertState, setAlertState] = useState(null)
  const [selectedTaskId, setSelectedTaskId] = useState('')

  const api = useMemo(() => createApiClient({ getToken: () => token }), [token])

  const canApprove = useMemo(() => ['ISRApprover', 'Admin', 'SecurityOfficer'].includes(role), [role])

  const login = async () => {
    setLoggingIn(true)
    setAlertState(null)
    try {
      const data = await api.login(credentials)
      setToken(data.token)
      setRole(data.role)
      setAlertState({ tone: 'success', title: 'Signed in', message: `Authenticated as ${data.role}.` })
    } catch (err) {
      setAlertState(alertFromError(err))
    } finally {
      setLoggingIn(false)
    }
  }

  const logout = () => {
    setToken('')
    setRole('')
    setTasks([])
    setAudit(null)
    setAlertState(null)
  }

  const refreshTasks = async () => {
    setLoadingTasks(true)
    setTasksError('')
    try {
      const data = await api.listTasks()
      setTasks(data)
    } catch (err) {
      setTasksError(err.message)
    } finally {
      setLoadingTasks(false)
    }
  }

  const verifyAudit = async () => {
    setVerifyingAudit(true)
    setAuditError('')
    try {
      const data = await api.verifyAudit()
      setAudit(data)
      setAuditVerifiedAt(new Date().toISOString())
    } catch (err) {
      setAuditError(err.message)
    } finally {
      setVerifyingAudit(false)
    }
  }

  const submitTask = async () => {
    setSubmitting(true)
    setAlertState(null)
    try {
      const payload = {
        ...taskForm,
        target_latitude: Number(taskForm.target_latitude),
        target_longitude: Number(taskForm.target_longitude),
      }
      const data = await api.submitTask(payload)
      // Merge the real submitted payload with the real backend response so the detail drawer
      // can show full context without inventing simulated values for this task.
      setTaskDetails((prev) => ({ ...prev, [data.task_id]: { ...payload, ...data } }))
      setAlertState(alertFromSubmission(data))
      await refreshTasks()
      await verifyAudit()
    } catch (err) {
      if (err instanceof ApiError && err.body?.task_id) {
        setTaskDetails((prev) => ({ ...prev, [err.body.task_id]: { ...taskForm, ...err.body } }))
      }
      setAlertState(alertFromError(err))
    } finally {
      setSubmitting(false)
    }
  }

  const actOnTask = async (taskId, action) => {
    setActingTaskId(taskId)
    setAlertState(null)
    try {
      const data = await api.actOnTask(taskId, action)
      setTaskDetails((prev) => ({ ...prev, [taskId]: { ...prev[taskId], ...data } }))
      setAlertState({ tone: 'success', title: 'Task updated', message: `Task ${data.task_id} ${action}d.` })
      await refreshTasks()
      await verifyAudit()
    } catch (err) {
      setAlertState(alertFromError(err))
    } finally {
      setActingTaskId('')
    }
  }

  const selectedTask = tasks.find((t) => t.task_id === selectedTaskId)
  const activeProvider = selectedTask?.provider

  return (
    <AppShell role={role} gatewayOnline={Boolean(token)} onLogout={token ? logout : undefined}>
      {alertState && <Alert {...alertState} onDismiss={() => setAlertState(null)} />}

      {!token && (
        <LoginPanel credentials={credentials} onChange={setCredentials} onLogin={login} loading={loggingIn} />
      )}

      {token && (
        <>
          <MetricsRow tasks={tasks} audit={audit} />

          <div className="layout-grid">
            <SecurityPostureCard
              role={role}
              authenticated={Boolean(token)}
              auditVerifiedAt={auditVerifiedAt}
              auditValid={audit?.valid}
            />
            <ProviderHealthPanel tasks={tasks} />
          </div>

          <ArchitectureFlow activeProvider={activeProvider} />

          <div className="layout-grid layout-grid--form-table">
            <TaskRequestForm
              form={taskForm}
              onChange={setTaskForm}
              onSubmit={submitTask}
              submitting={submitting}
              disabled={!token}
              role={role}
            />
            <div className="stack">
              <div className="panel__actions-row">
                <button type="button" className="button button--secondary" onClick={refreshTasks} disabled={loadingTasks}>
                  {loadingTasks ? 'Refreshing…' : 'Refresh Tasks'}
                </button>
              </div>
              <TaskTable
                tasks={tasks}
                taskDetails={taskDetails}
                loading={loadingTasks}
                error={tasksError}
                onSelectTask={setSelectedTaskId}
                selectedTaskId={selectedTaskId}
                canApprove={canApprove}
                onAction={actOnTask}
                actingTaskId={actingTaskId}
              />
            </div>
          </div>

          <AuditPanel
            audit={audit}
            loading={verifyingAudit}
            error={auditError}
            onVerify={verifyAudit}
            lastVerifiedAt={auditVerifiedAt}
          />
        </>
      )}

      {selectedTask && (
        <TaskDetailDrawer
          task={selectedTask}
          detail={taskDetails[selectedTask.task_id]}
          onClose={() => setSelectedTaskId('')}
          onAction={actOnTask}
          canApprove={canApprove}
          acting={actingTaskId === selectedTask.task_id}
        />
      )}
    </AppShell>
  )
}

export default App
