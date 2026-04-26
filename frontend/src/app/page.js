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
  const [type, setType] = useState('in')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadTransactions()
  }, [])

  const handleError = message => {
    setError(message)
    setTimeout(() => setError(''), 4500)
  }

  const loadTransactions = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('transactions')
      .select('id,amount,type,note,created_at')
      .order('created_at', { ascending: false })

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

  const addTransaction = async () => {
    const value = Number(amount)
    if (!value || value <= 0) {
      handleError('Enter a valid amount.')
      return
    }

    const { error } = await supabase
      .from('transactions')
      .insert([{ amount: value, type, note: note.trim() }])

    if (error) {
      handleError('Unable to save transaction.')
      return
    }

    setAmount('')
    setNote('')
    loadTransactions()
  }

  const summary = useMemo(() => {
    const totalIn = transactions
      .filter(tx => tx.type === 'in')
      .reduce((sum, tx) => sum + tx.amount, 0)

    const totalOut = transactions
      .filter(tx => tx.type === 'out')
      .reduce((sum, tx) => sum + tx.amount, 0)

    return {
      totalIn,
      totalOut,
      balance: totalIn - totalOut,
      transactionCount: transactions.length,
    }
  }, [transactions])

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
            <h2>Cash balance</h2>
            <strong>{formatMoney(summary.balance)}</strong>
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
            <label htmlFor="type">Type</label>
            <select id="type" value={type} onChange={event => setType(event.target.value)}>
              <option value="in">Cash in</option>
              <option value="out">Cash out</option>
            </select>
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

          <button className="primary" onClick={addTransaction}>
            Save transaction
          </button>
        </section>

        <section className="card">
          <h2>Recent cash flow</h2>
          {loading ? (
            <p className="muted">Loading transactions...</p>
          ) : transactions.length === 0 ? (
            <p className="muted">No cash movements yet. Add cash in or cash out to get started.</p>
          ) : (
            <>
              <div className="table-head">
                <span>Type</span>
                <span>Amount</span>
                <span>Note</span>
                <span>When</span>
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
                  <span>{formatDate(tx.created_at)}</span>
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
