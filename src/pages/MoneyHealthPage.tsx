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
  getSavingsAccounts,
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
  buildMoneyHealthSnapshot,
  formatCoverageMonths,
} from '../utils/moneyHealth'
import {
  calculateSafeToSpend,
} from '../utils/safeToSpend'

import '../styles/money-health.css'

interface MoneyHealthData {
  transactions: MoneyTransaction[]
  regularMoney: RegularMoney[]
  liquidSavingsChetrum: number
}

function MoneyHealthPage() {
  const [today] =
    useState(() => getLocalToday())

  const [preferences] =
    useState(() => getPreferences())

  const [data, setData] =
    useState<MoneyHealthData | null>(null)

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
          savingsAccounts,
        ] = await Promise.all([
          getTransactions(),
          getRegularMoney(),
          getSavingsAccounts(),
        ])

        if (!active) return

        const liquidSavingsChetrum =
          savingsAccounts.reduce(
            (sum, account) =>
              sum +
              account.balanceChetrum,
            0,
          )

        setData({
          transactions,
          regularMoney,
          liquidSavingsChetrum,
        })
      } catch {
        if (active) {
          setError(
            'Money Saathi could not prepare your money health view.',
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

    const currentMonth =
      today.slice(0, 7)

    const health =
      buildMoneyHealthSnapshot(
        currentMonth,
        data.transactions,
        data.liquidSavingsChetrum,
      )

    const allTimeIncome =
      data.transactions
        .filter(
          (item) =>
            item.kind === 'income',
        )
        .reduce(
          (sum, item) =>
            sum +
            item.amountChetrum,
          0,
        )

    const allTimeExpense =
      data.transactions
        .filter(
          (item) =>
            item.kind === 'expense',
        )
        .reduce(
          (sum, item) =>
            sum +
            item.amountChetrum,
          0,
        )

    const safeToSpend =
      calculateSafeToSpend(
        today,
        allTimeIncome -
          allTimeExpense,
        data.regularMoney,
        data.transactions,
        preferences.safetyBufferChetrum,
      )

    return {
      health,
      safeToSpend,
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
            Preparing your money health...
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
              'Money Saathi could not prepare your money health.'}
          </div>
        </div>
      </AppShell>
    )
  }

  const {
    health,
    safeToSpend,
  } = view

  const cashFlowText =
    health.currentMonth.netChetrum > 0
      ? 'More money has come in than gone out this month.'
      : health.currentMonth.netChetrum < 0
        ? 'More money has gone out than come in this month.'
        : 'Recorded money in and out are equal this month.'

  const consistencyText =
    health.positiveNetMonths === 3
      ? 'All 3 recent months ended with positive recorded cash flow.'
      : `${health.positiveNetMonths} of the last 3 months ended with positive recorded cash flow.`

  return (
    <AppShell>
      <div className="dashboard-container money-health-page">
        <header className="money-health-header">
          <div>
            <p className="dashboard-eyebrow">
              Understand, do not judge
            </p>

            <h1>Money health</h1>

            <p>
              No hidden score. Money Saathi shows the numbers
              behind each signal so you can decide what matters
              for your situation.
            </p>
          </div>

          <Link to="/app/reports">
            Open reports
          </Link>
        </header>

        <section className="money-health-principle">
          <strong>
            There is no “good person” or “bad with money” score here.
          </strong>

          <span>
            Income can be irregular, expenses can be seasonal,
            and life situations differ. These are recorded
            financial signals, not a judgment about you.
          </span>
        </section>

        <section className="money-health-grid">
          <article className="money-health-card">
            <span>Current cash flow</span>

            <strong
              className={
                health.currentMonth.netChetrum >=
                0
                  ? 'income-text'
                  : ''
              }
            >
              {formatNu(
                health.currentMonth.netChetrum,
              )}
            </strong>

            <p>{cashFlowText}</p>

            <div className="money-health-detail">
              <span>
                In{' '}
                <strong>
                  {formatNu(
                    health.currentMonth.incomeChetrum,
                  )}
                </strong>
              </span>

              <span>
                Out{' '}
                <strong>
                  {formatNu(
                    health.currentMonth.expenseChetrum,
                  )}
                </strong>
              </span>
            </div>
          </article>

          <article className="money-health-card">
            <span>Recent consistency</span>

            <strong>
              {health.positiveNetMonths}/3 months
            </strong>

            <p>
              {consistencyText}
            </p>

            <small>
              Based only on the three calendar months shown
              below.
            </small>
          </article>

          <article className="money-health-card">
            <span>Emergency coverage</span>

            <strong>
              {formatCoverageMonths(
                health.emergencyCoverageMonthsTenths,
              )}
            </strong>

            <p>
              Liquid savings divided by average recorded monthly
              expenses across recent months that contain expenses.
            </p>

            <div className="money-health-detail">
              <span>
                Liquid savings{' '}
                <strong>
                  {formatNu(
                    health.liquidSavingsChetrum,
                  )}
                </strong>
              </span>

              <span>
                Avg. expense{' '}
                <strong>
                  {formatNu(
                    health.averageMonthlyExpenseChetrum,
                  )}
                </strong>
              </span>
            </div>
          </article>

          <article className="money-health-card">
            <span>Safe to Spend</span>

            <strong>
              {formatNu(
                safeToSpend.safeToSpendChetrum,
              )}
            </strong>

            <p>
              Recorded balance after upcoming commitments and
              your protected safety buffer.
            </p>

            <div className="money-health-detail">
              <span>
                Commitments{' '}
                <strong>
                  {formatNu(
                    safeToSpend.upcomingCommitmentsChetrum,
                  )}
                </strong>
              </span>

              <span>
                Buffer{' '}
                <strong>
                  {formatNu(
                    safeToSpend.safetyBufferChetrum,
                  )}
                </strong>
              </span>
            </div>
          </article>
        </section>

        <section className="money-health-history">
          <div className="money-health-section-heading">
            <div>
              <p className="dashboard-eyebrow">
                Evidence
              </p>

              <h2>
                Last 3 calendar months
              </h2>
            </div>

            <Link to="/app/transactions">
              Review transactions
            </Link>
          </div>

          <div className="money-health-months">
            {health.recentMonths.map(
              (month) => (
                <article key={month.month}>
                  <span>{month.month}</span>

                  <div>
                    <small>Money in</small>
                    <strong className="income-text">
                      {formatNu(
                        month.incomeChetrum,
                      )}
                    </strong>
                  </div>

                  <div>
                    <small>Money out</small>
                    <strong>
                      {formatNu(
                        month.expenseChetrum,
                      )}
                    </strong>
                  </div>

                  <div>
                    <small>Net</small>
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

        <section className="money-health-explainer">
          <div>
            <strong>
              What counts as liquid savings?
            </strong>

            <p>
              Only balances entered under Savings Accounts.
              Fixed deposits, recurring deposits, insurance
              protection and future scheme benefits are not
              treated as emergency cash here.
            </p>
          </div>

          <div>
            <strong>
              What does Money Saathi not know?
            </strong>

            <p>
              It only knows the money you record. Missing cash,
              unentered expenses, informal debt or assets outside
              Money Saathi can change your real financial picture.
            </p>
          </div>

          <div>
            <strong>
              Why no single score?
            </strong>

            <p>
              A single number can hide important differences.
              Money Saathi keeps cash flow, liquidity and
              commitments visible separately.
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  )
}

export default MoneyHealthPage
