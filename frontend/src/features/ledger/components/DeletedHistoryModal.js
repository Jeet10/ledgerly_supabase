import { formatDate, formatMoney, formatRelativeDeletionWindow } from '../utils/ledgerUtils'

export default function DeletedHistoryModal({
  show,
  onClose,
  deletedTransactions,
  allVisibleDeletedTransactionsSelected,
  toggleAllDeletedTransactionSelection,
  selectedVisibleDeletedTransactionIds,
  restoreSelectedTransactions,
  restoreAllDeletedTransactions,
  selectedDeletedTransactionIds,
  toggleDeletedTransactionSelection,
  restoreTransaction,
  restoreEvents,
}) {
  if (!show) return null

  return (
    <div className="modal-overlay">
      <div className="edit-modal card deleted-history-modal">
        <div className="modal-header">
          <div>
            <h2>Deleted transaction history</h2>
            <p className="muted modal-copy">Archived transactions stay here for 30 days and can be restored before automatic removal.</p>
          </div>
          <button className="secondary" type="button" onClick={onClose}>
            Close
          </button>
        </div>

        {deletedTransactions.length === 0 ? (
          <p className="muted">No deleted transactions right now.</p>
        ) : (
          <div className="table-wrapper deleted-history-table">
            <div className="bulk-action-bar">
              <div className="bulk-selection-summary">
                <label className="selection-control">
                  <input
                    type="checkbox"
                    checked={allVisibleDeletedTransactionsSelected}
                    onChange={toggleAllDeletedTransactionSelection}
                  />
                  <span>Select all</span>
                </label>
                <span className="badge">{selectedVisibleDeletedTransactionIds.length} selected</span>
                <span className="badge">{deletedTransactions.length} deleted</span>
              </div>
              <div className="bulk-action-buttons">
                <button
                  className="primary"
                  type="button"
                  onClick={restoreSelectedTransactions}
                  disabled={selectedVisibleDeletedTransactionIds.length === 0}
                >
                  Restore selected
                </button>
                <button className="secondary" type="button" onClick={restoreAllDeletedTransactions}>
                  Restore all
                </button>
              </div>
            </div>
            <div className="table-head">
              <span>Type</span>
              <span>Amount</span>
              <span>Note</span>
              <span>Member</span>
              <span>Deleted</span>
              <span>Actions</span>
            </div>
            <div className="table-body">
              {deletedTransactions.map(transaction => (
                <div key={transaction.id} className="table-row">
                  <span className="transaction-type-cell">
                    <input
                      type="checkbox"
                      aria-label={`Select deleted ${transaction.type === 'in' ? 'cash in' : 'cash out'} transaction`}
                      checked={selectedDeletedTransactionIds.includes(transaction.id)}
                      onChange={() => toggleDeletedTransactionSelection(transaction.id)}
                    />
                    <span className={`tag ${transaction.type === 'in' ? 'credit' : 'debit'}`}>
                      {transaction.type === 'in' ? 'Cash in' : 'Cash out'}
                    </span>
                  </span>
                  <span>{formatMoney(transaction.amount)}</span>
                  <span>{transaction.note || '-'}</span>
                  <span>{transaction.member_name || 'Unknown'}</span>
                  <span>
                    <strong>{formatDate(transaction.deleted_at)}</strong>
                    <small className="table-subtext">{formatRelativeDeletionWindow(transaction.delete_scheduled_for)}</small>
                  </span>
                  <span className="action-cell">
                    <button className="primary" type="button" onClick={() => restoreTransaction(transaction.id)}>
                      Restore
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="restore-activity-panel">
          <div className="restore-activity-header">
            <h3>Recent restore activity</h3>
            <span className="badge">{restoreEvents.length} tracked</span>
          </div>

          {restoreEvents.length === 0 ? (
            <p className="muted">No restore actions have been recorded yet.</p>
          ) : (
            <div className="restore-activity-list">
              {restoreEvents.map(event => (
                <div key={event.id} className="restore-activity-item">
                  <div>
                    <strong>
                      {formatMoney(event.amount)} {event.type === 'in' ? 'Cash in' : 'Cash out'}
                    </strong>
                    <p>
                      {event.member_name || 'Unknown'}
                      {event.note ? ` - ${event.note}` : ''}
                    </p>
                  </div>
                  <div className="restore-activity-meta">
                    <strong>{formatDate(event.restored_at)}</strong>
                    <small>{event.restored_by_email || 'Current user'}</small>
                    {event.deleted_at && <small>Was deleted on {formatDate(event.deleted_at)}</small>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
