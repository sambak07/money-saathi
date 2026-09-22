import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  Link,
} from 'react-router-dom'

import AppShell from '../components/AppShell'
import {
  getFinancialSchemes,
  getRegularMoney,
  getTransactions,
} from '../storage/db'
import type {
  FinancialScheme,
} from '../types/scheme'
import type {
  RegularMoney,
} from '../types/regularMoney'
import type {
  MoneyTransaction,
} from '../types/transaction'
import {
  formatNu,
  getLocalToday,
} from '../utils/money'
import {
  buildMoneyCalendarMonth,
  groupCalendarItemsByDate,
  shiftCalendarMonth,
} from '../utils/moneyCalendar'
import {
  formatScheduleDate,
} from '../utils/recurrence'

import '../styles/money-calendar.css'

interface CalendarData {
  regularMoney: RegularMoney[]
  transactions: MoneyTransaction[]
  schemes: FinancialScheme[]
}

function MoneyCalendarPage() {
  const [today] =
    useState(() => getLocalToday())

  const [selectedMonth, setSelectedMonth] =
    useState(
      () => getLocalToday().slice(0, 7),
    )

  const [data, setData] =
    useState<CalendarData | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const [
          regularMoney,
          transactions,
          schemes,
        ] = await Promise.all([
          getRegularMoney(),
          getTransactions(),
          getFinancialSchemes(),
        ])

        if (!active) return

        setData({
          regularMoney,
          transactions,
          schemes,
        })
      } catch {
        if (active) {
          setError(
            'Money Saathi could not prepare your money calendar.',
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

  const view = useMemo(() => {
    if (!data) return null

    const calendar =
      buildMoneyCalendarMonth(
        selectedMonth,
        data.regularMoney,
        data.transactions,
        data.schemes,
      )

    return {
      calendar,
      groupedItems:
        groupCalendarItemsByDate(
          calendar.items,
        ),
    }
  }, [
    data,
    selectedMonth,
  ])

  if (loading) {
    return (
      <AppShell>
        <div className="dashboard-container">
          <div className="dashboard2-loading">
            Preparing your money calendar...
          </div>
        </div>
      </AppShell>
    )
  }

  if (error || !view) {
    return (
      <AppShell>
        <div className="dashboard-container">
          <div
            className="dashboard2-error"
            role="alert"
          >
            {error ||
              'Money Saathi could not prepare your calendar.'}
          </div>
        </div>
      </AppShell>
    )
  }

  const {
    calendar,
    groupedItems,
  } = view

  const currentMonth =
    today.slice(0, 7)

  const canGoPrevious =
    selectedMonth > currentMonth

  return (
    <AppShell>
      <div className="dashboard-container money-calendar-page">
        <header className="money-calendar-header">
          <div>
            <p className="dashboard-eyebrow">
              See the month before it happens
            </p>

            <h1>Money calendar</h1>

            <p>
              A month-by-month planning view of unrecorded
              Regular Money income and expenses. Future income is
              shown for planning only and is never treated as
              current cash.
            </p>
          </div>

          <Link to="/app/regular-money">
            Manage Regular Money
          </Link>
        </header>

        <section className="money-calendar-controls">
          <button
            type="button"
            disabled={!canGoPrevious}
            onClick={() =>
              setSelectedMonth(
                shiftCalendarMonth(
                  selectedMonth,
                  -1,
                ),
              )
            }
          >
            Previous
          </button>

          <div>
            <span>Planning month</span>

            <strong>
              {formatScheduleDate(
                `${selectedMonth}-01`,
              )}
            </strong>
          </div>

          <button
            type="button"
            onClick={() =>
              setSelectedMonth(
                shiftCalendarMonth(
                  selectedMonth,
                  1,
                ),
              )
            }
          >
            Next
          </button>
        </section>

        <section className="money-calendar-summary">
          <article>
            <span>Scheduled in</span>

            <strong className="income-text">
              {formatNu(
                calendar.expectedIncomeChetrum,
              )}
            </strong>

            <small>
              Unrecorded Regular Money income in this month.
            </small>
          </article>

          <article>
            <span>Scheduled out</span>

            <strong>
              {formatNu(
                calendar.expectedExpenseChetrum,
              )}
            </strong>

            <small>
              Unrecorded Regular Money expenses in this month.
            </small>
          </article>

          <article>
            <span>Scheduled difference</span>

            <strong
              className={
                calendar.expectedIncomeChetrum -
                  calendar.expectedExpenseChetrum >=
                0
                  ? 'income-text'
                  : ''
              }
            >
              {formatNu(
                calendar.expectedIncomeChetrum -
                  calendar.expectedExpenseChetrum,
              )}
            </strong>

            <small>
              Planning difference only, not available cash.
            </small>
          </article>
        </section>

        <section className="money-calendar-safeguard">
          <strong>
            Calendar income is not Safe to Spend.
          </strong>

          <span>
            Money Saathi waits until income is actually recorded
            before it can increase your recorded balance.
          </span>
        </section>

        <section className="money-calendar-panel">
          <div className="money-calendar-panel-heading">
            <div>
              <p className="dashboard-eyebrow">
                Scheduled dates
              </p>

              <h2>
                {formatScheduleDate(
                  calendar.startDate,
                )}
                {' – '}
                {formatScheduleDate(
                  calendar.endDate,
                )}
              </h2>
            </div>

            <span>
              {calendar.items.length}{' '}
              {calendar.items.length === 1
                ? 'item'
                : 'items'}
            </span>
          </div>

          {groupedItems.length === 0 ? (
            <div className="money-calendar-empty">
              <strong>
                No unrecorded Regular Money falls in this month.
              </strong>

              <p>
                Add repeating income or expenses when you want
                Money Saathi to plan around them.
              </p>
            </div>
          ) : (
            <div className="money-calendar-days">
              {groupedItems.map(
                ([date, items]) => (
                  <section
                    key={date}
                    className="money-calendar-day"
                  >
                    <div className="money-calendar-date">
                      <strong>
                        {date.slice(-2)}
                      </strong>

                      <span>
                        {formatScheduleDate(
                          date,
                        )}
                      </span>
                    </div>

                    <div className="money-calendar-items">
                      {items.map(
                        (item) => (
                          <article
                            key={item.id}
                            className="money-calendar-item"
                          >
                            <div>
                              <strong>
                                {item.name}
                              </strong>

                              <span>
                                {item.category}
                              </span>
                            </div>

                            <strong
                              className={
                                item.kind ===
                                'income'
                                  ? 'income-text'
                                  : ''
                              }
                            >
                              {item.kind ===
                              'income'
                                ? '+'
                                : '−'}
                              {formatNu(
                                item.amountChetrum,
                              )}
                            </strong>
                          </article>
                        ),
                      )}
                    </div>
                  </section>
                ),
              )}
            </div>
          )}
        </section>

        <section className="money-calendar-panel">
          <div className="money-calendar-panel-heading">
            <div>
              <p className="dashboard-eyebrow">
                Reference only
              </p>

              <h2>
                Scheme contribution dates
              </h2>
            </div>

            <Link to="/app/my-money/schemes">
              View schemes
            </Link>
          </div>

          <p className="money-calendar-reference-copy">
            These dates are kept separate from Scheduled out so
            a scheme contribution is not automatically counted
            twice when the same commitment is also represented
            in Regular Money.
          </p>

          {calendar.schemeReferences.length === 0 ? (
            <div className="money-calendar-empty compact">
              No active scheme contribution date falls in this
              month.
            </div>
          ) : (
            <div className="money-calendar-schemes">
              {calendar.schemeReferences.map(
                (scheme) => (
                  <article key={scheme.id}>
                    <div>
                      <strong>
                        {scheme.name}
                      </strong>

                      <span>
                        {scheme.provider ||
                          'Provider not entered'}
                      </span>
                    </div>

                    <div>
                      <strong>
                        {formatNu(
                          scheme.amountChetrum,
                        )}
                      </strong>

                      <span>
                        {formatScheduleDate(
                          scheme.date,
                        )}
                      </span>
                    </div>
                  </article>
                ),
              )}
            </div>
          )}
        </section>

        <section className="money-calendar-limitations">
          <div>
            <strong>
              Loan EMI dates are not guessed
            </strong>

            <p>
              The current loan record does not store a verified
              next-due date. Add an EMI to Regular Money if you
              want it to appear here.
            </p>
          </div>

          <div>
            <strong>
              Business money stays separate
            </strong>

            <p>
              Business transactions remain inside each Business
              workspace and do not enter this personal planning
              calendar.
            </p>
          </div>

          <div>
            <strong>
              Recorded means completed
            </strong>

            <p>
              When a recurring occurrence has already been
              recorded as a transaction, it is removed from this
              planning calendar.
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  )
}

export default MoneyCalendarPage
