import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import AppShell from '../components/AppShell'
import { getTransactions } from '../storage/db'
import { getPreferences } from '../settings/preferences'
import type { MoneyTransaction } from '../types/transaction'
import {
  formatNu,
  getLocalToday,
} from '../utils/money'
import {
  buildMonthlyTransactionsCsv,
  getMonthlyTransactionsCsvFilename,
} from '../utils/reportExport'
import {
  buildExpenseCategoryBreakdown,
  buildMonthlyTrend,
  calculateAverageChetrum,
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

  const [trendMonths] = useState(
    () => getPreferences().reportTrendMonths,
  )
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
    try {
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
      trendMonths,
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

    const expenseTransactionCount =
      monthTransactions.filter(
        (item) => item.kind === 'expense',
      ).length

    const averageExpenseChetrum =
      calculateAverageChetrum(
        current.expenseChetrum,
        expenseTransactionCount,
      )

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
    } catch {
      return null
    }
  }, [selectedMonth, transactions, trendMonths])

  function downloadMonthlyCsv() {
    if (!report) {
      return
    }

    const csv =
      buildMonthlyTransactionsCsv(
        report.monthTransactions,
      )

    const blob =
      new Blob(
        [
          '\uFEFF',
          csv,
        ],
        {
          type:
            'text/csv;charset=utf-8',
        },
      )

    const url =
      URL.createObjectURL(
        blob,
      )

    const anchor =
      document.createElement(
        'a',
      )

    anchor.href =
      url

    anchor.download =
      getMonthlyTransactionsCsvFilename(
        selectedMonth,
      )

    document.body.appendChild(
      anchor,
    )

    anchor.click()
    anchor.remove()

    window.setTimeout(
      () =>
        URL.revokeObjectURL(
          url,
        ),
      0,
    )
  }

  function printMonthlyReport() {
    window.print()
  }

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

  if (!report) {
    return (
      <AppShell>
        <div className="dashboard-container reports-page">
          <div
            className="reports-error"
            role="alert"
          >
            One or more report totals exceed the money range
            Money Saathi can represent exactly. No rounded report
            has been shown.
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

          <div className="reports-header-tools">
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

            <div
              className="reports-export-actions"
              aria-label="Monthly report downloads"
            >
              <button
                type="button"
                onClick={printMonthlyReport}
              >
                Print / Save PDF
              </button>

              <button
                type="button"
                onClick={downloadMonthlyCsv}
              >
                Download CSV
              </button>
            </div>
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

        <section
          className="reports-report-card"
          aria-label="Monthly money report card"
        >
          <header className="reports-report-card-header">
            <div>
              <span>Money Saathi</span>
              <h2>Monthly Money Report</h2>
              <p>{getMonthLabel(selectedMonth)}</p>
            </div>

            <div>
              <strong>
                {report.current.transactionCount}
              </strong>

              <span>
                recorded{' '}
                {report.current.transactionCount === 1
                  ? 'transaction'
                  : 'transactions'}
              </span>
            </div>
          </header>

          <div className="reports-report-card-metrics">
            <article>
              <span>Money in</span>
              <strong>
                {formatNu(
                  report.current.incomeChetrum,
                )}
              </strong>
            </article>

            <article>
              <span>Money out</span>
              <strong>
                {formatNu(
                  report.current.expenseChetrum,
                )}
              </strong>
            </article>

            <article>
              <span>Net cash flow</span>
              <strong>
                {formatNu(
                  report.current.netChetrum,
                )}
              </strong>
            </article>

            <article>
              <span>Cash-flow rate</span>
              <strong>
                {report.cashFlowRateBps === null
                  ? '—'
                  : formatPercentBps(
                      report.cashFlowRateBps,
                    )}
              </strong>
            </article>
          </div>

          <div className="reports-report-card-body">
            <section>
              <p className="dashboard-eyebrow">
                Snapshot
              </p>

              <dl className="reports-report-card-list">
                <div>
                  <dt>Largest expense category</dt>
                  <dd>
                    {report.topCategory
                      ? `${report.topCategory.category} · ${formatNu(
                          report.topCategory.amountChetrum,
                        )}`
                      : 'No expense data'}
                  </dd>
                </div>

                <div>
                  <dt>Average recorded expense</dt>
                  <dd>
                    {report.current.expenseChetrum > 0
                      ? formatNu(
                          report.averageExpenseChetrum,
                        )
                      : '—'}
                  </dd>
                </div>

                <div>
                  <dt>Previous month net</dt>
                  <dd>
                    {formatNu(
                      report.previous.netChetrum,
                    )}
                  </dd>
                </div>
              </dl>
            </section>

            <section>
              <p className="dashboard-eyebrow">
                Top spending
              </p>

              {report.categories.length === 0 ? (
                <p className="reports-report-card-empty">
                  No expenses recorded.
                </p>
              ) : (
                <ol className="reports-report-card-categories">
                  {report.categories
                    .slice(
                      0,
                      5,
                    )
                    .map(
                      (
                        category,
                      ) => (
                        <li
                          key={
                            category.category
                          }
                        >
                          <span>
                            {category.category}
                          </span>

                          <strong>
                            {formatNu(
                              category.amountChetrum,
                            )}
                          </strong>
                        </li>
                      ),
                    )}
                </ol>
              )}
            </section>
          </div>

          <footer className="reports-report-card-footer">
            <span>
              Based only on transactions recorded in Money Saathi.
            </span>

            <span>
              This is a personal money summary, not a bank statement or audited financial statement.
            </span>
          </footer>
        </section>

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
                {trendMonths}-month view
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



