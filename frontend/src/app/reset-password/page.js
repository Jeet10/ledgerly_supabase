'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import BrandLogo from '../BrandLogo'
import ThemeToggle from '../../features/ledger/components/ThemeToggle'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'dark'
    const savedTheme = window.localStorage.getItem('growhigh-theme') || window.localStorage.getItem('ledgerly-theme')
    return savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : 'dark'
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('Email is required.')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/update-password`,
    })

    setLoading(false)

    if (resetError) {
      setError(resetError.message)
    } else {
      setMessage('Password reset instructions have been sent to your email address.')
      setEmail('')
    }
  }

  const toggleTheme = () => setTheme(currentTheme => (currentTheme === 'dark' ? 'light' : 'dark'))

  return (
    <main className="main-shell">
      <div className="container auth-shell">
        <section className="card auth-card">
          <div className="auth-copy">
            <div className="top-bar-inline">
              <span className="badge">Password Reset</span>
            </div>
            <div className="brand-title-row">
              <BrandLogo />
              <ThemeToggle theme={theme} onToggle={toggleTheme} />
            </div>
            <p>
              Enter your email address and we'll send you instructions to reset your password.
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

          {message && (
            <div className="success-toast auth-toast" role="status" aria-live="polite">
              <span className="success-dot">✓</span>
              <span>{message}</span>
              <button type="button" onClick={() => setMessage('')} aria-label="Dismiss message">
                x
              </button>
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="owner@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <button className="primary" type="submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send reset instructions'}
            </button>

            <div className="auth-footer">
              <a href="/" className="auth-link">
                Back to sign in
              </a>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}