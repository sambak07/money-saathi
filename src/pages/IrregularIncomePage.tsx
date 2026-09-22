import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  Link,
} from 'react-router-dom'

import AppShell from '../components/AppShell'
import {
  getIrregularIncomePreference,
  saveIrregularIncomePreference,
} from '../irregularIncome/irregularIncomePreference'
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
  buildIrregularIncomeSnapshot,
  comparePlanningFloor,
} from '../utils/irregularIncome'
import {
  formatNu,
  getLocalToday,
} from '../utils/money'
import {
  calculateSafeToSpend,
  formatChetrumForSafetyInput,
  parseNuInputToChetrum,
} from '../utils/safeToSpend'
import {
  transactionBalanceChetrum,
} from '../utils/simpleHome'

import '../styles/irregular-income.css'

interface IrregularIncomeData {
  transactions: MoneyTransaction[]
  regularMoney: RegularMoney[]
}

function IrregularIncomePage() {
  const [today] =
    useState(() => getLocalToday())

  const [preferences] =
    useState(() => getPreferences())

  const [data, setData] =
    useState<IrregularIncomeData | null>(null)

  const [planningFloor, setPlanningFloor] =
    useState(() => {
      const value =
        getIrregularIncomePreference()
          .planningFloorChetrum

      return value > 0
        ? formatChetrumForSafetyInput(value)
        : ''
    })

  const [savedFloor, setSavedFloor] =
    useState(
      () =>
        getIrregularIncomePreference()
          .planningFloorChetrum,
    )

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  const [message, setMessage] =
    useState('')

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const [
          transactions,
          regularMoney,
        ] = await Promise.all([
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
            'Money Saathi could not prepare your irregular-income view.',
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

    const rhythm =
      buildIrregularIncomeSnapshot(
        today.slice(0, 7),
        data.transactions,
      )

    const floorComparison =
      comparePlanningFloor(
        savedFloor,
        rhythm.currentMonthIncomeChetrum,
      )

    const safeToSpend =
      calculateSafeToSpend(
        today,
        transactionBalanceChetrum(
          data.transactions,
        ),
        data.regularMoney,
        data.transactions,
        preferences.safetyBufferChetrum,
      )

    return {
      rhythm,
      floorComparison,
      safeToSpend,
    }
  }, [
    data,
    preferences.safetyBufferChetrum,
    savedFloor,
    today,
  ])

  function saveFloor(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!planningFloor.trim()) {
      saveIrregularIncomePreference({
        planningFloorChetrum: 0,
      })

      setSavedFloor(0)
      setMessage(
        'Monthly planning floor cleared.',
      )
      return
    }

    const parsed =
      parseNuInputToChetrum(
        planningFloor,
      )

    if (
      parsed === null ||
      parsed < 0
    ) {
      setError(
        'Enter a valid Ngultrum amount.',
      )
      return
    }

    saveIrregularIncomePreference({
      planningFloorChetrum: parsed,
    })

    setSavedFloor(parsed)

    setMessage(
      'Monthly planning floor saved on this device.',
    )
  }

  if (loading) {
    return (
      <AppShell>
        <div className="dashboard-container">
          <div className="dashboard2-loading">
            Preparing your income rhythm...
          </div>
        </div>
      </AppShell>
    )
  }

  if (error && !view) {
    return (
      <AppShell>
        <div className="dashboard-container">
          <div
            className="dashboard2-error"
            role="alert"
          >
            {error}
          </div>
        </div>
      </AppShell>
    )
  }

  if (!view) {
    return null
  }

  const {
    rhythm,
    floorComparison,
    safeToSpend,
  } = view

  return (
    <AppShell>
      <div className="dashboard-container irregular-income-page">
        <header className="irregular-income-header">
          <div>
            <p className="dashboard-eyebrow">
              Income does not have to arrive like a salary
            </p>

            <h1>Irregular income</h1>

            <p>
              For farmers, freelancers, taxi drivers, contractors,
              traders, seasonal workers and anyone whose income
              changes from month to month. Money Saathi shows
              recorded patterns without pretending it can predict
              your next income.
            </p>
          </div>

          <Link to="/app/financial-safety">
            Financial safety
          </Link>
        </header>

        {message && (
          <div
            className="irregular-income-message"
            role="status"
          >
            {message}
          </div>
        )}

        {error && (
          <div
            className="irregular-income-error"
            role="alert"
          >
            {error}
          </div>
        )}

        <section className="irregular-income-core">
          <article>
            <span>Income this month</span>

            <strong className="income-text">
              {formatNu(
                rhythm.currentMonthIncomeChetrum,
              )}
            </strong>

            <p>
              Recorded income only.
            </p>
          </article>

          <article>
            <span>
              Average across active months
            </span>

            <strong>
              {formatNu(
                rhythm.averageIncomeAcrossActiveMonthsChetrum,
              )}
            </strong>

            <p>
              Uses only months in this six-month view that contain
              recorded income or expenses. It is history, not a
              forecast.
            </p>
          </article>

          <article>
            <span>Lowest positive month</span>

            <strong>
              {rhythm.lowestPositiveIncomeChetrum ===
              null
                ? 'No income history'
                : formatNu(
                    rhythm.lowestPositiveIncomeChetrum,
                  )}
            </strong>

            <p>
              Lowest month with recorded income in this view.
            </p>
          </article>

          <article>
            <span>Highest month</span>

            <strong>
              {rhythm.highestIncomeChetrum ===
              null
                ? 'No income history'
                : formatNu(
                    rhythm.highestIncomeChetrum,
                  )}
            </strong>

            <p>
              Highest recorded income month in this view.
            </p>
          </article>
        </section>

        <section className="irregular-floor-card">
          <div>
            <p className="dashboard-eyebrow">
              Your own planning number
            </p>

            <h2>
              Monthly planning floor
            </h2>

            <p>
              Optional. Enter an amount you personally want to
              plan around in a normal month. Money Saathi will
              compare this month’s recorded income with that
              number, but it will never call the number a
              guaranteed income forecast.
            </p>
          </div>

          <form onSubmit={saveFloor}>
            <label htmlFor="irregular-floor">
              Amount (Nu.)
            </label>

            <div>
              <input
                id="irregular-floor"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                placeholder="e.g. 30000"
                value={planningFloor}
                onChange={(event) =>
                  setPlanningFloor(
                    event.target.value,
                  )
                }
              />

              <button type="submit">
                Save
              </button>
            </div>

            <small>
              Leave blank and save to clear it.
            </small>
          </form>
        </section>

        {savedFloor > 0 && (
          <section className="irregular-floor-result">
            <article>
              <span>Your planning floor</span>

              <strong>
                {formatNu(
                  floorComparison.floorChetrum,
                )}
              </strong>
            </article>

            <article>
              <span>
                {floorComparison.remainingToFloorChetrum >
                0
                  ? 'Below your floor by'
                  : 'Above your floor by'}
              </span>

              <strong>
                {formatNu(
                  floorComparison.remainingToFloorChetrum >
                  0
                    ? floorComparison.remainingToFloorChetrum
                    : floorComparison.amountAboveFloorChetrum,
                )}
              </strong>
            </article>

            <article>
              <span>Safe to Spend now</span>

              <strong>
                {formatNu(
                  safeToSpend.safeToSpendChetrum,
                )}
              </strong>
            </article>
          </section>
        )}

        <section className="irregular-history">
          <div className="irregular-history-heading">
            <div>
              <p className="dashboard-eyebrow">
                Six-month rhythm
              </p>

              <h2>
                Recorded income and expenses
              </h2>
            </div>

            <span>
              {rhythm.activeMonths} active{' '}
              {rhythm.activeMonths === 1
                ? 'month'
                : 'months'}
            </span>
          </div>

          <div className="irregular-history-grid">
            {rhythm.months.map(
              (month) => (
                <article key={month.month}>
                  <strong>
                    {month.month}
                  </strong>

                  <div>
                    <span>In</span>
                    <strong className="income-text">
                      {formatNu(
                        month.incomeChetrum,
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Out</span>
                    <strong>
                      {formatNu(
                        month.expenseChetrum,
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Difference</span>
                    <strong
                      className={
                        month.netChetrum >= 0
                          ? 'income-text'
                          : ''
                      }
                    >
                      {formatNu(
                        month.netChetrum,
                      )}
                    </strong>
                  </div>
                </article>
              ),
            )}
          </div>
        </section>

        <section className="irregular-income-actions">
          <Link
            to="/app/transactions/new"
            className="primary"
          >
            Record income
          </Link>

          <Link to="/app/upcoming">
            Upcoming money
          </Link>

          <Link to="/app/financial-safety">
            Build safety
          </Link>

          <Link to="/app/regular-money">
            Regular commitments
          </Link>
        </section>

        <section className="irregular-income-guardrails">
          <div>
            <strong>
              No future income is added before it arrives
            </strong>

            <p>
              Even if you normally earn around a certain amount,
              future income stays outside Safe to Spend until you
              actually record it.
            </p>
          </div>

          <div>
            <strong>
              Zero-income months are not failure
            </strong>

            <p>
              Seasonal and assignment-based work can naturally
              produce quiet months. Money Saathi shows the record
              without grading or shaming the user.
            </p>
          </div>

          <div>
            <strong>
              Bhutan has many income rhythms
            </strong>

            <p>
              Salary is only one pattern. Farming, transport,
              contracting, trade, tourism, freelance work and
              family enterprises can all create uneven income.
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  )
}

export default IrregularIncomePage

