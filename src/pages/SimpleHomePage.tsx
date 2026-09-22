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
  getGoalContributions,
  getGoals,
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
  getGoalSaved,
} from '../utils/goals'
import {
  formatNu,
  getLocalToday,
} from '../utils/money'
import {
  calculateSafeToSpend,
} from '../utils/safeToSpend'
import {
  summarizeSimpleMonth,
  transactionBalanceChetrum,
} from '../utils/simpleHome'

import '../styles/simple-home.css'

interface SimpleHomeData {
  transactions: MoneyTransaction[]
  regularMoney: RegularMoney[]
  goals: Awaited<
    ReturnType<typeof getGoals>
  >
  goalContributions: Awaited<
    ReturnType<typeof getGoalContributions>
  >
}

function SimpleHomePage() {
  const [today] =
    useState(() => getLocalToday())

  const [preferences] =
    useState(() => getPreferences())

  const [data, setData] =
    useState<SimpleHomeData | null>(null)

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
          goals,
          goalContributions,
        ] = await Promise.all([
          getTransactions(),
          getRegularMoney(),
          getGoals(),
          getGoalContributions(),
        ])

        if (!active) return

        setData({
          transactions,
          regularMoney,
          goals,
          goalContributions,
        })
      } catch {
        if (active) {
          setError(
            'Money Saathi could not prepare your simple Home.',
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

    const month =
      today.slice(0, 7)

    const monthSummary =
      summarizeSimpleMonth(
        month,
        data.transactions,
      )

    const balance =
      transactionBalanceChetrum(
        data.transactions,
      )

    const safe =
      calculateSafeToSpend(
        today,
        balance,
        data.regularMoney,
        data.transactions,
        preferences.safetyBufferChetrum,
      )

    const firstGoal =
      data.goals[0] ?? null

    const firstGoalSaved =
      firstGoal
        ? getGoalSaved(
            firstGoal.id,
            data.goalContributions,
          )
        : 0

    return {
      monthSummary,
      balance,
      safe,
      firstGoal,
      firstGoalSaved,
      recentTransactions:
        data.transactions.slice(0, 3),
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
            Loading your money...
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
              'Money Saathi could not prepare your Home.'}
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="dashboard-container simple-home">
        <header className="simple-home-header">
          <div>
            <p className="dashboard-eyebrow">
              Your money, made simple
            </p>

            <h1>
              {preferences.displayName
                ? `Hi, ${preferences.displayName}`
                : 'Home'}
            </h1>

            <p>
              See what you can use, what came in and what went
              out. Nothing complicated.
            </p>
          </div>

          <Link to="/app/setup">
            Change Home view
          </Link>
        </header>

        <section className="simple-safe-card">
          <span>Safe to Spend</span>

          <strong>
            {formatNu(
              view.safe.safeToSpendChetrum,
            )}
          </strong>

          <p>
            This is your recorded balance after upcoming
            commitments and the safety buffer you chose.
          </p>

          <div className="simple-safe-facts">
            <span>
              Recorded balance{' '}
              <strong>
                {formatNu(
                  view.balance,
                )}
              </strong>
            </span>

            <span>
              Coming out{' '}
              <strong>
                {formatNu(
                  view.safe.upcomingCommitmentsChetrum,
                )}
              </strong>
            </span>

            <span>
              Protected{' '}
              <strong>
                {formatNu(
                  view.safe.safetyBufferChetrum,
                )}
              </strong>
            </span>
          </div>

          <Link to="/app/safety-buffer">
            {view.safe.safetyBufferChetrum > 0
              ? 'Adjust protected amount'
              : 'Protect some money'}
          </Link>
        </section>

        <section className="simple-month-grid">
          <article>
            <span>Came in this month</span>
            <strong className="income-text">
              {formatNu(
                view.monthSummary.incomeChetrum,
              )}
            </strong>
          </article>

          <article>
            <span>Went out this month</span>
            <strong>
              {formatNu(
                view.monthSummary.expenseChetrum,
              )}
            </strong>
          </article>

          <article>
            <span>Difference</span>
            <strong
              className={
                view.monthSummary.netChetrum >= 0
                  ? 'income-text'
                  : ''
              }
            >
              {formatNu(
                view.monthSummary.netChetrum,
              )}
            </strong>
          </article>
        </section>

        <section className="simple-actions">
          <Link
            to="/app/transactions/new"
            className="simple-primary-action"
          >
            + Add money
          </Link>

          <Link to="/app/upcoming">
            What is coming?
          </Link>
          <Link to="/app/financial-safety">
            My safety
          </Link>
          <Link to="/app/irregular-income">
            Income rhythm
          </Link>

          <Link to="/app/goals">
            My goals
          </Link>

          <Link to="/app/transactions">
            All activity
          </Link>
        </section>

        {view.firstGoal && (
          <section className="simple-goal-card">
            <div>
              <p className="dashboard-eyebrow">
                One goal at a time
              </p>

              <h2>
                {view.firstGoal.name}
              </h2>

              <p>
                You have recorded{' '}
                <strong>
                  {formatNu(
                    view.firstGoalSaved,
                  )}
                </strong>
                {' '}toward a target of{' '}
                <strong>
                  {formatNu(
                    view.firstGoal.targetChetrum,
                  )}
                </strong>
                .
              </p>
            </div>

            <Link to="/app/goals">
              Open goals
            </Link>
          </section>
        )}

        <section className="simple-recent">
          <div className="simple-section-heading">
            <div>
              <p className="dashboard-eyebrow">
                Latest
              </p>

              <h2>Recent money</h2>
            </div>

            <Link to="/app/transactions">
              View all
            </Link>
          </div>

          {view.recentTransactions.length === 0 ? (
            <div className="simple-empty">
              No money recorded yet. Start with one income or
              expense.
            </div>
          ) : (
            <div className="simple-recent-list">
              {view.recentTransactions.map(
                (transaction) => (
                  <div
                    key={transaction.id}
                    className="simple-recent-row"
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
                  </div>
                ),
              )}
            </div>
          )}
        </section>

        <section className="simple-home-footer">
          <div>
            <strong>
              Want more detail?
            </strong>

            <p>
              Full Home includes budgets, loans, assets,
              schemes, reports and more. Your data is the same
              in both views.
            </p>
          </div>

          <Link to="/app/setup">
            Choose Full Home
          </Link>
        </section>
      </div>
    </AppShell>
  )
}

export default SimpleHomePage


