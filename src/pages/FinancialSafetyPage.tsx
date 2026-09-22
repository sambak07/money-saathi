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
  EMERGENCY_TARGET_OPTIONS,
  getFinancialSafetyPreference,
  saveFinancialSafetyPreference,
  type EmergencyTargetMonths,
} from '../safety/financialSafetyPreference'
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
  buildFinancialSafetyPlan,
  formatCoverageTenths,
} from '../utils/financialSafety'
import {
  buildMoneyHealthSnapshot,
} from '../utils/moneyHealth'
import {
  formatNu,
  getLocalToday,
} from '../utils/money'
import {
  calculateSafeToSpend,
} from '../utils/safeToSpend'
import {
  transactionBalanceChetrum,
} from '../utils/simpleHome'

import '../styles/financial-safety.css'

interface FinancialSafetyData {
  transactions: MoneyTransaction[]
  regularMoney: RegularMoney[]
  potentiallyLiquidSavingsChetrum: number
}

function FinancialSafetyPage() {
  const [today] =
    useState(() => getLocalToday())

  const [preferences] =
    useState(() => getPreferences())

  const [targetMonths, setTargetMonths] =
    useState<EmergencyTargetMonths | null>(
      () =>
        getFinancialSafetyPreference()
          .targetMonths,
    )

  const [data, setData] =
    useState<FinancialSafetyData | null>(null)

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
          savingsAccounts,
        ] = await Promise.all([
          getTransactions(),
          getRegularMoney(),
          getSavingsAccounts(),
        ])

        if (!active) return

        const potentiallyLiquidSavingsChetrum =
          savingsAccounts.reduce(
            (sum, account) =>
              sum +
              account.balanceChetrum,
            0,
          )

        setData({
          transactions,
          regularMoney,
          potentiallyLiquidSavingsChetrum,
        })
      } catch {
        if (active) {
          setError(
            'Money Saathi could not prepare your financial safety plan.',
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

    const health =
      buildMoneyHealthSnapshot(
        month,
        data.transactions,
        data.potentiallyLiquidSavingsChetrum,
      )

    const plan =
      buildFinancialSafetyPlan(
        health.averageMonthlyExpenseChetrum,
        data.potentiallyLiquidSavingsChetrum,
        targetMonths,
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
      health,
      plan,
      safeToSpend,
    }
  }, [
    data,
    preferences.safetyBufferChetrum,
    targetMonths,
    today,
  ])

  function chooseTarget(
    months: EmergencyTargetMonths,
  ) {
    setTargetMonths(months)

    saveFinancialSafetyPreference({
      targetMonths: months,
    })

    setMessage(
      `${months}-month planning target saved on this device.`,
    )
  }

  if (loading) {
    return (
      <AppShell>
        <div className="dashboard-container">
          <div className="dashboard2-loading">
            Preparing your financial safety plan...
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
              'Money Saathi could not prepare your financial safety plan.'}
          </div>
        </div>
      </AppShell>
    )
  }

  const {
    plan,
    safeToSpend,
  } = view

  return (
    <AppShell>
      <div className="dashboard-container financial-safety-page">
        <header className="financial-safety-header">
          <div>
            <p className="dashboard-eyebrow">
              Prepare for the unexpected
            </p>

            <h1>Financial safety</h1>

            <p>
              See how much breathing room your recorded liquid
              savings may provide, then choose your own emergency
              planning horizon. Money Saathi does not prescribe a
              single target for everyone.
            </p>
          </div>

          <Link to="/app/money-health">
            Money health
          </Link>
        </header>

        {message && (
          <div
            className="financial-safety-message"
            role="status"
          >
            {message}
          </div>
        )}

        <section className="financial-safety-core">
          <article className="financial-safety-coverage">
            <span>
              Potential expense coverage
            </span>

            <strong>
              {formatCoverageTenths(
                plan.coverageMonthsTenths,
              )}
            </strong>

            <p>
              Based on Savings Account balances divided by recent
              average recorded monthly expenses.
            </p>
          </article>

          <article>
            <span>Potentially liquid savings</span>

            <strong>
              {formatNu(
                plan.potentiallyLiquidSavingsChetrum,
              )}
            </strong>

            <p>
              This uses balances entered under Savings Accounts.
              It does not include FD, RD, insurance cover or
              future benefits.
            </p>
          </article>

          <article>
            <span>Recent average monthly expense</span>

            <strong>
              {formatNu(
                plan.averageMonthlyExpenseChetrum,
              )}
            </strong>

            <p>
              Average of recent calendar months that contain
              recorded expenses.
            </p>
          </article>

          <article>
            <span>Safe to Spend now</span>

            <strong>
              {formatNu(
                safeToSpend.safeToSpendChetrum,
              )}
            </strong>

            <p>
              Separate from emergency coverage. It protects known
              upcoming commitments and your chosen safety buffer.
            </p>
          </article>
        </section>

        <section className="financial-safety-target">
          <div className="financial-safety-target-heading">
            <div>
              <p className="dashboard-eyebrow">
                Your choice
              </p>

              <h2>
                Choose an emergency planning horizon
              </h2>

              <p>
                There is no universal number here. Pick a horizon
                that fits your income stability, household needs
                and comfort level. You can change it anytime.
              </p>
            </div>

            {targetMonths && (
              <strong>
                {targetMonths} months selected
              </strong>
            )}
          </div>

          <div className="financial-safety-options">
            {EMERGENCY_TARGET_OPTIONS.map(
              (option) => (
                <button
                  key={option.months}
                  type="button"
                  className={
                    targetMonths === option.months
                      ? 'selected'
                      : ''
                  }
                  aria-pressed={
                    targetMonths === option.months
                  }
                  onClick={() =>
                    chooseTarget(option.months)
                  }
                >
                  <strong>
                    {option.label}
                  </strong>

                  <span>
                    {option.description}
                  </span>
                </button>
              ),
            )}
          </div>
        </section>

        <section className="financial-safety-target-result">
          {plan.targetChetrum === null ? (
            <div className="financial-safety-empty">
              <strong>
                Choose a target when you are ready.
              </strong>

              <p>
                Money Saathi will not assume an emergency-fund
                target for you.
              </p>
            </div>
          ) : (
            <>
              <article>
                <span>Your planning target</span>

                <strong>
                  {formatNu(
                    plan.targetChetrum,
                  )}
                </strong>
              </article>

              <article>
                <span>
                  {plan.gapChetrum &&
                  plan.gapChetrum > 0
                    ? 'Potential gap'
                    : 'Amount above chosen target'}
                </span>

                <strong>
                  {formatNu(
                    plan.gapChetrum &&
                      plan.gapChetrum > 0
                      ? plan.gapChetrum
                      : plan.aboveTargetChetrum ??
                          0,
                  )}
                </strong>
              </article>

              <article>
                <span>Target basis</span>

                <strong>
                  {targetMonths} × monthly expenses
                </strong>
              </article>
            </>
          )}
        </section>

        <section className="financial-safety-actions">
          <div>
            <strong>
              Want to build toward the target?
            </strong>

            <p>
              You can create a savings goal, but Money Saathi
              keeps the goal separate from your actual Savings
              Account balances to avoid double-counting wealth.
            </p>
          </div>

          <Link to="/app/goals">
            Open goals
          </Link>
        </section>

        <section className="financial-safety-guardrails">
          <div>
            <strong>
              Savings Account does not automatically mean emergency fund
            </strong>

            <p>
              Some savings may already be reserved for education,
              family commitments or another purpose. The coverage
              shown here is therefore potential liquidity, not a
              claim that all savings are available for emergencies.
            </p>
          </div>

          <div>
            <strong>
              Expense history matters
            </strong>

            <p>
              If expenses are missing or only partly recorded,
              the coverage estimate can be too high. Money Saathi
              shows “Not enough expense history” rather than
              inventing a result when no expense history exists.
            </p>
          </div>

          <div>
            <strong>
              Bhutan-first, life-first
            </strong>

            <p>
              A student, salaried household, farmer, shop owner
              and pensioner can reasonably choose different
              safety horizons. The app keeps that decision with
              the user.
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  )
}

export default FinancialSafetyPage
