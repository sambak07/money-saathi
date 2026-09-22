import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import AppShell from '../components/AppShell'
import { getTransactions } from '../storage/db'
import type { MoneyTransaction } from '../types/transaction'
import {
  formatNu,
  getLocalToday,
} from '../utils/money'
import {
  buildExpenseCategoryBreakdown,
  buildMonthlyTrend,
  calculateCashFlowRateBps,
  formatPercentBps,
  getMonthKeyOffset,
  getMonthLabel,
  getMonthTransactions,
  summarizeMonth,
} from '../utils/reports'

import '../styles/reports.css'

function ReportsPage() {
  const [transactions, setTransactions] =
    useState<MoneyTransaction[]>([])
  const [selectedMonth, setSelectedMonth] =
    useState(() => getLocalToday().slice(0, 7))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
          setError(
            'Money Saathi could not load your reports.',
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

  const report = useMemo(() => {
    const current = summarizeMonth(
      transactions,
      selectedMonth,
    )

    const previousMonth =
      getMonthKeyOffset(selectedMonth, -1)

    const previous = summarizeMonth(
      transactions,
      previousMonth,
    )

    const trend = buildMonthlyTrend(
      transactions,
      selectedMonth,
      6,
    )

    const categories =
      buildExpenseCategoryBreakdown(
        transactions,
        selectedMonth,
      )

    const monthTransactions =
      getMonthTransactions(
        transactions,
        selectedMonth,
      )

    const cashFlowRateBps =
      calculateCashFlowRateBps(
        current.incomeChetrum,
        current.netChetrum,
      )

    const maxTrendValue = Math.max(
      1,
      ...trend.flatMap((item) => [
        item.incomeChetrum,
        item.expenseChetrum,
      ]),
    )

    const topCategory =
      categories[0] ?? null

    const averageExpenseChetrum =
      current.transactionCount > 0
        ? Math.trunc(
            current.expenseChetrum /
              Math.max(
                1,
                monthTransactions.filter(
                  (item) =>
                    item.kind === 'expense',
                ).length,
              ),
          )
        : 0

    return {
      current,
      previous,
      trend,
      categories,
      monthTransactions,
      cashFlowRateBps,
      maxTrendValue,
      topCategory,
      averageExpenseChetrum,
    }
  }, [selectedMonth, transactions])

  if (loading) {
    return (
      <AppShell>
        <div className="dashboard-container">
          <div className="reports-loading">
            Preparing reports...
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="dashboard-container reports-page">
        <header className="reports-header">
          <div>
            <p className="dashboard-eyebrow">
              Understand your patterns
            </p>

            <h1>Reports</h1>

            <p>
              Review recorded income, expenses and cash-flow
              patterns without mixing them with assets, loans or
              future benefits.
            </p>
          </div>

          <div className="reports-month-control">
            <label htmlFor="report-month">
              Report month
            </label>

            <input
              id="report-month"
              type="month"
              value={selectedMonth}
              max={getLocalToday().slice(0, 7)}
              onChange={(event) =>
                setSelectedMonth(event.target.value)
              }
            />
          </div>
        </header>

        {error && (
          <div className="reports-error" role="alert">
            {error}
          </div>
        )}

        <div className="reports-source-note">
          Reports are based only on transactions recorded in
          Money Saathi. They do not infer bank balances or
          unrecorded spending.
        </div>

        <section className="reports-summary-grid">
          <article className="reports-summary-card">
            <span>Money in</span>
            <strong className="income-text">
              {formatNu(
                report.current.incomeChetrum,
              )}
            </strong>
            <small>
              {report.current.incomeChetrum >=
              report.previous.incomeChetrum
                ? 'At or above'
                : 'Below'}{' '}
              {getMonthLabel(
                getMonthKeyOffset(selectedMonth, -1),
              )}
            </small>
          </article>

          <article className="reports-summary-card">
            <span>Money out</span>
            <strong>
              {formatNu(
                report.current.expenseChetrum,
              )}
            </strong>
            <small>
              {report.current.expenseChetrum <=
              report.previous.expenseChetrum
                ? 'At or below'
                : 'Above'}{' '}
              previous month
            </small>
          </article>

          <article className="reports-summary-card">
            <span>Net cash flow</span>
            <strong
              className={
                report.current.netChetrum >= 0
                  ? 'income-text'
                  : ''
              }
            >
              {formatNu(
                report.current.netChetrum,
              )}
            </strong>
            <small>
              Income minus recorded expenses.
            </small>
          </article>

          <article className="reports-summary-card emphasized">
            <span>Cash-flow rate</span>
            <strong>
              {report.cashFlowRateBps === null
                ? '—'
                : formatPercentBps(
                    report.cashFlowRateBps,
                  )}
            </strong>
            <small>
              Net cash flow as a share of recorded income.
            </small>
          </article>
        </section>

        <section className="reports-panel">
          <div className="reports-panel-heading">
            <div>
              <p className="dashboard-eyebrow">
                Six-month view
              </p>
              <h2>Income and expense trend</h2>
            </div>

            <span>
              Ending {getMonthLabel(selectedMonth)}
            </span>
          </div>

          <div className="reports-trend">
            {report.trend.map((month) => (
              <article
                className="reports-trend-row"
                key={month.month}
              >
                <div className="reports-trend-label">
                  <strong>
                    {getMonthLabel(month.month)}
                  </strong>

                  <span>
                    Net {formatNu(month.netChetrum)}
                  </span>
                </div>

                <div className="reports-trend-bars">
                  <div className="reports-trend-line">
                    <span>In</span>
                    <div>
                      <div
                        className="reports-bar income"
                        style={{
                          width: `${Math.max(
                            0,
                            (month.incomeChetrum /
                              report.maxTrendValue) *
                              100,
                          )}%`,
                        }}
                      />
                    </div>
                    <strong>
                      {formatNu(month.incomeChetrum)}
                    </strong>
                  </div>

                  <div className="reports-trend-line">
                    <span>Out</span>
                    <div>
                      <div
                        className="reports-bar expense"
                        style={{
                          width: `${Math.max(
                            0,
                            (month.expenseChetrum /
                              report.maxTrendValue) *
                              100,
                          )}%`,
                        }}
                      />
                    </div>
                    <strong>
                      {formatNu(month.expenseChetrum)}
                    </strong>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="reports-two-column">
          <article className="reports-panel">
            <div className="reports-panel-heading">
              <div>
                <p className="dashboard-eyebrow">
                  Spending
                </p>
                <h2>Expense categories</h2>
              </div>

              <span>
                {formatNu(
                  report.current.expenseChetrum,
                )}{' '}
                total
              </span>
            </div>

            {report.categories.length === 0 ? (
              <div className="reports-empty">
                No expenses recorded for this month.
              </div>
            ) : (
              <div className="reports-category-list">
                {report.categories.map((row) => (
                  <div
                    className="reports-category-row"
                    key={row.category}
                  >
                    <div className="reports-category-top">
                      <div>
                        <strong>{row.category}</strong>
                        <span>
                          {row.transactionCount}{' '}
                          {row.transactionCount === 1
                            ? 'transaction'
                            : 'transactions'}
                        </span>
                      </div>

                      <div>
                        <strong>
                          {formatNu(
                            row.amountChetrum,
                          )}
                        </strong>
                        <span>
                          {formatPercentBps(
                            row.shareBps,
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="reports-category-track">
                      <div
                        className="reports-category-fill"
                        style={{
                          width: `${Math.min(
                            row.shareBps / 100,
                            100,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="reports-panel">
            <div className="reports-panel-heading">
              <div>
                <p className="dashboard-eyebrow">
                  Snapshot
                </p>
                <h2>{getMonthLabel(selectedMonth)}</h2>
              </div>

              <span>
                {report.current.transactionCount}{' '}
                {report.current.transactionCount === 1
                  ? 'transaction'
                  : 'transactions'}
              </span>
            </div>

            <div className="reports-insight-grid">
              <div>
                <span>Largest expense category</span>
                <strong>
                  {report.topCategory?.category ??
                    'No expense data'}
                </strong>
                <small>
                  {report.topCategory
                    ? formatNu(
                        report.topCategory.amountChetrum,
                      )
                    : '—'}
                </small>
              </div>

              <div>
                <span>Average recorded expense</span>
                <strong>
                  {report.current.expenseChetrum > 0
                    ? formatNu(
                        report.averageExpenseChetrum,
                      )
                    : '—'}
                </strong>
                <small>
                  Per expense transaction, not per day.
                </small>
              </div>

              <div>
                <span>Previous month net</span>
                <strong
                  className={
                    report.previous.netChetrum >= 0
                      ? 'income-text'
                      : ''
                  }
                >
                  {formatNu(
                    report.previous.netChetrum,
                  )}
                </strong>
                <small>
                  {getMonthLabel(
                    report.previous.month,
                  )}
                </small>
              </div>

              <div>
                <span>Current month net</span>
                <strong
                  className={
                    report.current.netChetrum >= 0
                      ? 'income-text'
                      : ''
                  }
                >
                  {formatNu(
                    report.current.netChetrum,
                  )}
                </strong>
                <small>
                  {getMonthLabel(
                    report.current.month,
                  )}
                </small>
              </div>
            </div>
          </article>
        </section>

        <section className="reports-panel">
          <div className="reports-panel-heading">
            <div>
              <p className="dashboard-eyebrow">
                Detail
              </p>
              <h2>Transactions this month</h2>
            </div>

            <span>
              {report.monthTransactions.length} shown
            </span>
          </div>

          {report.monthTransactions.length === 0 ? (
            <div className="reports-empty">
              Nothing was recorded in this month.
            </div>
          ) : (
            <div className="reports-transaction-list">
              {report.monthTransactions.map(
                (transaction) => (
                  <div
                    className="reports-transaction-row"
                    key={transaction.id}
                  >
                    <div>
                      <strong>
                        {transaction.category}
                      </strong>
                      <span>
                        {transaction.note ||
                          transaction.date}
                      </span>
                    </div>

                    <div>
                      <strong
                        className={
                          transaction.kind === 'income'
                            ? 'income-text'
                            : ''
                        }
                      >
                        {transaction.kind === 'income'
                          ? '+'
                          : '−'}
                        {formatNu(
                          transaction.amountChetrum,
                        )}
                      </strong>
                      <span>
                        {transaction.date}
                      </span>
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  )
}

export default ReportsPage
