'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
})

const formatMoney = value => currencyFormatter.format(Number(value) || 0)
const formatDate = value => new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })

export default function Home() {
  const [transactions, setTransactions] = useState([])
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0, 16))
  const [filterDate, setFilterDate] = useState('')
  const [filterNote, setFilterNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadTransactions()
  }, [filterDate, filterNote])

  const handleError = message => {
    setError(message)
    setTimeout(() => setError(''), 4500)
  }

  const loadTransactions = async () => {
    setLoading(true)
    let query = supabase
      .from('transactions')
      .select('id,amount,type,note,transaction_date,created_at')
      .order('transaction_date', { ascending: false })

    if (filterDate) {
      // Filter by date range (start of day to end of day)
      const startDate = new Date(filterDate)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(filterDate)
      endDate.setHours(23, 59, 59, 999)

      query = query
        .gte('transaction_date', startDate.toISOString())
        .lte('transaction_date', endDate.toISOString())
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

  const addTransaction = async (transactionType) => {
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
        transaction_date: transactionDate 
      }])

    if (error) {
      handleError('Unable to save transaction.')
      return
    }

    setAmount('')
    setNote('')
    loadTransactions()
  }

  const summary = useMemo(() => {
    const allTransactions = transactions.filter(tx => !filterDate || !filterNote)

    const totalIn = allTransactions
      .filter(tx => tx.type === 'in')
      .reduce((sum, tx) => sum + tx.amount, 0)

    const totalOut = allTransactions
      .filter(tx => tx.type === 'out')
      .reduce((sum, tx) => sum + tx.amount, 0)

    const currentBalance = totalIn - totalOut

    // Calculate opening balance (balance before filtered transactions)
    let openingBalance = 0
    if (filterDate) {
      // Get all transactions before the filter date
      const filterDateTime = new Date(filterDate)
      filterDateTime.setHours(0, 0, 0, 0)
      const beforeFilter = allTransactions.filter(tx => new Date(tx.transaction_date) < filterDateTime)
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
  }, [transactions, filterDate, filterNote])

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
        <header className="brand">
          <h1>Ledgerly</h1>
          <p>Track cash in and cash out with a clean native-style ledger interface.</p>
        </header>

        <div className="stats-grid">
          <div className="card">
            <h2>Opening balance</h2>
            <strong>{formatMoney(summary.openingBalance)}</strong>
            <span className="badge">{filterDate ? `Before ${new Date(filterDate).toLocaleDateString('en-IN')}` : 'All time'}</span>
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

        {error && <div className="alert">{error}</div>}

        <section className="card">
          <h2>Record cash flow</h2>
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
            <input
              id="transaction-date"
              type="datetime-local"
              value={transactionDate}
              onChange={event => setTransactionDate(event.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="note">Note</label>
            <textarea
              id="note"
              rows="3"
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
        </section>

        <section className="card">
          <h2>Recent cash flow</h2>
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: '1fr 1fr auto' }}>
              <div>
                <label htmlFor="filter-date" style={{ display: 'block', marginBottom: '8px' }}>Filter by date</label>
                <input
                  id="filter-date"
                  type="date"
                  value={filterDate}
                  onChange={event => setFilterDate(event.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    background: 'rgba(15, 23, 42, 0.9)',
                    color: 'var(--text)',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label htmlFor="filter-note" style={{ display: 'block', marginBottom: '8px' }}>Filter by remarks</label>
                <input
                  id="filter-note"
                  type="text"
                  placeholder="Search notes..."
                  value={filterNote}
                  onChange={event => setFilterNote(event.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    background: 'rgba(15, 23, 42, 0.9)',
                    color: 'var(--text)',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'end', gap: '8px' }}>
                {(filterDate || filterNote) && (
                  <button
                    className="secondary"
                    onClick={() => {
                      setFilterDate('')
                      setFilterNote('')
                    }}
                    style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          </div>
          {loading ? (
            <p className="muted">Loading transactions...</p>
          ) : transactions.length === 0 ? (
            <p className="muted">
              {filterDate || filterNote
                ? `No transactions found${filterDate ? ` for ${new Date(filterDate).toLocaleDateString('en-IN')}` : ''}${filterNote ? ` matching "${filterNote}"` : ''}.`
                : 'No cash movements yet. Add cash in or cash out to get started.'
              }
            </p>
          ) : (
            <>
              <div className="table-head">
                <span>Type</span>
                <span>Amount</span>
                <span>Note</span>
                <span>Date & Time</span>
              </div>
              {transactions.map(tx => (
                <div key={tx.id} className="table-row">
                  <span>
                    <span className={`tag ${tx.type === 'in' ? 'credit' : 'debit'}`}>
                      {tx.type === 'in' ? 'Cash in' : 'Cash out'}
                    </span>
                  </span>
                  <span>{formatMoney(tx.amount)}</span>
                  <span>{tx.note || '—'}</span>
                  <span>{tx.transaction_date ? new Date(tx.transaction_date).toLocaleString('en-IN', {
                    dateStyle: 'short',
                    timeStyle: 'short'
                  }) : formatDate(tx.created_at)}</span>
                </div>
              ))}
            </>
          )}
        </section>

        <footer>Built with Next.js and Supabase — manage cash flow simply.</footer>
      </div>
    </main>
  )
}
