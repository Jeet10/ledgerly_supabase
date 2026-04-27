'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
})

const formatMoney = value => currencyFormatter.format(Number(value) || 0)

const formatDate = value => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not set'
  return date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

const toDateTimeLocalValue = value => {
  const date = value ? new Date(value) : new Date()
  if (Number.isNaN(date.getTime())) return ''
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return localDate.toISOString().slice(0, 16)
}

const getOrgLabel = user => user?.user_metadata?.org_name?.trim() || user?.email || 'Your organization'
const themeIcon = theme =>
  theme === 'dark' ? (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3.75a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V4.5a.75.75 0 0 1 .75-.75Zm0 12a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Zm8.25-4.5a.75.75 0 0 1 0 1.5h-1.5a.75.75 0 0 1 0-1.5h1.5ZM6.75 12a.75.75 0 0 1-.75.75H4.5a.75.75 0 0 1 0-1.5H6a.75.75 0 0 1 .75.75Zm10.553 5.053a.75.75 0 0 1 1.06 1.06l-1.06 1.061a.75.75 0 1 1-1.06-1.06l1.06-1.061ZM7.758 7.758a.75.75 0 0 1 0 1.06L6.697 9.879a.75.75 0 0 1-1.06-1.06l1.06-1.061a.75.75 0 0 1 1.061 0Zm10.605 2.121a.75.75 0 0 1-1.06 0l-1.06-1.06a.75.75 0 1 1 1.06-1.061l1.06 1.06a.75.75 0 0 1 0 1.061ZM7.758 16.242a.75.75 0 0 1-1.06 0l-1.061-1.06a.75.75 0 0 1 1.06-1.061l1.06 1.06a.75.75 0 0 1 0 1.061ZM12 18a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 12 18Z"
        fill="currentColor"
      />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M14.53 3.53a.75.75 0 0 1 .83.97A8.25 8.25 0 1 0 19.5 14.64a.75.75 0 0 1 .97.83A9.75 9.75 0 1 1 14.53 3.53Z"
        fill="currentColor"
      />
    </svg>
  )

