import { useState } from 'react'

export default function LoginPanel({ credentials, onChange, onLogin, loading }) {
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
    onLogin()
  }

  const usernameInvalid = submitted && !credentials.username.trim()

  return (
    <section className="panel login-panel" aria-labelledby="login-heading">
      <h2 id="login-heading">Operator Login</h2>
      <p className="panel__description">Authenticate to access mission tasking and audit functions.</p>
      <form className="form-row" onSubmit={handleSubmit} noValidate>
        <label className="field">
          <span className="field__label">Username</span>
          <input
            value={credentials.username}
            onChange={(e) => onChange({ ...credentials, username: e.target.value })}
            placeholder="mission_operator"
            aria-invalid={usernameInvalid}
            autoComplete="username"
          />
          {usernameInvalid && <span className="field__error">Username is required.</span>}
        </label>
        <label className="field">
          <span className="field__label">Password</span>
          <input
            type="password"
            value={credentials.password}
            onChange={(e) => onChange({ ...credentials, password: e.target.value })}
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </label>
        <button type="submit" className="button button--primary" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </section>
  )
}
