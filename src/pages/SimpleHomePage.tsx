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

    const recordedTransactions =
      data.transactions.filter(
        (transaction) =>
          transaction.date <= today,
      )

    const monthSummary =
      summarizeSimpleMonth(
        month,
        recordedTransactions,
      )

    const balance =
      transactionBalanceChetrum(
        recordedTransactions,
        today,
      )

    const safe =
      calculateSafeToSpend(
        today,
        balance,
        data.regularMoney,
        recordedTransactions,
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
        recordedTransactions.slice(0, 3),
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
      <div className="dashboard-container simple-home simple-home-focused">
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
              See what is safe to use, how this month is going
              and what happened recently.
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
            Your recorded balance after upcoming commitments
            and the safety buffer you chose.
          </p>

          <div className="simple-safe-facts">
            <span>
              Recorded{' '}
              <strong>
                {formatNu(view.balance)}
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
            <span>Came in</span>
            <strong className="income-text">
              {formatNu(
                view.monthSummary.incomeChetrum,
              )}
            </strong>
          </article>

          <article>
            <span>Went out</span>
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

        <nav
          className="simple-actions"
          aria-label="Simple Home actions"
        >
          <Link
            to="/app/transactions/new"
            className="simple-primary-action"
          >
            + Add money
          </Link>

          <Link to="/app/transactions">
            Transactions
          </Link>

          <Link to="/app/month">
            My Month
          </Link>

          <Link to="/app/goals">
            Goals
          </Link>

          <Link to="/app/more">
            More
          </Link>
        </nav>

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
                {formatNu(
                  view.firstGoalSaved,
                )}{' '}
                saved toward{' '}
                {formatNu(
                  view.firstGoal.targetChetrum,
                )}.
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
              Need another tool?
            </strong>

            <p>
              Budget, Regular Money, My Money, reports, privacy
              and data tools are kept under More.
            </p>
          </div>

          <Link to="/app/more">
            Open More
          </Link>
        </section>
      </div>
    </AppShell>
  )
}

export default SimpleHomePage







