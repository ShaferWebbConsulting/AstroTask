export default function Header({ role, gatewayOnline, onLogout }) {
  return (
    <header className="app-header">
      <div className="app-header__brand">
        <span className="app-header__title">AstroTask</span>
        <span className="app-header__subtitle">Secure Gateway — Mission Operations</span>
      </div>
      <div className="app-header__status">
        <span className="badge badge--env">Phase I Demonstration</span>
        <span className={`badge badge--${gatewayOnline ? 'success' : 'neutral'}`}>
          <span className="badge__dot" aria-hidden="true" />
          Gateway {gatewayOnline ? 'Online' : 'Awaiting login'}
        </span>
        {role && (
          <span className="app-header__identity">
            <span className="app-header__identity-label">Signed in as</span>
            <span className="app-header__identity-role">{role}</span>
            {onLogout && (
              <button type="button" className="link-button" onClick={onLogout}>
                Sign out
              </button>
            )}
          </span>
        )}
      </div>
    </header>
  )
}
