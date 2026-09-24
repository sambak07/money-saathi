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
  buildStandardCashFlowForecasts,
} from '../utils/cashFlowForecast'
import {
  formatNu,
  getLocalToday,
} from '../utils/money'
import {
  formatScheduleDate,
} from '../utils/recurrence'

import '../styles/cash-flow-forecast.css'

interface ForecastData {
  transactions: MoneyTransaction[]
  regularMoney: RegularMoney[]
}

function CashFlowForecastPage() {
  const [today] =
    useState(() => getLocalToday())

  const [preferences] =
    useState(() => getPreferences())

  const [data, setData] =
    useState<ForecastData | null>(
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
            'Money Saathi could not prepare your cash-flow forecast.',
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

  const forecasts =
    useMemo(() => {
      if (!data) {
        return null
      }

      try {
        return buildStandardCashFlowForecasts(
          today,
          data.regularMoney,
          data.transactions,
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
            Preparing your forecast...
          </div>
        </div>
      </AppShell>
    )
  }

  if (
    error ||
    !forecasts
  ) {
    return (
      <AppShell>
        <div className="dashboard-container">
          <div
            className="dashboard2-error"
            role="alert"
          >
            {error ||
              'Money Saathi could not prepare your cash-flow forecast.'}
          </div>
        </div>
      </AppShell>
    )
  }

  const ninetyDay =
    forecasts[2]

  const pressure =
    ninetyDay.lowestAfterBufferChetrum <
      0

  const nextItems =
    ninetyDay.points.slice(
      0,
      8,
    )

  return (
    <AppShell>
      <div className="dashboard-container forecast-page">
        <header className="forecast-header">
          <div>
            <p className="dashboard-eyebrow">
              Forward planning
            </p>

            <h1>Cash-flow forecast</h1>

            <p>
              See a scheduled 30, 60 and 90-day money path from
              your recorded balance and Regular Money. This is a
              planning scenario, not a bank balance.
            </p>
          </div>

          <Link to="/app/month">
            Back to My Month
          </Link>
        </header>

        <section
          className="forecast-grid"
          aria-label="30, 60 and 90 day forecasts"
        >
          {forecasts.map(
            (forecast) => {
              const belowBuffer =
                forecast.lowestAfterBufferChetrum <
                0

              return (
                <article
                  key={forecast.daysAhead}
                  className={
                    belowBuffer
                      ? 'forecast-card pressure'
                      : 'forecast-card'
                  }
                >
                  <div className="forecast-card-heading">
                    <span>
                      {forecast.daysAhead} days
                    </span>

                    <small>
                      Through{' '}
                      {formatScheduleDate(
                        forecast.endDate,
                      )}
                    </small>
                  </div>

                  <strong>
                    {formatNu(
                      forecast.projectedEndBalanceChetrum,
                    )}
                  </strong>

                  <p>
                    Scheduled end balance if every listed Regular
                    Money event happens as entered.
                  </p>

                  <div className="forecast-card-facts">
                    <span>
                      Scheduled in
                      <strong className="income-text">
                        {formatNu(
                          forecast.scheduledIncomeChetrum,
                        )}
                      </strong>
                    </span>

                    <span>
                      Scheduled out
                      <strong>
                        {formatNu(
                          forecast.scheduledExpenseChetrum,
                        )}
                      </strong>
                    </span>

                    <span>
                      Lowest point
                      <strong>
                        {formatNu(
                          forecast.lowestProjectedBalanceChetrum,
                        )}
                      </strong>
                    </span>
                  </div>

                  <div className="forecast-card-status">
                    {belowBuffer
                      ? 'Scheduled cash falls below your protected safety buffer in this horizon.'
                      : 'Scheduled cash stays above your protected safety buffer in this horizon.'}
                  </div>
                </article>
              )
            },
          )}
        </section>

        <section
          className={
            pressure
              ? 'forecast-pressure needs-attention'
              : 'forecast-pressure'
          }
        >
          <div>
            <p className="dashboard-eyebrow">
              90-day pressure check
            </p>

            <h2>
              {pressure
                ? 'Your schedule crosses the protected buffer.'
                : 'Your recorded schedule stays above the protected buffer.'}
            </h2>

            <p>
              The lowest scheduled balance is{' '}
              <strong>
                {formatNu(
                  ninetyDay.lowestProjectedBalanceChetrum,
                )}
              </strong>
              {ninetyDay.lowestProjectedBalanceDate
                ? ` on ${formatScheduleDate(
                    ninetyDay.lowestProjectedBalanceDate,
                  )}`
                : ', based on the opening recorded balance'}.
              {' '}After preserving your safety buffer, the lowest
              planning margin is{' '}
              <strong>
                {formatNu(
                  ninetyDay.lowestAfterBufferChetrum,
                )}
              </strong>.
            </p>
          </div>

          <Link to="/app/safety-buffer">
            Review safety buffer
          </Link>
        </section>

        <section className="forecast-upcoming">
          <div className="forecast-section-heading">
            <div>
              <p className="dashboard-eyebrow">
                Next scheduled movements
              </p>

              <h2>
                What moves the forecast
              </h2>
            </div>

            <Link to="/app/regular-money">
              Edit Regular Money
            </Link>
          </div>

          {nextItems.length === 0 ? (
            <div className="forecast-empty">
              No unrecorded Regular Money events are scheduled in
              the next 90 days.
            </div>
          ) : (
            <div className="forecast-list">
              {nextItems.map(
                (point) => (
                  <div
                    key={point.item.id}
                    className="forecast-row"
                  >
                    <div>
                      <strong>
                        {point.item.name}
                      </strong>

                      <span>
                        {formatScheduleDate(
                          point.date,
                        )}{' '}
                        · {point.item.category}
                      </span>
                    </div>

                    <div>
                      <strong
                        className={
                          point.item.kind ===
                          'income'
                            ? 'income-text'
                            : ''
                        }
                      >
                        {point.item.kind ===
                        'income'
                          ? '+'
                          : '−'}
                        {formatNu(
                          point.item.amountChetrum,
                        )}
                      </strong>

                      <span>
                        Scheduled balance{' '}
                        {formatNu(
                          point.balanceChetrum,
                        )}
                      </span>
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </section>

        <section className="forecast-boundary">
          <p className="dashboard-eyebrow">
            What this forecast means
          </p>

          <h2>
            Scheduled money is not guaranteed money.
          </h2>

          <p>
            Future income is included here only to model a future
            scenario. It is never added to today&apos;s Safe to
            Spend until you actually record it. Loans, schemes or
            other obligations affect this forecast only when their
            payments are represented in Regular Money.
          </p>

          <div className="forecast-boundary-actions">
            <Link to="/app/month">
              Open My Month
            </Link>

            <Link to="/app/saathi/ask">
              Ask Saathi
            </Link>
          </div>
        </section>
      </div>
    </AppShell>
  )
}

export default CashFlowForecastPage