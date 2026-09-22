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
  buildMoneyTimeline,
  timelineDateLabel,
} from '../utils/moneyTimeline'
import {
  formatScheduleDate,
} from '../utils/recurrence'

import '../styles/money-timeline.css'

interface TimelineData {
  regularMoney: RegularMoney[]
  transactions: MoneyTransaction[]
  schemes: FinancialScheme[]
}

const RANGE_OPTIONS = [
  7,
  30,
  60,
  90,
] as const

function MoneyTimelinePage() {
  const [today] =
    useState(() => getLocalToday())

  const [daysAhead, setDaysAhead] =
    useState<number>(30)

  const [data, setData] =
    useState<TimelineData | null>(null)

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
            'Money Saathi could not prepare your upcoming money.',
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

  const timeline = useMemo(() => {
    if (!data) return null

    return buildMoneyTimeline(
      today,
      daysAhead,
      data.regularMoney,
      data.transactions,
      data.schemes,
    )
  }, [
    data,
    daysAhead,
    today,
  ])

  const groupedItems = useMemo(() => {
    if (!timeline) {
      return []
    }

    const groups =
      new Map<
        string,
        typeof timeline.items
      >()

    for (const item of timeline.items) {
      const current =
        groups.get(item.date) ?? []

      current.push(item)
      groups.set(item.date, current)
    }

    return Array.from(
      groups.entries(),
    )
  }, [timeline])

  if (loading) {
    return (
      <AppShell>
        <div className="dashboard-container">
          <div className="dashboard2-loading">
            Preparing upcoming money...
          </div>
        </div>
      </AppShell>
    )
  }

  if (error || !timeline) {
    return (
      <AppShell>
        <div className="dashboard-container">
          <div
            className="dashboard2-error"
            role="alert"
          >
            {error ||
              'Money Saathi could not prepare your timeline.'}
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="dashboard-container money-timeline-page">
        <header className="money-timeline-header">
          <div>
            <p className="dashboard-eyebrow">
              See what is coming
            </p>

            <h1>Upcoming money</h1>

            <p>
              A simple view of unrecorded Regular Money income
              and expenses ahead. This is a planning timeline,
              not a bank balance or promise that future income
              will arrive.
            </p>
          </div>

          <Link to="/app/regular-money">
            Manage schedules
          </Link>
        </header>

        <section className="money-timeline-range">
          <span>Show next</span>

          <div>
            {RANGE_OPTIONS.map(
              (days) => (
                <button
                  key={days}
                  type="button"
                  className={
                    daysAhead === days
                      ? 'selected'
                      : ''
                  }
                  aria-pressed={
                    daysAhead === days
                  }
                  onClick={() =>
                    setDaysAhead(days)
                  }
                >
                  {days} days
                </button>
              ),
            )}
          </div>
        </section>

        <section className="money-timeline-summary">
          <article>
            <span>Expected in</span>
            <strong className="income-text">
              {formatNu(
                timeline.expectedIncomeChetrum,
              )}
            </strong>
            <small>
              Scheduled and not yet recorded.
            </small>
          </article>

          <article>
            <span>Expected out</span>
            <strong>
              {formatNu(
                timeline.expectedExpenseChetrum,
              )}
            </strong>
            <small>
              Scheduled and not yet recorded.
            </small>
          </article>

          <article>
            <span>Scheduled difference</span>
            <strong
              className={
                timeline.expectedIncomeChetrum -
                  timeline.expectedExpenseChetrum >=
                0
                  ? 'income-text'
                  : ''
              }
            >
              {formatNu(
                timeline.expectedIncomeChetrum -
                  timeline.expectedExpenseChetrum,
              )}
            </strong>
            <small>
              Planning difference only; not current cash.
            </small>
          </article>
        </section>

        <section className="money-timeline-warning">
          <strong>
            Future income is not spendable money.
          </strong>

          <span>
            Upcoming income appears here for planning, but Safe
            to Spend does not add it until you actually record
            it as received.
          </span>
        </section>

        <section className="money-timeline-panel">
          <div className="money-timeline-panel-heading">
            <div>
              <p className="dashboard-eyebrow">
                Timeline
              </p>

              <h2>
                {formatScheduleDate(
                  timeline.startDate,
                )}
                {' → '}
                {formatScheduleDate(
                  timeline.endDate,
                )}
              </h2>
            </div>

            <span>
              {timeline.items.length}{' '}
              {timeline.items.length === 1
                ? 'item'
                : 'items'}
            </span>
          </div>

          {groupedItems.length === 0 ? (
            <div className="money-timeline-empty">
              <strong>
                Nothing scheduled in this period.
              </strong>

              <p>
                Add repeating income or expenses in Regular Money
                when you want Money Saathi to plan around them.
              </p>
            </div>
          ) : (
            <div className="money-timeline-groups">
              {groupedItems.map(
                ([date, items]) => (
                  <section
                    key={date}
                    className="money-timeline-day"
                  >
                    <div className="money-timeline-date">
                      <strong>
                        {timelineDateLabel(
                          today,
                          date,
                        )}
                      </strong>

                      <span>
                        {formatScheduleDate(
                          date,
                        )}
                      </span>
                    </div>

                    <div className="money-timeline-items">
                      {items.map(
                        (item) => (
                          <div
                            key={item.id}
                            className="money-timeline-row"
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
                          </div>
                        ),
                      )}
                    </div>
                  </section>
                ),
              )}
            </div>
          )}
        </section>

        <section className="money-timeline-panel scheme-reference-panel">
          <div className="money-timeline-panel-heading">
            <div>
              <p className="dashboard-eyebrow">
                Reference only
              </p>

              <h2>
                Scheme contributions
              </h2>
            </div>

            <Link to="/app/my-money/schemes">
              View schemes
            </Link>
          </div>

          <p className="scheme-reference-explainer">
            These are shown separately and are not added to the
            Expected out total. This avoids automatically
            double-counting a scheme contribution that you may
            already track through Regular Money.
          </p>

          {timeline.schemeReferences.length === 0 ? (
            <div className="money-timeline-empty compact">
              No active scheme contribution date falls in this
              period.
            </div>
          ) : (
            <div className="scheme-reference-list">
              {timeline.schemeReferences.map(
                (scheme) => (
                  <div
                    key={scheme.id}
                    className="scheme-reference-row"
                  >
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
                  </div>
                ),
              )}
            </div>
          )}
        </section>

        <section className="money-timeline-limitations">
          <strong>
            What this timeline does not assume
          </strong>

          <p>
            Loan EMIs are not projected from loan records because
            the current loan model does not store a verified next
            due date. Add an EMI to Regular Money if you want it
            included in upcoming commitments. Business money also
            stays inside the separate Business workspace.
          </p>
        </section>
      </div>
    </AppShell>
  )
}

export default MoneyTimelinePage
