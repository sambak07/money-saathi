import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import AppShell from '../components/AppShell'
import {
  deleteTransaction,
  getTransactions,
} from '../storage/db'
import type { MoneyTransaction } from '../types/transaction'
import { formatNu } from '../utils/money'

function TransactionsPage() {
  const [transactions, setTransactions] =
    useState<MoneyTransaction[]>([])

  const [loading, setLoading] = useState(true)

  async function loadTransactions() {
    const records = await getTransactions()
    setTransactions(records)
  }

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const records = await getTransactions()

        if (active) {
          setTransactions(records)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [])

  async function handleDelete(record: MoneyTransaction) {
    const confirmed = window.confirm(
      `Delete ${record.category} for ${formatNu(
        record.amountChetrum,
      )}?`,
    )

    if (!confirmed) {
      return
    }

    await deleteTransaction(record.id)
    await loadTransactions()
  }

  const income = transactions
    .filter((record) => record.kind === 'income')
    .reduce(
      (sum, record) => sum + record.amountChetrum,
      0,
    )

  const expense = transactions
    .filter((record) => record.kind === 'expense')
    .reduce(
      (sum, record) => sum + record.amountChetrum,
      0,
    )

  return (
    <AppShell>
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-eyebrow">
              Every recorded movement
            </p>

            <h1>Transactions</h1>
          </div>

          <Link
            to="/app/transactions/new"
            className="add-money-button"
          >
            + Add transaction
          </Link>
        </header>

        <section className="transaction-summary">
          <article className="small-summary-card">
            <span>Money in</span>
            <strong className="income-text">
              {formatNu(income)}
            </strong>
          </article>

          <article className="small-summary-card">
            <span>Money out</span>
            <strong>
              {formatNu(expense)}
            </strong>
          </article>

          <article className="small-summary-card">
            <span>Net</span>
            <strong>
              {formatNu(income - expense)}
            </strong>
          </article>
        </section>

        {loading ? (
          <section className="empty-panel">
            <div className="empty-content">
              <p>Loading transactions...</p>
            </div>
          </section>
        ) : transactions.length === 0 ? (
          <section className="empty-panel">
            <div className="empty-content">
              <div className="empty-icon">+</div>

              <h2>No transactions yet</h2>

              <p>
                Add income or expenses and they will appear
                here automatically.
              </p>

              <Link
                to="/app/transactions/new"
                className="empty-action"
              >
                Add first transaction
              </Link>
            </div>
          </section>
        ) : (
          <section className="transactions-panel">
            <div className="transaction-list">
              {transactions.map((record) => (
                <article
                  className="transaction-row"
                  key={record.id}
                >
                  <div
                    className={
                      record.kind === 'income'
                        ? 'transaction-symbol income'
                        : 'transaction-symbol expense'
                    }
                  >
                    {record.kind === 'income' ? '+' : '−'}
                  </div>

                  <div className="transaction-main">
                    <strong>
                      {record.category}
                    </strong>

                    <span>
                      {record.date}
                      {record.note
                        ? ` · ${record.note}`
                        : ''}
                    </span>
                  </div>

                  <div className="transaction-right">
                    <strong
                      className={
                        record.kind === 'income'
                          ? 'transaction-amount income-text'
                          : 'transaction-amount'
                      }
                    >
                      {record.kind === 'income'
                        ? '+'
                        : '−'}
                      {formatNu(record.amountChetrum)}
                    </strong>

                    <div className="transaction-actions">
                      <Link
                        to={`/app/transactions/${record.id}/edit`}
                      >
                        Edit
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          void handleDelete(record)
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  )
}

export default TransactionsPage
