import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import { Link } from 'react-router-dom'

import {
  useAccessibleDialog,
} from '../accessibility/useAccessibleDialog'
import AppShell from '../components/AppShell'
import {
  deleteTransaction,
  getTransactions,
} from '../storage/db'
import type { MoneyTransaction } from '../types/transaction'
import {
  formatNu,
  getLocalToday,
} from '../utils/money'

import '../styles/transactions.css'

type KindFilter = 'all' | 'income' | 'expense'

type DateFilter =
  | 'all'
  | 'this-month'
  | 'last-30-days'
  | 'custom'

interface TransactionGroup {
  date: string
  label: string
  records: MoneyTransaction[]
}

function toLocalDateValue(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getYesterday(): string {
  const today = new Date(`${getLocalToday()}T00:00:00`)
  today.setDate(today.getDate() - 1)

  return toLocalDateValue(today)
}

function getThirtyDayStart(): string {
  const today = new Date(`${getLocalToday()}T00:00:00`)
  today.setDate(today.getDate() - 29)

  return toLocalDateValue(today)
}

function formatDateHeading(date: string): string {
  const today = getLocalToday()

  if (date === today) {
    return 'Today'
  }

  if (date === getYesterday()) {
    return 'Yesterday'
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`))
}

function TransactionsPage() {
  const [transactions, setTransactions] =
    useState<MoneyTransaction[]>([])

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [search, setSearch] = useState('')
  const [kindFilter, setKindFilter] =
    useState<KindFilter>('all')

  const [dateFilter, setDateFilter] =
    useState<DateFilter>('all')

  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const [deletingRecord, setDeletingRecord] =
    useState<MoneyTransaction | null>(null)

  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const transactionDeleteDialogRef =
    useAccessibleDialog(
      deletingRecord !== null,
      () => {
        if (deleting) return

        setDeleteError('')
        setDeletingRecord(null)
      },
    )

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
      } catch {
        if (active) {
          setLoadError(
            'Money Saathi could not load your transactions.',
          )
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

  const filteredTransactions = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase()

    const today = getLocalToday()
    const currentMonth = today.slice(0, 7)
    const thirtyDayStart = getThirtyDayStart()

    return transactions.filter((record) => {
      if (
        kindFilter !== 'all' &&
        record.kind !== kindFilter
      ) {
        return false
      }

      if (normalizedSearch) {
        const searchable = [
          record.category,
          record.note,
          record.date,
        ]
          .join(' ')
          .toLowerCase()

        if (!searchable.includes(normalizedSearch)) {
          return false
        }
      }

      if (dateFilter === 'this-month') {
        return record.date.slice(0, 7) === currentMonth
      }

      if (dateFilter === 'last-30-days') {
        return (
          record.date >= thirtyDayStart &&
          record.date <= today
        )
      }

      if (dateFilter === 'custom') {
        if (fromDate && record.date < fromDate) {
          return false
        }

        if (toDate && record.date > toDate) {
          return false
        }
      }

      return true
    })
  }, [
    transactions,
    search,
    kindFilter,
    dateFilter,
    fromDate,
    toDate,
  ])

  const totals = useMemo(() => {
    return filteredTransactions.reduce(
      (result, record) => {
        if (record.kind === 'income') {
          result.income += record.amountChetrum
        } else {
          result.expense += record.amountChetrum
        }

        return result
      },
      {
        income: 0,
        expense: 0,
      },
    )
  }, [filteredTransactions])

  const groups = useMemo<TransactionGroup[]>(() => {
    const map = new Map<string, MoneyTransaction[]>()

    for (const record of filteredTransactions) {
      const existing = map.get(record.date)

      if (existing) {
        existing.push(record)
      } else {
        map.set(record.date, [record])
      }
    }

    return Array.from(map.entries()).map(
      ([date, records]) => ({
        date,
        label: formatDateHeading(date),
        records,
      }),
    )
  }, [filteredTransactions])

  const hasActiveFilters =
    search.trim().length > 0 ||
    kindFilter !== 'all' ||
    dateFilter !== 'all' ||
    fromDate !== '' ||
    toDate !== ''

  function clearFilters() {
    setSearch('')
    setKindFilter('all')
    setDateFilter('all')
    setFromDate('')
    setToDate('')
  }

  async function confirmDelete() {
    if (!deletingRecord) {
      return
    }

    setDeleting(true)
    setDeleteError('')

    try {
      await deleteTransaction(deletingRecord.id)
      await loadTransactions()
      setDeletingRecord(null)
    } catch {
      setDeleteError(
        'Money Saathi could not delete this transaction. Please try again.',
      )
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AppShell>
      <div className="dashboard-container">
        <header className="dashboard-header transactions-header">
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

        <section
          className="transaction-filter-panel"
          aria-label="Transaction filters"
        >
          <div className="transaction-search">
            <label htmlFor="transaction-search">
              Search
            </label>

            <input
              id="transaction-search"
              type="search"
              value={search}
              placeholder="Search category or note"
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          <div className="transaction-filter-grid">
            <div className="filter-field">
              <label htmlFor="kind-filter">
                Type
              </label>

              <select
                id="kind-filter"
                value={kindFilter}
                onChange={(event) =>
                  setKindFilter(
                    event.target.value as KindFilter,
                  )
                }
              >
                <option value="all">
                  All transactions
                </option>

                <option value="income">
                  Money in
                </option>

                <option value="expense">
                  Money out
                </option>
              </select>
            </div>

            <div className="filter-field">
              <label htmlFor="date-filter">
                Date
              </label>

              <select
                id="date-filter"
                value={dateFilter}
                onChange={(event) =>
                  setDateFilter(
                    event.target.value as DateFilter,
                  )
                }
              >
                <option value="all">
                  All time
                </option>

                <option value="this-month">
                  This month
                </option>

                <option value="last-30-days">
                  Last 30 days
                </option>

                <option value="custom">
                  Custom dates
                </option>
              </select>
            </div>
          </div>

          {dateFilter === 'custom' && (
            <div className="custom-date-grid">
              <div className="filter-field">
                <label htmlFor="from-date">
                  From
                </label>

                <input
                  id="from-date"
                  type="date"
                  value={fromDate}
                  max={toDate || undefined}
                  onChange={(event) =>
                    setFromDate(event.target.value)
                  }
                />
              </div>

              <div className="filter-field">
                <label htmlFor="to-date">
                  To
                </label>

                <input
                  id="to-date"
                  type="date"
                  value={toDate}
                  min={fromDate || undefined}
                  onChange={(event) =>
                    setToDate(event.target.value)
                  }
                />
              </div>
            </div>
          )}

          <div className="filter-footer">
            <p aria-live="polite">
              Showing{' '}
              <strong>
                {filteredTransactions.length}
              </strong>{' '}
              of{' '}
              <strong>{transactions.length}</strong>{' '}
              {transactions.length === 1
                ? 'transaction'
                : 'transactions'}
            </p>

            {hasActiveFilters && (
              <button
                type="button"
                className="clear-filter-button"
                onClick={clearFilters}
              >
                Clear filters
              </button>
            )}
          </div>
        </section>

        <section
          className="transaction-summary"
          aria-label="Transaction totals"
        >
          <article className="small-summary-card">
            <span>Money in</span>

            <strong className="income-text">
              {formatNu(totals.income)}
            </strong>
          </article>

          <article className="small-summary-card">
            <span>Money out</span>

            <strong>
              {formatNu(totals.expense)}
            </strong>
          </article>

          <article className="small-summary-card">
            <span>Net</span>

            <strong>
              {formatNu(
                totals.income - totals.expense,
              )}
            </strong>
          </article>
        </section>

        {loadError && (
          <div className="transactions-error" role="alert">
            {loadError}
          </div>
        )}

        {loading ? (
          <section className="empty-panel">
            <div className="empty-content">
              <p>Loading transactions...</p>
            </div>
          </section>
        ) : transactions.length === 0 ? (
          <section className="empty-panel">
            <div className="empty-content">
              <div className="empty-icon">
                +
              </div>

              <h2>No transactions yet</h2>

              <p>
                Add income or expenses and they will
                appear here automatically.
              </p>

              <Link
                to="/app/transactions/new"
                className="empty-action"
              >
                Add first transaction
              </Link>
            </div>
          </section>
        ) : filteredTransactions.length === 0 ? (
          <section className="empty-panel">
            <div className="empty-content">
              <div className="empty-icon">
                ?
              </div>

              <h2>No matching transactions</h2>

              <p>
                Try changing your search, transaction
                type or date range.
              </p>

              <button
                type="button"
                className="empty-action"
                onClick={clearFilters}
              >
                Clear filters
              </button>
            </div>
          </section>
        ) : (
          <section className="transactions-panel grouped-transactions">
            {groups.map((group) => (
              <div
                className="transaction-date-group"
                key={group.date}
              >
                <div className="transaction-date-heading">
                  <div>
                    <h2>{group.label}</h2>

                    <span>{group.date}</span>
                  </div>

                  <span className="date-count">
                    {group.records.length}{' '}
                    {group.records.length === 1
                      ? 'transaction'
                      : 'transactions'}
                  </span>
                </div>

                <div className="transaction-list">
                  {group.records.map((record) => (
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
                        aria-hidden="true"
                      >
                        {record.kind === 'income'
                          ? '+'
                          : '−'}
                      </div>

                      <div className="transaction-main">
                        <strong>
                          {record.category}
                        </strong>

                        <span>
                          {record.note ||
                            (record.kind === 'income'
                              ? 'Money in'
                              : 'Money out')}
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
                          {formatNu(
                            record.amountChetrum,
                          )}
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
                              setDeleteError('')
                              setDeletingRecord(record)
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}
      </div>

      {deletingRecord && (
        <div
          className="delete-dialog-backdrop"
          role="presentation"
        >
          <section
            ref={transactionDeleteDialogRef}
            className="delete-dialog"
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            aria-labelledby="delete-dialog-title"
            aria-describedby="delete-dialog-description"
          >
            <div
              className="delete-dialog-icon"
              aria-hidden="true"
            >
              !
            </div>

            <h2 id="delete-dialog-title">
              Delete transaction?
            </h2>

            <p id="delete-dialog-description">
              You are about to permanently delete{' '}
              <strong>
                {deletingRecord.category}
              </strong>{' '}
              for{' '}
              <strong>
                {formatNu(
                  deletingRecord.amountChetrum,
                )}
              </strong>
              .
            </p>

            <p className="delete-warning">
              This action cannot be undone.
            </p>

            {deleteError && (
              <div
                className="delete-error"
                role="alert"
              >
                {deleteError}
              </div>
            )}

            <div className="delete-dialog-actions">
              <button
                type="button"
                className="dialog-cancel-button"
                disabled={deleting}
                onClick={() => {
                  setDeleteError('')
                  setDeletingRecord(null)
                }}
              >
                Keep transaction
              </button>

              <button
                type="button"
                className="dialog-delete-button"
                disabled={deleting}
                onClick={() => {
                  void confirmDelete()
                }}
              >
                {deleting
                  ? 'Deleting...'
                  : 'Delete permanently'}
              </button>
            </div>
          </section>
        </div>
      )}
    </AppShell>
  )
}

export default TransactionsPage