export default function Home() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'dark'

    const savedTheme = window.localStorage.getItem('ledgerly-theme')
    return savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : 'dark'
  })
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [allTransactions, setAllTransactions] = useState([])
  const [members, setMembers] = useState([])
  const [selectedMemberName, setSelectedMemberName] = useState('')
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [showMembersModal, setShowMembersModal] = useState(false)

  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [transactionDate, setTransactionDate] = useState(toDateTimeLocalValue())

  const [filterStartDate, setFilterStartDate] = useState('')
  const [filterEndDate, setFilterEndDate] = useState('')
  const [filterNote, setFilterNote] = useState('')

  const [newMember, setNewMember] = useState('')

  const [authMode, setAuthMode] = useState('sign-in')
  const [orgName, setOrgName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authSubmitting, setAuthSubmitting] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    window.localStorage.setItem('ledgerly-theme', theme)
  }, [theme])

  useEffect(() => {
    let mounted = true

    const bootstrap = async () => {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession()

      if (mounted) {
        setSession(currentSession)
        setAuthLoading(false)
      }
    }

    bootstrap()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setAuthLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!session?.user?.id) {
      setAllTransactions([])
      setMembers([])
      setSelectedMemberName('')
      return
    }

    loadWorkspace(session.user.id)
  }, [session?.user?.id])

  const handleError = message => {
    setError(message)
    window.clearTimeout(handleError.timeoutId)
    handleError.timeoutId = window.setTimeout(() => setError(''), 4500)
  }

  const loadWorkspace = async userId => {
    setLoading(true)
    await Promise.all([loadTransactions(userId), loadMembers(userId)])
    setLoading(false)
  }

  const loadTransactions = async userId => {
    const { data, error: queryError } = await supabase
      .from('transactions')
      .select('id,amount,type,note,transaction_date,created_at,member_name')
      .eq('owner_id', userId)
      .order('transaction_date', { ascending: false })

    if (queryError) {
      handleError('Unable to load transactions. Check your Supabase tables and policies.')
      setAllTransactions([])
      return
    }

    setAllTransactions(
      (data || []).map(transaction => ({
        ...transaction,
        amount: Number(transaction.amount || 0),
      }))
    )
  }

  const loadMembers = async userId => {
    const { data, error: queryError } = await supabase
      .from('members')
      .select('name')
      .eq('owner_id', userId)
      .order('name')

    if (queryError) {
      handleError('Unable to load members. Check your Supabase tables and policies.')
      setMembers([])
      return
    }

    setMembers(data || [])
    setSelectedMemberName(currentMember => {
      if (!data?.length) return ''
      if (currentMember && data.some(member => member.name === currentMember)) return currentMember
      return data[0].name
    })
  }

  const filteredTransactions = useMemo(() => {
    return allTransactions.filter(transaction => {
      if (filterStartDate) {
        const startDate = new Date(filterStartDate)
        startDate.setHours(0, 0, 0, 0)
        if (new Date(transaction.transaction_date) < startDate) return false
      }

      if (filterEndDate) {
        const endDate = new Date(filterEndDate)
        endDate.setHours(23, 59, 59, 999)
        if (new Date(transaction.transaction_date) > endDate) return false
      }

      if (filterNote) {
        const noteValue = transaction.note?.toLowerCase() || ''
        if (!noteValue.includes(filterNote.toLowerCase())) return false
      }

      return true
    })
  }, [allTransactions, filterEndDate, filterNote, filterStartDate])

  const summary = useMemo(() => {
    const totalIn = allTransactions
      .filter(transaction => transaction.type === 'in')
      .reduce((sum, transaction) => sum + transaction.amount, 0)

    const totalOut = allTransactions
      .filter(transaction => transaction.type === 'out')
      .reduce((sum, transaction) => sum + transaction.amount, 0)

    let openingBalance = 0
    if (filterStartDate) {
      const startDate = new Date(filterStartDate)
      startDate.setHours(0, 0, 0, 0)

      openingBalance = allTransactions.reduce((sum, transaction) => {
        if (new Date(transaction.transaction_date) >= startDate) return sum
        return sum + (transaction.type === 'in' ? transaction.amount : -transaction.amount)
      }, 0)
    }

    return {
      totalIn,
      totalOut,
      currentBalance: totalIn - totalOut,
      openingBalance,
      transactionCount: filteredTransactions.length,
    }
  }, [allTransactions, filterStartDate, filteredTransactions.length])

  const submitAuth = async event => {
    event.preventDefault()

    if (!email.trim() || !password) {
      handleError('Email and password are required.')
      return
    }

    if (authMode === 'sign-up' && !orgName.trim()) {
      handleError('Organization name is required for sign up.')
      return
    }

    setAuthSubmitting(true)

    if (authMode === 'sign-up') {
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            org_name: orgName.trim(),
          },
        },
      })

      setAuthSubmitting(false)

      if (signUpError) {
        handleError(signUpError.message)
        return
      }

      handleError('Account created. If email confirmation is enabled, verify your email before signing in.')
      setAuthMode('sign-in')
      setPassword('')
      return
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    setAuthSubmitting(false)

    if (signInError) {
      handleError(signInError.message)
      return
    }

    setPassword('')
  }

  const signOut = async () => {
    const { error: signOutError } = await supabase.auth.signOut()

    if (signOutError) {
      handleError('Unable to sign out right now.')
    }
  }

  const addMember = async () => {
    if (!session?.user?.id) return

    if (!newMember.trim()) {
      handleError('Member name cannot be empty.')
      return
    }

    const { error: insertError } = await supabase.from('members').insert([
      {
        owner_id: session.user.id,
        name: newMember.trim(),
      },
    ])

    if (insertError) {
      handleError(insertError.message || 'Unable to add member.')
      return
    }

    setNewMember('')
    await loadMembers(session.user.id)
  }

  const deleteMember = async memberName => {
    if (!session?.user?.id) return

    const { data: linkedTransactions, error: queryError } = await supabase
      .from('transactions')
      .select('id')
      .eq('owner_id', session.user.id)
      .eq('member_name', memberName)
      .limit(1)

    if (queryError) {
      handleError('Unable to validate member usage.')
      return
    }

    if (linkedTransactions?.length) {
      handleError(`Cannot delete "${memberName}" because the member has transactions.`)
      return
    }

    if (!window.confirm(`Are you sure you want to delete "${memberName}"?`)) {
      return
    }

    const { error: deleteError } = await supabase
      .from('members')
      .delete()
      .eq('owner_id', session.user.id)
      .eq('name', memberName)

    if (deleteError) {
      handleError(deleteError.message || 'Unable to delete member.')
      return
    }

    await loadMembers(session.user.id)
  }

  const addTransaction = async transactionType => {
    if (!session?.user?.id) return

    if (!selectedMemberName) {
      handleError('Please select a member for this transaction.')
      return
    }

    const value = Number(amount)
    if (!value || value <= 0) {
      handleError('Enter a valid amount.')
      return
    }

    const { error: insertError } = await supabase.from('transactions').insert([
      {
        owner_id: session.user.id,
        amount: value,
        type: transactionType,
        note: note.trim(),
        transaction_date: transactionDate,
        member_name: selectedMemberName,
      },
    ])

    if (insertError) {
      handleError(insertError.message || 'Unable to save transaction.')
      return
    }

    setAmount('')
    setNote('')
    setTransactionDate(toDateTimeLocalValue())
    await loadTransactions(session.user.id)
  }

  const deleteTransaction = async transactionId => {
    if (!session?.user?.id) return

    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return
    }

    const { error: deleteError } = await supabase
      .from('transactions')
      .delete()
      .eq('owner_id', session.user.id)
      .eq('id', transactionId)

    if (deleteError) {
      handleError(deleteError.message || 'Unable to delete transaction.')
      return
    }

    await loadTransactions(session.user.id)
  }

  const updateTransaction = async () => {
    if (!session?.user?.id || !editingTransaction) return

    const value = Number(editingTransaction.amount)
    if (!value || value <= 0) {
      handleError('Enter a valid amount.')
      return
    }

    if (!editingTransaction.member_name) {
      handleError('Select a member before saving this transaction.')
      return
    }

    const { error: updateError } = await supabase
      .from('transactions')
      .update({
        amount: value,
        type: editingTransaction.type,
        note: editingTransaction.note.trim(),
        transaction_date: editingTransaction.transaction_date,
        member_name: editingTransaction.member_name,
      })
      .eq('owner_id', session.user.id)
      .eq('id', editingTransaction.id)

    if (updateError) {
      handleError(updateError.message || 'Unable to update transaction.')
      return
    }

    setEditingTransaction(null)
    await loadTransactions(session.user.id)
  }

  const currentUser = session?.user
  const toggleTheme = () => setTheme(currentTheme => (currentTheme === 'dark' ? 'light' : 'dark'))

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return (
      <main className="main-shell">
        <div className="container">
          <div className="card">
            <h2>Supabase configuration required</h2>
            <p className="alert">
              Add your Supabase project URL and anon key to <code>frontend/.env.local</code> before launching the app.
            </p>
          </div>
        </div>
      </main>
    )
  }

  if (authLoading) {
    return (
      <main className="main-shell">
        <div className="container auth-shell">
          <div className="card auth-card">
            <h1>Ledgerly</h1>
            <p className="muted">Checking your session...</p>
          </div>
        </div>
      </main>
    )
  }

  if (!currentUser) {
    return (
      <main className="main-shell">
        <div className="container auth-shell">
          <section className="card auth-card">
            <div className="auth-copy">
              <div className="top-bar-inline">
                <span className="badge">Organization login</span>
              </div>
              <div className="brand-title-row">
                <h1>Ledgerly</h1>
                <button
                  className="theme-brand-toggle"
                  type="button"
                  onClick={toggleTheme}
                  aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                  title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  <span className="theme-brand-icon">{themeIcon(theme)}</span>
                  <span className="theme-brand-text">{theme === 'dark' ? 'Light' : 'Dark'}</span>
                </button>
              </div>
              <p>
                Sign in as an organization user to access your own ledger. Members stay inside your workspace and are used only for transaction ownership.
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
                <button
                  type="button"
                  className={authMode === 'sign-in' ? 'secondary active-tab' : 'secondary'}
                  onClick={() => setAuthMode('sign-in')}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  className={authMode === 'sign-up' ? 'secondary active-tab' : 'secondary'}
                  onClick={() => setAuthMode('sign-up')}
                >
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
                <input
                  id="email"
                  type="email"
                  placeholder="owner@company.com"
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                />
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

  return (
    <main className="main-shell">
      <div className="container">
        <header className="brand-row">
          <div className="brand">
            <div className="brand-title-row">
              <h1>Ledgerly</h1>
              <button
                className="theme-brand-toggle"
                type="button"
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                <span className="theme-brand-icon">{themeIcon(theme)}</span>
                <span className="theme-brand-text">{theme === 'dark' ? 'Light' : 'Dark'}</span>
              </button>
            </div>
            <p>Manage cash flow for {getOrgLabel(currentUser)}. Members stay scoped to this organization only.</p>
          </div>
          <div className="header-actions header-actions-stack">
            <div className="user-chip">
              <strong>{getOrgLabel(currentUser)}</strong>
              <span>{currentUser.email}</span>
            </div>
            <div className="header-button-row">
              <button className="secondary" onClick={() => setShowMembersModal(true)}>
                Manage members
              </button>
              <button className="secondary" onClick={signOut}>
                Sign out
              </button>
            </div>
          </div>
        </header>

        <div className="stats-grid">
          <div className="card">
            <h2>Opening balance</h2>
            <strong>{formatMoney(summary.openingBalance)}</strong>
            <span className="badge">{filterStartDate ? `Before ${new Date(filterStartDate).toLocaleDateString('en-IN')}` : 'All time'}</span>
          </div>

          <div className="card">
            <h2>Cash balance</h2>
            <strong>{formatMoney(summary.currentBalance)}</strong>
            <span className="badge">{summary.transactionCount} shown</span>
          </div>

          <div className="card">
            <h2>Cash in</h2>
            <strong>{formatMoney(summary.totalIn)}</strong>
            <span className="badge">incoming money</span>
          </div>

          <div className="card">
            <h2>Cash out</h2>
            <strong>{formatMoney(summary.totalOut)}</strong>
            <span className="badge">spent money</span>
          </div>
        </div>

        {error && (
          <div className="error-toast" role="status" aria-live="polite">
            <span className="error-dot">!</span>
            <span>{error}</span>
            <button type="button" onClick={() => setError('')} aria-label="Dismiss message">
              x
            </button>
          </div>
        )}

        <div className="main-layout">
          <div className="left-panel">
            <section className="card entry-card">
              <h2>Record cash flow</h2>
              <div className="entry-grid">
                <div className="form-group">
                  <label htmlFor="amount">Amount</label>
                  <input
                    id="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={event => setAmount(event.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="transaction-date">Date and time</label>
                  <input
                    id="transaction-date"
                    type="datetime-local"
                    value={transactionDate}
                    onChange={event => setTransactionDate(event.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Member</label>
                  {members.length === 0 ? (
                    <p className="muted">Add members from the Manage members panel.</p>
                  ) : (
                    <div className="chip-list">
                      {members.map(member => (
                        <button
                          key={member.name}
                          type="button"
                        className={selectedMemberName === member.name ? 'name-pill active' : 'name-pill'}
                        onClick={() => setSelectedMemberName(selectedMemberName === member.name ? '' : member.name)}
                      >
                        {member.name}
                      </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="note">Note</label>
                  <textarea
                    id="note"
                    rows="2"
                    placeholder="Optional note"
                    value={note}
                    onChange={event => setNote(event.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Type</label>
                  <div className="button-group">
                    <button className="cash-in" type="button" onClick={() => addTransaction('in')}>
                      Cash In
                    </button>
                    <button className="cash-out" type="button" onClick={() => addTransaction('out')}>
                      Cash Out
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="right-panel">
            <section className="card transactions-card">
              <div className="transactions-header">
                <h2>Recent cash flow</h2>
                <div className="filter-bar">
                  <label className="filter-control" htmlFor="filter-start-date">
                    <span>From</span>
                    <input
                      id="filter-start-date"
                      type="date"
                      value={filterStartDate}
                      onChange={event => setFilterStartDate(event.target.value)}
                    />
                  </label>

                  <label className="filter-control" htmlFor="filter-end-date">
                    <span>To</span>
                    <input
                      id="filter-end-date"
                      type="date"
                      value={filterEndDate}
                      onChange={event => setFilterEndDate(event.target.value)}
                    />
                  </label>

                  <label className="filter-control filter-search" htmlFor="filter-note">
                    <span>Remarks</span>
                    <input
                      id="filter-note"
                      type="text"
                      placeholder="Search notes"
                      value={filterNote}
                      onChange={event => setFilterNote(event.target.value)}
                    />
                  </label>

                  {(filterStartDate || filterEndDate || filterNote) && (
                    <button
                      className="secondary compact-button"
                      type="button"
                      onClick={() => {
                        setFilterStartDate('')
                        setFilterEndDate('')
                        setFilterNote('')
                      }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {loading ? (
                <p className="muted">Loading transactions...</p>
              ) : filteredTransactions.length === 0 ? (
                <p className="muted">
                  {filterStartDate || filterEndDate || filterNote
                    ? 'No transactions matched the current filters.'
                    : 'No cash movements yet. Add cash in or cash out to get started.'}
                </p>
              ) : (
                <div className="table-wrapper">
                  <div className="table-head">
                    <span>Type</span>
                    <span>Amount</span>
                    <span>Note</span>
                    <span>Member</span>
                    <span>Date and time</span>
                    <span>Actions</span>
                  </div>
                  <div className="table-body">
                    {filteredTransactions.map(transaction => (
                      <div key={transaction.id} className="table-row">
                        <span>
                          <span className={`tag ${transaction.type === 'in' ? 'credit' : 'debit'}`}>
                            {transaction.type === 'in' ? 'Cash in' : 'Cash out'}
                          </span>
                        </span>
                        <span>{formatMoney(transaction.amount)}</span>
                        <span>{transaction.note || '-'}</span>
                        <span>{transaction.member_name || 'Unknown'}</span>
                        <span>{transaction.transaction_date ? formatDate(transaction.transaction_date) : formatDate(transaction.created_at)}</span>
                        <span className="action-cell">
                          <button className="secondary" type="button" onClick={() => setEditingTransaction(transaction)}>
                            Edit
                          </button>
                          <button className="danger" type="button" onClick={() => deleteTransaction(transaction.id)}>
                            Delete
                          </button>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>

        {editingTransaction && (
          <div className="modal-overlay">
            <div className="edit-modal card">
              <h2>Edit transaction</h2>

              <div className="form-group">
                <label htmlFor="edit-amount">Amount</label>
                <input
                  id="edit-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={editingTransaction.amount}
                  onChange={event => setEditingTransaction({ ...editingTransaction, amount: event.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-transaction-date">Date and time</label>
                <input
                  id="edit-transaction-date"
                  type="datetime-local"
                  value={toDateTimeLocalValue(editingTransaction.transaction_date)}
                  onChange={event => setEditingTransaction({ ...editingTransaction, transaction_date: event.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Member</label>
                {members.length === 0 ? (
                  <p className="muted">No members available.</p>
                ) : (
                  <div className="chip-list">
                    {members.map(member => (
                      <button
                        key={member.name}
                        type="button"
                        className={editingTransaction.member_name === member.name ? 'name-pill active' : 'name-pill'}
                        onClick={() => setEditingTransaction({ ...editingTransaction, member_name: member.name })}
                      >
                        {member.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="edit-note">Note</label>
                <textarea
                  id="edit-note"
                  rows="3"
                  placeholder="Optional note"
                  value={editingTransaction.note || ''}
                  onChange={event => setEditingTransaction({ ...editingTransaction, note: event.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Type</label>
                <div className="button-group">
                  <button
                    className={editingTransaction.type === 'in' ? 'cash-in' : 'secondary'}
                    type="button"
                    onClick={() => setEditingTransaction({ ...editingTransaction, type: 'in' })}
                    style={{ flex: 1 }}
                  >
                    Cash In
                  </button>
                  <button
                    className={editingTransaction.type === 'out' ? 'cash-out' : 'secondary'}
                    type="button"
                    onClick={() => setEditingTransaction({ ...editingTransaction, type: 'out' })}
                    style={{ flex: 1 }}
                  >
                    Cash Out
                  </button>
                </div>
              </div>

              <div className="button-group" style={{ marginTop: '24px' }}>
                <button className="primary" type="button" onClick={updateTransaction}>
                  Update transaction
                </button>
                <button className="secondary" type="button" onClick={() => setEditingTransaction(null)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {showMembersModal && (
          <div className="modal-overlay">
            <div className="edit-modal card names-modal">
              <div className="modal-header">
                <h2>Manage members</h2>
                <button className="secondary" type="button" onClick={() => setShowMembersModal(false)}>
                  Close
                </button>
              </div>

              <div className="form-group">
                <label htmlFor="new-member-modal">Add member</label>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <input
                    id="new-member-modal"
                    type="text"
                    placeholder="Enter member name"
                    value={newMember}
                    onChange={event => setNewMember(event.target.value)}
                    style={{ flex: 1, minWidth: '220px' }}
                  />
                  <button className="primary" type="button" onClick={addMember}>
                    Add member
                  </button>
                </div>
              </div>

              <div className="form-group">
                <h3 style={{ margin: 0, color: 'var(--muted)' }}>Members in this organization</h3>
              </div>
              {members.length === 0 ? (
                <p className="muted">No members yet. Add one to start tracking entries.</p>
              ) : (
                <div className="chip-list" style={{ marginTop: '12px' }}>
                  {members.map(member => (
                    <div key={member.name} className="chip-item">
                      <span className="badge">{member.name}</span>
                      <button
                        className="danger"
                        type="button"
                        onClick={() => deleteMember(member.name)}
                        style={{ fontSize: '10px', padding: '2px 6px', minWidth: 'auto' }}
                        title={`Delete ${member.name}`}
                      >
                        x
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
