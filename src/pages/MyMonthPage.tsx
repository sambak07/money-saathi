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
  getRegularMoney,
  getTransactions,
} from '../storage/db'
import {
  getPreferences,
} from '../settings/preferences'
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
  buildMonthPlan,
} from '../utils/monthPlan'
import {
  formatScheduleDate,
} from '../utils/recurrence'

import '../styles/my-month.css'

interface MyMonthData {
  transactions: MoneyTransaction[]
  regularMoney: RegularMoney[]
}

function formatMonthLabel(
  month: string,
): string {
  const [
    year,
    monthNumber,
  ] =
    month
      .split('-')
      .map(Number)

  return new Intl.DateTimeFormat(
    'en-GB',
    {
      month: 'long',
      year: 'numeric',
    },
  ).format(
    new Date(
      year,
      monthNumber - 1,
      1,
    ),
  )
}

function MyMonthPage() {
  const [today] =
    useState(() => getLocalToday())

  const [preferences] =
    useState(() => getPreferences())

  const [data, setData] =
    useState<MyMonthData | null>(
      null,
    )

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const [
          transactions,
          regularMoney,
        ] =
          await Promise.all([
            getTransactions(),
            getRegularMoney(),
          ])

        if (!active) return

        setData({
          transactions,
          regularMoney,
        })
      } catch {
        if (active) {
          setError(
            'Money Saathi could not prepare your monthly plan.',
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

  const plan =
    useMemo(() => {
      if (!data) {
        return null
      }

      try {
        return buildMonthPlan(
          today,
          data.transactions,
          data.regularMoney,
          preferences.safetyBufferChetrum,
        )
      } catch {
        return null
      }
    }, [
      data,
      preferences.safetyBufferChetrum,
      today,
    ])

  if (loading) {
    return (
      <AppShell>
        <div className="dashboard-container">
          <div className="dashboard2-loading">
            Preparing your month...
          </div>
        </div>
      </AppShell>
    )
  }

  if (
    error ||
    !plan
  ) {
    return (
      <AppShell>
        <div className="dashboard-container">
          <div
            className="dashboard2-error"
            role="alert"
          >
            {error ||
              'Money Saathi could not prepare your monthly plan.'}
          </div>
        </div>
      </AppShell>
    )
  }

  const monthLabel =
    formatMonthLabel(
      plan.month,
    )

  const hasScheduledIncome =
    plan.scheduledIncomeRemainingChetrum >
    0

  const needsAttention =
    plan.overdueExpenseCount >
      0 ||
    plan.safeToSpend.safeToSpendChetrum ===
      0 ||
    plan.transactionCount ===
      0

  return (
    <AppShell>
      <div className="dashboard-container my-month-page">
        <header className="my-month-header">
          <div>
            <p className="dashboard-eyebrow">
              Monthly money plan
            </p>

            <h1>My Month</h1>

            <p>
              A conservative view of {monthLabel}, built only from
              money you recorded, your Regular Money schedules and
              your chosen safety buffer.
            </p>
          </div>

          <div className="my-month-header-actions">
            <Link to="/app/forecast">
              30 / 60 / 90-day forecast
            </Link>

            <Link to="/app/regular-money">
              Review Regular Money
            </Link>
          </div>
        </header>

        <section
          className="my-month-primary-grid"
          aria-label="Monthly planning summary"
        >
          <article>
            <span>Recorded balance</span>

            <strong>
              {formatNu(
                plan.recordedBalanceChetrum,
              )}
            </strong>

            <p>
              All recorded income minus all recorded expenses up to
              today.
            </p>
          </article>

          <article className="safe">
            <span>Safe to Spend</span>

            <strong>
              {formatNu(
                plan.safeToSpend.safeToSpendChetrum,
              )}
            </strong>

            <p>
              Uses the existing Safe to Spend horizon. Future income
              is never added to current cash.
            </p>
          </article>

          <article>
            <span>Month planning room</span>

            <strong>
              {formatNu(
                plan.conservativeMonthRoomChetrum,
              )}
            </strong>

            <p>
              Recorded balance after all unrecorded scheduled
              expenses this month and your safety buffer.
            </p>
          </article>
        </section>

        <section className="my-month-plan-card">
          <div className="my-month-section-heading">
            <div>
              <p className="dashboard-eyebrow">
                {monthLabel}
              </p>

              <h2>
                What this month currently looks like
              </h2>
            </div>

            <Link to="/app/transactions">
              View transactions
            </Link>
          </div>

          <div className="my-month-flow">
            <div>
              <span>Recorded income</span>
              <strong className="income-text">
                {formatNu(
                  plan.recordedIncomeChetrum,
                )}
              </strong>
              <small>
                Money actually recorded this month.
              </small>
            </div>

            <div>
              <span>Recorded spending</span>
              <strong>
                {formatNu(
                  plan.recordedExpenseChetrum,
                )}
              </strong>
              <small>
                Expenses actually recorded this month.
              </small>
            </div>

            <div>
              <span>Scheduled income remaining</span>
              <strong>
                {formatNu(
                  plan.scheduledIncomeRemainingChetrum,
                )}
              </strong>
              <small>
                Scheduled only. It is not treated as current cash.
              </small>
            </div>

            <div>
              <span>Scheduled expenses not recorded</span>
              <strong>
                {formatNu(
                  plan.scheduledExpenseRemainingChetrum,
                )}
              </strong>
              <small>
                {plan.scheduledExpenseCount}{' '}
                {plan.scheduledExpenseCount === 1
                  ? 'occurrence'
                  : 'occurrences'}{' '}
                remain unrecorded this month.
              </small>
            </div>

            <div>
              <span>Protected safety buffer</span>
              <strong>
                {formatNu(
                  plan.safeToSpend.safetyBufferChetrum,
                )}
              </strong>
              <small>
                Kept outside everyday planning room.
              </small>
            </div>

            <div>
              <span>Scheduled month outlook</span>
              <strong
                className={
                  plan.projectedMonthNetChetrum >= 0
                    ? 'income-text'
                    : ''
                }
              >
                {formatNu(
                  plan.projectedMonthNetChetrum,
                )}
              </strong>
              <small>
                Recorded month net plus remaining scheduled income
                minus unrecorded scheduled expenses.
              </small>
            </div>
          </div>

          <p className="my-month-disclosure">
            The scheduled month outlook is a planning estimate, not
            a bank balance. Scheduled income may not arrive and Money
            Saathi does not count it inside current Safe to Spend.
          </p>
        </section>

        <section
          className={
            needsAttention
              ? 'my-month-attention needs-attention'
              : 'my-month-attention'
          }
        >
          <div>
            <p className="dashboard-eyebrow">
              What deserves attention
            </p>

            <h2>
              {needsAttention
                ? 'A few parts of this month need review.'
                : 'No obvious monthly warning from the records you entered.'}
            </h2>

            <div className="my-month-attention-list">
              {plan.transactionCount === 0 && (
                <span>
                  No transactions are recorded yet. The plan cannot
                  infer money that has not been entered.
                </span>
              )}

              {plan.overdueExpenseCount > 0 && (
                <span>
                  {plan.overdueExpenseCount}{' '}
                  {plan.overdueExpenseCount === 1
                    ? 'scheduled expense is'
                    : 'scheduled expenses are'}{' '}
                  past their expected date but still unrecorded,
                  totalling{' '}
                  {formatNu(
                    plan.overdueExpenseChetrum,
                  )}.
                </span>
              )}

              {plan.safeToSpend.safeToSpendChetrum === 0 && (
                <span>
                  Current Safe to Spend is zero after known
                  commitments and the protected buffer.
                </span>
              )}

              {hasScheduledIncome && (
                <span>
                  {formatNu(
                    plan.scheduledIncomeRemainingChetrum,
                  )}{' '}
                  of scheduled income remains this month, but it is
                  not treated as available until you record it.
                </span>
              )}

              {!needsAttention &&
                !hasScheduledIncome && (
                  <span>
                    Keep records current because missing activity can
                    change the picture.
                  </span>
                )}
            </div>
          </div>

          <div className="my-month-attention-actions">
            <Link to="/app/transactions/new">
              Add money
            </Link>

            <Link to="/app/safety-buffer">
              Safety buffer
            </Link>
          </div>
        </section>

        <section className="my-month-saathi">
          <div>
            <p className="dashboard-eyebrow">
              Saathi perspective
            </p>

            <h2>
              Your month should stay grounded in recorded money.
            </h2>

            <p>
              Saathi can help explain affordability, spending,
              changes and debt, while My Month gives you the
              structured monthly picture underneath those answers.
            </p>
          </div>

          <Link to="/app/saathi/ask">
            Ask Saathi
          </Link>
        </section>

        <section className="my-month-horizon">
          <span>
            Safe to Spend horizon
          </span>

          <strong>
            {formatScheduleDate(
              plan.safeToSpend.horizonDate,
            )}
          </strong>

          <p>
            {plan.safeToSpend.nextExpectedIncomeDate
              ? `The horizon stops at the next scheduled income on ${formatScheduleDate(
                  plan.safeToSpend.nextExpectedIncomeDate,
                )}.`
              : `No next scheduled income is recorded, so Safe to Spend plans through ${formatScheduleDate(
                  plan.monthEnd,
                )}.`}
          </p>
        </section>
      </div>
    </AppShell>
  )
}

export default MyMonthPage