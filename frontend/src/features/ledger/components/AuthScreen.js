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
  signInWithGoogle,
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
            {authMode === 'sign-in' && (
              <button className="google-signin-btn" type="button" onClick={signInWithGoogle}>
                <span className="google-signin-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path
                      fill="#EA4335"
                      d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.8-6-6.2s2.7-6.2 6-6.2c1.9 0 3.2.8 3.9 1.5l2.7-2.7C17 2.8 14.7 2 12 2 6.9 2 2.8 6.3 2.8 11.8S6.9 21.6 12 21.6c6.9 0 9.2-4.9 9.2-7.4 0-.5 0-.9-.1-1.3H12z"
                    />
                    <path
                      fill="#34A853"
                      d="M3.8 7.3l3.2 2.3c.9-1.8 2.8-3 5-3 1.9 0 3.2.8 3.9 1.5l2.7-2.7C17 2.8 14.7 2 12 2 8.3 2 5.1 4.1 3.8 7.3z"
                    />
                    <path
                      fill="#4A90E2"
                      d="M12 21.6c2.5 0 4.7-.8 6.3-2.2l-2.9-2.4c-.8.6-1.9 1-3.4 1-2.9 0-5.2-1.9-6.1-4.5l-3.3 2.6C3.9 19 7.6 21.6 12 21.6z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.9 13.5c-.2-.6-.3-1.2-.3-1.8s.1-1.3.3-1.8L2.6 7.3C2 8.7 1.7 10.2 1.7 11.8S2 14.9 2.6 16.3l3.3-2.8z"
                    />
                  </svg>
                </span>
                <span>Continue with Google</span>
              </button>
            )}
          </form>
        </section>
      </div>
    </main>
  )
}
