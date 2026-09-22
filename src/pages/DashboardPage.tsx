import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import AppShell from '../components/AppShell'
import { getTransactions } from '../storage/db'
import type { MoneyTransaction } from '../types/transaction'
import {
  formatNu,
  isCurrentMonth,
} from '../utils/money'

interface DashboardTotals {
  balance: number
  monthlyIncome: number
  monthlyExpense: number
}

const emptyTotals: DashboardTotals = {
  balance: 0,
  monthlyIncome: 0,
  monthlyExpense: 0,
}

function DashboardPage() {
  const [transactions, setTransactions] =
    useState<MoneyTransaction[]>([])

  const [totals, setTotals] =
    useState<DashboardTotals>(emptyTotals)

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadDashboard() {
      try {
        const records = await getTransactions()

        if (!active) {
          return
        }

        const nextTotals = records.reduce<DashboardTotals>(
          (result, record) => {
            if (record.kind === 'income') {
              result.balance += record.amountChetrum

              if (isCurrentMonth(record.date)) {
                result.monthlyIncome += record.amountChetrum
              }
            } else {
              result.balance -= record.amountChetrum

              if (isCurrentMonth(record.date)) {
                result.monthlyExpense += record.amountChetrum
              }
            }

            return result
          },
          {
            ...emptyTotals,
          },
        )

        setTransactions(records)
        setTotals(nextTotals)
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadDashboard()

    return () => {
      active = false
    }
  }, [])

  return (
    <AppShell>
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-eyebrow">
              Your money today
            </p>

            <h1>Home</h1>
          </div>

          <Link
            to="/app/transactions/new"
            className="add-money-button"
          >
            + Add
          </Link>
        </header>

        <section
          className="dashboard-grid"
          aria-label="Money overview"
        >
          <article className="dashboard-card">
            <p className="dashboard-card-label">
              Current balance
            </p>

            <h2 className="dashboard-balance">
              {formatNu(totals.balance)}
            </h2>
          </article>

          <article className="dashboard-card">
            <p className="dashboard-card-label">
              Money in this month
            </p>

            <h2 className="dashboard-card-value positive">
              {formatNu(totals.monthlyIncome)}
            </h2>
          </article>

          <article className="dashboard-card">
            <p className="dashboard-card-label">
              Money out this month
            </p>

            <h2 className="dashboard-card-value">
              {formatNu(totals.monthlyExpense)}
            </h2>
          </article>
        </section>

        {loading ? (
          <section className="empty-panel">
            <div className="empty-content">
              <p>Loading your money...</p>
            </div>
          </section>
        ) : transactions.length === 0 ? (
          <section className="empty-panel">
            <div className="empty-content">
              <div className="empty-icon">
                +
              </div>

              <h2>Your money story starts here</h2>

              <p>
                Add your first income or expense. Money Saathi
                will calculate your balance automatically.
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
          <section className="recent-section">
            <div className="section-heading">
              <div>
                <p className="dashboard-card-label">
                  Activity
                </p>

                <h2>Recent transactions</h2>
              </div>

              <Link
                to="/app/transactions"
                className="text-link"
              >
                View all
              </Link>
            </div>

            <div className="transaction-list">
              {transactions.slice(0, 5).map((record) => (
                <div
                  className="transaction-row"
                  key={record.id}
                >
                  <div
                    className={
                      record.kind === 'income'
                        ? 'transaction-symbol income'
                        : 'transaction-symbol expense'
                    }
                    aria-hidden="true"
                  >
                    {record.kind === 'income' ? '+' : '−'}
                  </div>

                  <div className="transaction-main">
                    <strong>{record.category}</strong>

                    <span>
                      {record.note || record.date}
                    </span>
                  </div>

                  <div
                    className={
                      record.kind === 'income'
                        ? 'transaction-amount income-text'
                        : 'transaction-amount'
                    }
                  >
                    {record.kind === 'income' ? '+' : '−'}
                    {formatNu(record.amountChetrum)}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  )
}

export default DashboardPage
