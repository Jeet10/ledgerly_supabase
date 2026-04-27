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

export default function Home() {
  const [transactions, setTransactions] = useState([])
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [transactionDate, setTransactionDate] = useState(toDateTimeLocalValue())
  const [filterStartDate, setFilterStartDate] = useState('')
  const [filterEndDate, setFilterEndDate] = useState('')
  const [filterNote, setFilterNote] = useState('')
  const [selectedName, setSelectedName] = useState('')
  const [names, setNames] = useState([])
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [showNamesModal, setShowNamesModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    loadTransactions()
  }, [filterStartDate, filterEndDate, filterNote])

  const loadData = async () => {
    setLoading(true)
    await Promise.all([loadTransactions(), loadNames()])
    setLoading(false)
  }

  const handleError = message => {
    setError(message)
    setTimeout(() => setError(''), 4500)
  }

  const loadTransactions = async () => {
    setLoading(true)
    let query = supabase
      .from('transactions')
      .select('id,amount,type,note,transaction_date,created_at,entered_by')
      .order('transaction_date', { ascending: false })

    if (filterStartDate || filterEndDate) {
      if (filterStartDate) {
        const startDate = new Date(filterStartDate)
        startDate.setHours(0, 0, 0, 0)
        query = query.gte('transaction_date', startDate.toISOString())
      }
      if (filterEndDate) {
        const endDate = new Date(filterEndDate)
        endDate.setHours(23, 59, 59, 999)
        query = query.lte('transaction_date', endDate.toISOString())
      }
    }

    if (filterNote) {
      query = query.ilike('note', `%${filterNote}%`)
    }

    const { data, error } = await query

    if (error) {
      handleError('Unable to load transactions. Check your Supabase setup.')
      setTransactions([])
    } else {
      setTransactions((data || []).map(tx => ({
        ...tx,
        amount: Number(tx.amount || 0),
      })))
    }

    setLoading(false)
  }

  const loadNames = async () => {
    const { data, error } = await supabase
      .from('names')
      .select('id,name')
      .order('name')

    if (error) {
      console.error('Error loading names:', error)
    } else {
      setNames(data || [])
      if (data && data.length > 0 && !selectedName) {
        setSelectedName(data[0].id)
      }
    }
  }

  const addName = async () => {
    if (!newName.trim()) {
      handleError('Name cannot be empty.')
      return
    }

    const { error } = await supabase
      .from('names')
      .insert([{ name: newName.trim() }])

    if (error) {
      handleError('Unable to add name.')
      return
    }

    setNewName('')
    loadNames()
  }

  const deleteName = async (id, name) => {
    // Check if name is being used in transactions
    const { data: transactionsUsingName } = await supabase
      .from('transactions')
      .select('id')
      .eq('entered_by', id)
      .limit(1)

    if (transactionsUsingName && transactionsUsingName.length > 0) {
      handleError(`Cannot delete "${name}" because it has associated transactions.`)
      return
    }

    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return
    }

    const { error } = await supabase
      .from('names')
      .delete()
      .eq('id', id)

    if (error) {
      handleError('Unable to delete name.')
      return
    }

    loadNames()
    // If the deleted name was selected, clear the selection
    if (selectedName === id) {
      setSelectedName('')
    }
  }

  const addTransaction = async (transactionType) => {
    if (!selectedName) {
      handleError('Please select who is entering this transaction.')
      return
    }

    const value = Number(amount)
    if (!value || value <= 0) {
      handleError('Enter a valid amount.')
      return
    }

    const { error } = await supabase
      .from('transactions')
      .insert([{ 
        amount: value, 
        type: transactionType, 
        note: note.trim(),
        transaction_date: transactionDate,
        entered_by: selectedName
      }])

    if (error) {
      handleError('Unable to save transaction.')
      return
    }

    setAmount('')
    setNote('')
    loadTransactions()
  }

  const deleteTransaction = async (id) => {
    if (!confirm('Are you sure you want to delete this transaction?')) {
      return
    }

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)

    if (error) {
      handleError('Unable to delete transaction.')
      return
    }

    loadTransactions()
  }

  const updateTransaction = async () => {
    if (!editingTransaction) return

    const value = Number(editingTransaction.amount)
    if (!value || value <= 0) {
      handleError('Enter a valid amount.')
      return
    }

    const { error } = await supabase
      .from('transactions')
      .update({
        amount: value,
        type: editingTransaction.type,
        note: editingTransaction.note.trim(),
        transaction_date: editingTransaction.transaction_date,
        entered_by: editingTransaction.entered_by
      })
      .eq('id', editingTransaction.id)

    if (error) {
      handleError('Unable to update transaction.')
      return
    }

    setEditingTransaction(null)
    loadTransactions()
  }

  const summary = useMemo(() => {
    const allTransactions = transactions.filter(tx => !filterStartDate && !filterEndDate && !filterNote)

    const totalIn = allTransactions
      .filter(tx => tx.type === 'in')
      .reduce((sum, tx) => sum + tx.amount, 0)

    const totalOut = allTransactions
      .filter(tx => tx.type === 'out')
      .reduce((sum, tx) => sum + tx.amount, 0)

    const currentBalance = totalIn - totalOut

    // Calculate opening balance (balance before filtered transactions)
    let openingBalance = 0
    if (filterStartDate) {
      // Get all transactions before the start date
      const startDateTime = new Date(filterStartDate)
      startDateTime.setHours(0, 0, 0, 0)
      const beforeFilter = allTransactions.filter(tx => new Date(tx.transaction_date) < startDateTime)
      const beforeIn = beforeFilter.filter(tx => tx.type === 'in').reduce((sum, tx) => sum + tx.amount, 0)
      const beforeOut = beforeFilter.filter(tx => tx.type === 'out').reduce((sum, tx) => sum + tx.amount, 0)
      openingBalance = beforeIn - beforeOut
    }

    return {
      totalIn,
      totalOut,
      currentBalance,
      openingBalance,
      transactionCount: transactions.length,
    }
  }, [transactions, filterStartDate, filterEndDate, filterNote])

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

  return (
    <main className="main-shell">
      <div className="container">
        <header className="brand-row">
          <div className="brand">
            <h1>Ledgerly</h1>
            <p>Track cash in/out transactions with notes, dates, and timestamps.</p>
          </div>
          <div className="header-actions">
            <button className="secondary" onClick={() => setShowNamesModal(true)}>
              Manage names
            </button>
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
            <span className="badge">{summary.transactionCount} transactions</span>
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
                  <label htmlFor="transaction-date">Date & Time</label>
                <div className="date-time-input-wrapper">
                  <input
                    id="transaction-date"
                    type="datetime-local"
                    value={transactionDate}
                    onChange={event => setTransactionDate(event.target.value)}
                  />
                  <button
                    type="button"
                    className="date-time-picker-btn"
                    aria-label="Pick date and time"
                  >
                    📅
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Entered by</label>
                {names.length === 0 ? (
                  <p className="muted">Add names from the Manage names panel.</p>
                ) : (
                  <div className="chip-list">
                    {names.map(name => (
                      <button
                        key={name.id}
                        className={selectedName === name.id ? 'name-pill active' : 'name-pill'}
                        onClick={() => setSelectedName(selectedName === name.id ? '' : name.id)}
                      >
                        {name.name}
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
                  <button className="cash-in" onClick={() => addTransaction('in')}>
                    Cash In
                  </button>
                  <button className="cash-out" onClick={() => addTransaction('out')}>
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
              ) : transactions.length === 0 ? (
                <p className="muted">
                  {filterStartDate || filterEndDate || filterNote
                    ? `No transactions found${filterStartDate || filterEndDate ? ` between ${filterStartDate ? new Date(filterStartDate).toLocaleDateString('en-IN') : 'start'} and ${filterEndDate ? new Date(filterEndDate).toLocaleDateString('en-IN') : 'end'}` : ''}${filterNote ? ` matching "${filterNote}"` : ''}.`
                    : 'No cash movements yet. Add cash in or cash out to get started.'
                  }
                </p>
              ) : (
                <div className="table-wrapper">
                  <div className="table-head">
                    <span>Type</span>
                    <span>Amount</span>
                    <span>Note</span>
                    <span>Entered by</span>
                    <span>Date & Time</span>
                    <span>Actions</span>
                  </div>
                  <div className="table-body">
                    {transactions.map(tx => (
                      <div key={tx.id} className="table-row">
                        <span>
                          <span className={`tag ${tx.type === 'in' ? 'credit' : 'debit'}`}>
                            {tx.type === 'in' ? 'Cash in' : 'Cash out'}
                          </span>
                        </span>
                        <span>{formatMoney(tx.amount)}</span>
                        <span>{tx.note || '—'}</span>
                        <span>{names.find(n => n.id === tx.entered_by)?.name || 'Unknown'}</span>
                        <span>{tx.transaction_date ? new Date(tx.transaction_date).toLocaleString('en-IN', {
                          dateStyle: 'short',
                          timeStyle: 'short'
                        }) : formatDate(tx.created_at)}</span>
                        <span className="action-cell">
                          <button 
                            className="secondary" 
                            onClick={() => setEditingTransaction(tx)}
                            style={{ fontSize: '12px', padding: '4px 8px' }}
                          >
                            Edit
                          </button>
                          <button 
                            className="danger" 
                            onClick={() => deleteTransaction(tx.id)}
                            style={{ fontSize: '12px', padding: '4px 8px' }}
                          >
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
              <h2>Edit Transaction</h2>
              
              <div className="form-group">
                <label htmlFor="edit-amount">Amount</label>
                <input
                  id="edit-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={editingTransaction.amount}
                  onChange={event => setEditingTransaction({...editingTransaction, amount: event.target.value})}
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-transaction-date">Date & Time</label>
                <input
                  id="edit-transaction-date"
                  type="datetime-local"
                  value={toDateTimeLocalValue(editingTransaction.transaction_date)}
                  onChange={event => setEditingTransaction({...editingTransaction, transaction_date: event.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Entered by</label>
                {names.length === 0 ? (
                  <p className="muted">No names available.</p>
                ) : (
                  <div className="chip-list">
                    {names.map(name => (
                      <button
                        key={name.id}
                        className={editingTransaction.entered_by === name.id ? 'name-pill active' : 'name-pill'}
                        onClick={() => setEditingTransaction({...editingTransaction, entered_by: editingTransaction.entered_by === name.id ? null : name.id})}
                      >
                        {name.name}
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
                  onChange={event => setEditingTransaction({...editingTransaction, note: event.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Type</label>
                <div className="button-group">
                  <button 
                    className={editingTransaction.type === 'in' ? 'cash-in' : 'secondary'}
                    onClick={() => setEditingTransaction({...editingTransaction, type: 'in'})}
                    style={{ flex: 1 }}
                  >
                    Cash In
                  </button>
                  <button 
                    className={editingTransaction.type === 'out' ? 'cash-out' : 'secondary'}
                    onClick={() => setEditingTransaction({...editingTransaction, type: 'out'})}
                    style={{ flex: 1 }}
                  >
                    Cash Out
                  </button>
                </div>
              </div>

              <div className="button-group" style={{ marginTop: '24px' }}>
                <button className="primary" onClick={updateTransaction}>
                  Update Transaction
                </button>
                <button className="secondary" onClick={() => setEditingTransaction(null)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {showNamesModal && (
          <div className="modal-overlay">
            <div className="edit-modal card names-modal">
              <div className="modal-header">
                <h2>Manage names</h2>
                <button className="secondary" onClick={() => setShowNamesModal(false)}>
                  Close
                </button>
              </div>

              <div className="form-group">
                <label htmlFor="new-name-modal">Add new person</label>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <input
                    id="new-name-modal"
                    type="text"
                    placeholder="Enter name"
                    value={newName}
                    onChange={event => setNewName(event.target.value)}
                    style={{ flex: 1, minWidth: '220px' }}
                  />
                  <button className="primary" onClick={addName}>
                    Add name
                  </button>
                </div>
              </div>

              <div className="form-group">
                <h3 style={{ margin: 0, color: 'var(--muted)' }}>Available names</h3>
              </div>
              {names.length === 0 ? (
                <p className="muted">No names yet. Add one to start tracking entries.</p>
              ) : (
                <div className="chip-list" style={{ marginTop: '12px' }}>
                  {names.map(name => (
                    <div key={name.id} className="chip-item">
                      <span className="badge">{name.name}</span>
                      <button 
                        className="danger" 
                        onClick={() => deleteName(name.id, name.name)}
                        style={{ fontSize: '10px', padding: '2px 6px', minWidth: 'auto' }}
                        title={`Delete ${name.name}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <footer>Built with Next.js and Supabase — manage cash flow simply.</footer>
      </div>
    </main>
  )
}
