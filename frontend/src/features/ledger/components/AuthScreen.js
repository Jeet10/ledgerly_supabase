import BrandLogo from '../../../app/BrandLogo'
import ThemeToggle from './ThemeToggle'

export default function AuthScreen({
  theme,
  toggleTheme,
  error,
  setError,
  authMode,
  setAuthMode,
  submitAuth,
  orgName,
  setOrgName,
  email,
  setEmail,
  password,
  setPassword,
  authSubmitting,
}) {
  return (
    <main className="main-shell">
      <div className="container auth-shell">
        <section className="card auth-card">
          <div className="auth-copy">
            <div className="top-bar-inline">
              <span className="badge">Organization login</span>
            </div>
            <div className="brand-title-row">
              <BrandLogo />
              <ThemeToggle theme={theme} onToggle={toggleTheme} />
            </div>
            <p>
              Sign in as an organization user to access your own ledger. Members stay inside your workspace and are used
              only for transaction ownership.
            </p>
          </div>

          {error && (
            <div className="error-toast auth-toast" role="status" aria-live="polite">
              <span className="error-dot">!</span>
              <span>{error}</span>
              <button type="button" onClick={() => setError('')} aria-label="Dismiss message">
                x
              </button>
            </div>
          )}

          <form className="auth-form" onSubmit={submitAuth}>
            <div className="auth-switch">
              <button type="button" className={authMode === 'sign-in' ? 'secondary active-tab' : 'secondary'} onClick={() => setAuthMode('sign-in')}>
                Sign in
              </button>
              <button type="button" className={authMode === 'sign-up' ? 'secondary active-tab' : 'secondary'} onClick={() => setAuthMode('sign-up')}>
                Create account
              </button>
            </div>

            {authMode === 'sign-up' && (
              <div className="form-group">
                <label htmlFor="org-name">Organization name</label>
                <input
                  id="org-name"
                  type="text"
                  placeholder="Acme Retail"
                  value={orgName}
                  onChange={event => setOrgName(event.target.value)}
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" placeholder="owner@company.com" value={email} onChange={event => setEmail(event.target.value)} />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={event => setPassword(event.target.value)}
              />
            </div>

            <button className="primary" type="submit" disabled={authSubmitting}>
              {authSubmitting ? 'Please wait...' : authMode === 'sign-in' ? 'Sign in' : 'Create organization user'}
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}
