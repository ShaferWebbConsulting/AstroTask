import Header from './Header.jsx'

export default function AppShell({ role, gatewayOnline, onLogout, children }) {
  return (
    <div className="app-shell">
      <Header role={role} gatewayOnline={gatewayOnline} onLogout={onLogout} />
      <main className="app-shell__content">{children}</main>
    </div>
  )
}
