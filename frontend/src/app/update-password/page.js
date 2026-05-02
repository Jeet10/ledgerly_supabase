'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'
import BrandLogo from '../BrandLogo'
import ThemeToggle from '../../features/ledger/components/ThemeToggle'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'dark'
    const savedTheme = window.localStorage.getItem('growhigh-theme') || window.localStorage.getItem('ledgerly-theme')
    return savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    window.localStorage.setItem('growhigh-theme', theme)
  }, [theme])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!password) {
      setError('Password is required.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    })

    setLoading(false)

    if (updateError) {
      setError(updateError.message)
    } else {
      setMessage('Password updated successfully! Redirecting to sign in...')
      setPassword('')
      setConfirmPassword('')
      setTimeout(() => {
        router.push('/')
      }, 3000)
    }
  }

  const toggleTheme = () => setTheme(currentTheme => (currentTheme === 'dark' ? 'light' : 'dark'))

  return (
    <main className="main-shell">
      <div className="container auth-shell">
        <section className="card auth-card">
          <div className="auth-copy">
            <div className="top-bar-inline">
              <span className="badge">New Password</span>
            </div>
            <div className="brand-title-row">
              <BrandLogo />
              <ThemeToggle theme={theme} onToggle={toggleTheme} />
            </div>
            <p>
              Enter your new password below.
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
              <label htmlFor="password">New Password</label>
              <input
                id="password"
                type="password"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirm-password">Confirm New Password</label>
              <input
                id="confirm-password"
                type="password"
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <button className="primary" type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update password'}
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