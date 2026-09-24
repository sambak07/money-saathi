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
  getLoans,
  getSavingsAccounts,
} from '../storage/db'
import type {
  SavingsAccount,
} from '../types/asset'
import type {
  Goal,
  GoalContribution,
} from '../types/goal'
import type {
  Loan,
} from '../types/loan'
import {
  formatRateBps,
} from '../utils/assets'
import {
  buildDebtGoalPlan,
} from '../utils/debtGoalPlan'
import {
  formatGoalDate,
} from '../utils/goals'
import {
  formatNu,
  getLocalToday,
} from '../utils/money'

import '../styles/debt-goal-plan.css'

interface PlanningData {
  loans: Loan[]
  savingsAccounts: SavingsAccount[]
  goals: Goal[]
  goalContributions: GoalContribution[]
}

function DebtGoalPlanPage() {
  const [today] =
    useState(() => getLocalToday())

  const [data, setData] =
    useState<PlanningData | null>(
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
          loans,
          savingsAccounts,
          goals,
          goalContributions,
        ] =
          await Promise.all([
            getLoans(),
            getSavingsAccounts(),
            getGoals(),
            getGoalContributions(),
          ])

        if (!active) return

        setData({
          loans,
          savingsAccounts,
          goals,
          goalContributions,
        })
      } catch {
        if (active) {
          setError(
            'Money Saathi could not prepare debt and goal planning.',
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
        return buildDebtGoalPlan(
          today,
          data.loans,
          data.savingsAccounts,
          data.goals,
          data.goalContributions,
        )
      } catch {
        return null
      }
    }, [
      data,
      today,
    ])

  if (loading) {
    return (
      <AppShell>
        <div className="dashboard-container">
          <div className="dashboard2-loading">
            Preparing debt and goals...
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
              'Money Saathi could not prepare debt and goal planning.'}
          </div>
        </div>
      </AppShell>
    )
  }

  const hasDebt =
    plan.activeLoanCount >
    0

  const hasGoals =
    plan.goalCount >
    0

  return (
    <AppShell>
      <div className="dashboard-container debt-goal-page">
        <header className="debt-goal-header">
          <div>
            <p className="dashboard-eyebrow">
              Debt and savings goals
            </p>

            <h1>Plan what comes next</h1>

            <p>
              Put recorded loans, liquid savings and goals in one
              place. Money Saathi shows the numbers without deciding
              for you how to use your savings or which debt to repay.
            </p>
          </div>

          <div className="debt-goal-header-actions">
            <Link to="/app/month">
              My Month
            </Link>

            <Link to="/app/forecast">
              Cash-flow forecast
            </Link>
          </div>
        </header>

        <section
          className="debt-goal-summary-grid"
          aria-label="Debt and goal summary"
        >
          <article>
            <span>Outstanding debt</span>

            <strong>
              {formatNu(
                plan.outstandingPrincipalChetrum,
              )}
            </strong>

            <p>
              Current outstanding principal from active loans you
              recorded.
            </p>
          </article>

          <article>
            <span>Recorded monthly EMIs</span>

            <strong>
              {formatNu(
                plan.monthlyEmiChetrum,
              )}
            </strong>

            <p>
              Sum of EMI fields on active loans. This is not added
              to cash flow unless the payments also exist in Regular
              Money.
            </p>
          </article>

          <article>
            <span>Goal amount still needed</span>

            <strong>
              {formatNu(
                plan.totalGoalRemainingChetrum,
              )}
            </strong>

            <p>
              Goal targets minus contributions you have recorded.
            </p>
          </article>

          <article className="emphasized">
            <span>Dated goal monthly pace</span>

            <strong>
              {formatNu(
                plan.datedGoalMonthlyNeedChetrum,
              )}
            </strong>

            <p>
              Simple average needed per calendar month for unfinished
              goals that still have a future target date.
            </p>
          </article>
        </section>

        <section className="debt-goal-debt-card">
          <div className="debt-goal-section-heading">
            <div>
              <p className="dashboard-eyebrow">
                Debt picture
              </p>

              <h2>
                Understand the obligation before changing it
              </h2>
            </div>

            <Link to="/app/my-money/loans">
              Manage loans
            </Link>
          </div>

          {!hasDebt ? (
            <div className="debt-goal-empty">
              No active loans are recorded.
            </div>
          ) : (
            <>
              <div className="debt-goal-facts">
                <div>
                  <span>Active loans</span>
                  <strong>
                    {plan.activeLoanCount}
                  </strong>
                </div>

                <div>
                  <span>Liquid savings accounts</span>
                  <strong>
                    {formatNu(
                      plan.liquidSavingsChetrum,
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Principal less liquid savings
                  </span>
                  <strong>
                    {formatNu(
                      plan.principalLessLiquidSavingsChetrum,
                    )}
                  </strong>
                </div>

                <div>
                  <span>Loans missing EMI</span>
                  <strong>
                    {plan.loansMissingEmiCount}
                  </strong>
                </div>
              </div>

              {plan.highestRateLoan && (
                <div className="debt-goal-rate-note">
                  <strong>
                    Highest recorded annual rate:{' '}
                    {plan.highestRateLoan.name}
                  </strong>

                  <span>
                    {formatRateBps(
                      plan.highestRateLoan.annualRateBps,
                    )}{' '}
                    · outstanding{' '}
                    {formatNu(
                      plan.highestRateLoan.outstandingPrincipalChetrum,
                    )}
                  </span>

                  <p>
                    This is a factual comparison of rates you entered,
                    not a recommendation to repay this loan first.
                    Liquidity, penalties, loan terms and emergency
                    needs can matter too.
                  </p>
                </div>
              )}
            </>
          )}
        </section>

        <section className="debt-goal-goals-card">
          <div className="debt-goal-section-heading">
            <div>
              <p className="dashboard-eyebrow">
                Goal funding pace
              </p>

              <h2>
                What your recorded targets imply
              </h2>
            </div>

            <Link to="/app/goals">
              Manage goals
            </Link>
          </div>

          {!hasGoals ? (
            <div className="debt-goal-empty">
              No goals are recorded yet.
            </div>
          ) : (
            <div className="debt-goal-goal-list">
              {plan.goalPlans.map(
                (goal) => (
                  <article
                    key={goal.id}
                    className={
                      goal.targetPast
                        ? 'debt-goal-goal-row overdue'
                        : 'debt-goal-goal-row'
                    }
                  >
                    <div>
                      <strong>
                        {goal.name}
                      </strong>

                      <span>
                        {goal.targetDate
                          ? formatGoalDate(
                              goal.targetDate,
                            )
                          : 'No target date'}
                      </span>
                    </div>

                    <div>
                      <span>Saved</span>
                      <strong className="income-text">
                        {formatNu(
                          goal.savedChetrum,
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>Remaining</span>
                      <strong>
                        {formatNu(
                          goal.remainingChetrum,
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>Average monthly pace</span>

                      <strong>
                        {goal.targetReached
                          ? 'Reached'
                          : goal.targetPast
                            ? 'Target passed'
                            : goal.averageMonthlyNeededChetrum ===
                                null
                              ? 'No target date'
                              : formatNu(
                                  goal.averageMonthlyNeededChetrum,
                                )}
                      </strong>
                    </div>
                  </article>
                ),
              )}
            </div>
          )}

          {hasGoals && (
            <div className="debt-goal-goal-notes">
              <span>
                {plan.reachedGoalCount}{' '}
                {plan.reachedGoalCount === 1
                  ? 'goal reached'
                  : 'goals reached'}
              </span>

              <span>
                {plan.overdueGoalCount}{' '}
                {plan.overdueGoalCount === 1
                  ? 'unfinished goal past target'
                  : 'unfinished goals past target'}
              </span>

              <span>
                {plan.goalsWithoutTargetDateCount}{' '}
                {plan.goalsWithoutTargetDateCount === 1
                  ? 'unfinished goal without a target date'
                  : 'unfinished goals without target dates'}
              </span>
            </div>
          )}
        </section>

        <section className="debt-goal-boundary">
          <div>
            <p className="dashboard-eyebrow">
              Planning boundary
            </p>

            <h2>
              This page does not move your money.
            </h2>

            <p>
              Goal pace is a simple arithmetic average based on the
              amount still needed and the calendar months through the
              target month. It assumes no investment return. Loan
              balances remain manual because an EMI contains
              principal and interest, so Money Saathi does not
              subtract the whole EMI from principal.
            </p>
          </div>

          <Link to="/app/saathi/ask">
            Ask Saathi
          </Link>
        </section>
      </div>
    </AppShell>
  )
}

export default DebtGoalPlanPage