import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import { Link } from 'react-router-dom'

import AppShell from '../components/AppShell'
import {
  getBudgets,
  getFinancialSchemes,
  getFixedDeposits,
  getGoalContributions,
  getGoals,
  getLoans,
  getRecurringDeposits,
  getRegularMoney,
  getSavingsAccounts,
  getTransactions,
} from '../storage/db'
import {
  MONEY_NEEDS,
  getProfile,
} from '../profile/userProfile'
import { getPreferences } from '../settings/preferences'
import type { Budget } from '../types/budget'
import type { FinancialScheme } from '../types/scheme'
import type { RegularMoney } from '../types/regularMoney'
import type { MoneyTransaction } from '../types/transaction'
import {
  multiplyChetrum,
} from '../utils/assets'
import {
  getGoalSaved,
} from '../utils/goals'
import {
  formatNu,
  getLocalToday,
} from '../utils/money'
import {
  formatScheduleDate,
  generateOccurrencesBetween,
  getMonthBounds,
  getNextOccurrence,
} from '../utils/recurrence'
import {
  annualContributionChetrum,
} from '../utils/schemes'
import {
  calculateSafeToSpend,
} from '../utils/safeToSpend'

import '../styles/dashboard2.css'

interface DashboardData {
  transactions: MoneyTransaction[]
  budgets: Budget[]
  regularMoney: RegularMoney[]
  goals: Awaited<ReturnType<typeof getGoals>>
  goalContributions: Awaited<
    ReturnType<typeof getGoalContributions>
  >
  savings: Awaited<ReturnType<typeof getSavingsAccounts>>
  fixedDeposits: Awaited<
    ReturnType<typeof getFixedDeposits>
  >
  recurringDeposits: Awaited<
    ReturnType<typeof getRecurringDeposits>
  >
  loans: Awaited<ReturnType<typeof getLoans>>
  schemes: FinancialScheme[]
}

function DashboardPage() {
  const [today] = useState(() => getLocalToday())

  const [preferences] = useState(
    () => getPreferences(),
  )
  const [profile] = useState(
    () => getProfile(),
  )
  const currentMonth = today.slice(0, 7)

  const [data, setData] =
    useState<DashboardData | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const [
          transactions,
          budgets,
          regularMoney,
          goals,
          goalContributions,
          savings,
          fixedDeposits,
          recurringDeposits,
          loans,
          schemes,
        ] = await Promise.all([
          getTransactions(),
          getBudgets(currentMonth),
          getRegularMoney(),
          getGoals(),
          getGoalContributions(),
          getSavingsAccounts(),
          getFixedDeposits(),
          getRecurringDeposits(),
          getLoans(),
          getFinancialSchemes(),
        ])

        if (!active) return

        setData({
          transactions,
          budgets,
          regularMoney,
          goals,
          goalContributions,
          savings,
          fixedDeposits,
          recurringDeposits,
          loans,
          schemes,
        })
      } catch {
        if (active) {
          setError(
            'Money Saathi could not load your dashboard.',
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
  }, [currentMonth])

  const dashboard = useMemo(() => {
    if (!data) return null

    const monthTransactions =
      data.transactions.filter(
        (item) =>
          item.date.slice(0, 7) ===
          currentMonth,
      )

    const monthlyIncome =
      monthTransactions
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

    const monthlyExpense =
      monthTransactions
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

    const transactionBalance =
      allTimeIncome -
      allTimeExpense
    const safeToSpend =
      calculateSafeToSpend(
        today,
        transactionBalance,
        data.regularMoney,
        data.transactions,
        preferences.safetyBufferChetrum,
      )

    const budgetByCategory =
      new Map(
        data.budgets.map(
          (budget) => [
            budget.category,
            budget.limitChetrum,
          ],
        ),
      )

    const budgetSpentByCategory =
      new Map<string, number>()

    for (const transaction of monthTransactions) {
      if (
        transaction.kind !== 'expense' ||
        !budgetByCategory.has(
          transaction.category,
        )
      ) {
        continue
      }

      const current =
        budgetSpentByCategory.get(
          transaction.category,
        ) ?? 0

      budgetSpentByCategory.set(
        transaction.category,
        current +
          transaction.amountChetrum,
      )
    }

    const budgetPlanned =
      data.budgets.reduce(
        (sum, budget) =>
          sum +
          budget.limitChetrum,
        0,
      )

    const budgetSpent =
      Array.from(
        budgetSpentByCategory.values(),
      ).reduce(
        (sum, amount) =>
          sum + amount,
        0,
      )

    const overBudgetCategories =
      data.budgets.filter(
        (budget) =>
          (
            budgetSpentByCategory.get(
              budget.category,
            ) ?? 0
          ) >
          budget.limitChetrum,
      ).length

    const recordedKeys =
      new Set<string>()

    for (const transaction of data.transactions) {
      if (
        transaction.recurringSourceId &&
        transaction.scheduledFor
      ) {
        recordedKeys.add(
          `${transaction.recurringSourceId}|${transaction.scheduledFor}`,
        )
      }
    }

    let regularDueCount = 0

    const regularPreview =
      data.regularMoney
        .map((item) => {
          const occurrences =
            generateOccurrencesBetween(
              item,
              item.startDate,
              today,
            )

          const outstanding =
            occurrences.filter(
              (date) =>
                !recordedKeys.has(
                  `${item.id}|${date}`,
                ),
            )

          regularDueCount +=
            outstanding.length

          const next =
            getNextOccurrence(
              item,
              today,
            )

          return {
            item,
            dueDate:
              outstanding[0] ?? null,
            next,
          }
        })
        .filter(
          (entry) =>
            entry.dueDate ||
            entry.next,
        )
        .sort((a, b) => {
          const aDate =
            a.dueDate ??
            a.next ??
            '9999-12-31'

          const bDate =
            b.dueDate ??
            b.next ??
            '9999-12-31'

          return aDate.localeCompare(
            bDate,
          )
        })
        .slice(0, 4)

    const bounds =
      getMonthBounds(
        currentMonth,
      )

    let regularExpectedIncome = 0
    let regularExpectedExpense = 0

    for (
      const item
      of data.regularMoney
    ) {
      const occurrences =
        generateOccurrencesBetween(
          item,
          bounds.start,
          bounds.end,
        )

      const total =
        occurrences.length *
        item.amountChetrum

      if (item.kind === 'income') {
        regularExpectedIncome += total
      } else {
        regularExpectedExpense += total
      }
    }

    let goalTarget = 0
    let goalSaved = 0
    let goalsReached = 0

    for (const goal of data.goals) {
      const saved =
        getGoalSaved(
          goal.id,
          data.goalContributions,
        )

      goalTarget +=
        goal.targetChetrum

      goalSaved += saved

      if (
        saved >=
        goal.targetChetrum
      ) {
        goalsReached += 1
      }
    }

    const savingsAssets =
      data.savings.reduce(
        (sum, item) =>
          sum +
          item.balanceChetrum,
        0,
      )

    const fdAssets =
      data.fixedDeposits.reduce(
        (sum, item) =>
          sum +
          item.principalChetrum,
        0,
      )

    const rdAssets =
      data.recurringDeposits.reduce(
        (sum, item) =>
          sum +
          multiplyChetrum(
            item.installmentChetrum,
            item.installmentsPaid,
          ),
        0,
      )

    const trackedAssets =
      savingsAssets +
      fdAssets +
      rdAssets

    const outstandingDebt =
      data.loans.reduce(
        (sum, loan) =>
          sum +
          loan.outstandingPrincipalChetrum,
        0,
      )

    const netTrackedPosition =
      trackedAssets -
      outstandingDebt

    const schemeCurrentValue =
      data.schemes.reduce(
        (sum, scheme) =>
          sum +
          scheme.currentValueChetrum,
        0,
      )

    const protectionCover =
      data.schemes.reduce(
        (sum, scheme) =>
          sum +
          scheme.protectionCoverChetrum,
        0,
      )

    const annualSchemeCommitment =
      data.schemes.reduce(
        (sum, scheme) =>
          sum +
          annualContributionChetrum(
            scheme,
          ),
        0,
      )

    const activeSchemes =
      data.schemes.filter(
        (scheme) =>
          scheme.status === 'active',
      ).length

    const activeLoans =
      data.loans.filter(
        (loan) =>
          loan.outstandingPrincipalChetrum >
          0,
      ).length

    const recentTransactions =
      data.transactions.slice(
        0,
        preferences.dashboardRecentCount,
      )

    return {
      monthlyIncome,
      monthlyExpense,
      monthlyNet:
        monthlyIncome -
        monthlyExpense,
      transactionBalance,
      safeToSpend,

      budgetPlanned,

      budgetSpent,
      budgetRemaining:
        budgetPlanned -
        budgetSpent,
      overBudgetCategories,

      regularDueCount,
      regularExpectedIncome,
      regularExpectedExpense,
      regularPreview,

      goalTarget,
      goalSaved,
      goalRemaining:
        Math.max(
          0,
          goalTarget -
            goalSaved,
        ),
      goalsReached,

      savingsAssets,
      trackedAssets,
      outstandingDebt,
      netTrackedPosition,
      activeLoans,

      schemeCurrentValue,
      protectionCover,
      annualSchemeCommitment,
      activeSchemes,

      recentTransactions,
    }
  }, [
    currentMonth,
    data,
    today,
    preferences.dashboardRecentCount,
    preferences.safetyBufferChetrum,
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

  if (
    error ||
    !dashboard ||
    !data
  ) {
    return (
      <AppShell>
        <div className="dashboard-container">
          <div
            className="dashboard2-error"
            role="alert"
          >
            {error ||
              'Money Saathi could not prepare your dashboard.'}
          </div>
        </div>
      </AppShell>
    )
  }

  const monthlyDirection =
    dashboard.monthlyNet >= 0
      ? 'Your recorded inflow is ahead of outflow this month.'
      : 'Your recorded outflow is ahead of inflow this month.'

  return (
    <AppShell>
      <div className="dashboard-container dashboard2">
        <section className="dashboard2-hero">
          <div>
            <p className="dashboard-eyebrow">
              Your money, in one view
            </p>

            <h1>Home</h1>

            <p className="dashboard2-intro">
              {preferences.displayName
                ? `Welcome, ${preferences.displayName}. `
                : ''}
              Understand what came in, what went out,
              what you own, what you owe and what you
              are building toward.
            </p>
          </div>

          <div className="dashboard2-hero-balance">
            <span>
              Transaction balance
            </span>

            <strong>
              {formatNu(
                dashboard.transactionBalance,
              )}
            </strong>

            <small>
              Income minus expenses recorded in Money Saathi.
            </small>
          </div>
        </section>

        <div className="dashboard2-quick-actions">
          <Link
            to="/app/transactions/new"
            className="dashboard2-primary-action"
          >
            + Add transaction
          </Link>

          <Link
            to="/app/budget"
          >
            Budget
          </Link>

          <Link
            to="/app/regular-money"
          >
            Regular money
          </Link>
          <Link
            to="/app/upcoming"
          >
            Upcoming
          </Link>

          <Link
            to="/app/goals"
          >
            Goals
          </Link>

          <Link
            to="/app/my-money"
          >
            My Money
          </Link>

          <Link
            to="/app/reports"
          >
            Reports
          </Link>
          <Link
            to="/app/money-health"
          >
            Money health
          </Link>
          <Link
            to="/app/explain"
          >
            Explain my money
          </Link>
          <Link
            to="/app/financial-safety"
          >
            Financial safety
          </Link>
          <Link
            to="/app/irregular-income"
          >
            Income rhythm
          </Link>
          <Link
            to="/app/security"
          >
            App Lock
          </Link>
          <Link
            to="/app/backup"
          >
            Backup
          </Link>
          <Link
            to="/app/settings"
          >
            Settings
          </Link>
          <Link
            to="/app/setup"
          >
            My setup
          </Link>
        </div>

        <section className="dashboard2-adaptive-strip">
          <div>
            <p className="dashboard-eyebrow">
              Your Money Saathi
            </p>

            <strong>
              {profile.needs.length === 0
                ? 'General money view'
                : profile.needs
                    .map(
                      (need) =>
                        MONEY_NEEDS.find(
                          (item) =>
                            item.id === need,
                        )?.title,
                    )
                    .filter(Boolean)
                    .join(' · ')}
            </strong>

            <span>
              {profile.needs.includes('small-business')
                ? 'Current Home remains one personal ledger. Business money is not silently mixed into these totals.'
                : profile.needs.includes('irregular-income')
                  ? 'Conservative mode: unreceived income is never added to Safe to Spend.'
                  : profile.needs.includes('retirement')
                    ? 'Focus on available cash, recurring income and commitments without treating protection cover as cash.'
                    : profile.needs.includes('salary')
                      ? 'Use Regular Money for salary and commitments so the planning horizon stays useful.'
                      : profile.needs.includes('savings-goals')
                        ? 'Goal progress stays separate from spendable cash to avoid double-counting.'
                        : 'Start with what came in, what went out and what remains.'}
            </span>
          </div>

          <Link to="/app/setup">
            Adjust my setup
          </Link>
        </section>

        <section className="dashboard2-safe-to-spend">
          <div className="dashboard2-safe-main">
            <p className="dashboard-eyebrow">
              Decision support
            </p>

            <span>Safe to Spend</span>

            <strong>
              {formatNu(
                dashboard.safeToSpend.safeToSpendChetrum,
              )}
            </strong>

            <small>
              Based on recorded transactions only. Future income
              is never added before it is actually recorded.
            </small>
          </div>

          <div className="dashboard2-safe-breakdown">
            <div>
              <span>Recorded balance</span>
              <strong>
                {formatNu(
                  dashboard.safeToSpend.recordedBalanceChetrum,
                )}
              </strong>
            </div>

            <div>
              <span>Upcoming commitments</span>
              <strong>
                −{formatNu(
                  dashboard.safeToSpend.upcomingCommitmentsChetrum,
                )}
              </strong>
            </div>

            <div>
              <span>Protected buffer</span>
              <strong>
                −{formatNu(
                  dashboard.safeToSpend.safetyBufferChetrum,
                )}
              </strong>
            </div>
          </div>

          <div className="dashboard2-safe-footer">
            <span>
              {dashboard.safeToSpend.nextExpectedIncomeDate
                ? `Planning through ${formatScheduleDate(
                    dashboard.safeToSpend.horizonDate,
                  )}, the next scheduled income date.`
                : `No scheduled income found. Planning through ${formatScheduleDate(
                    dashboard.safeToSpend.horizonDate,
                  )}.`}
            </span>

            <Link to="/app/safety-buffer">
              {dashboard.safeToSpend.safetyBufferChetrum > 0
                ? 'Adjust buffer'
                : 'Set a safety buffer'}
            </Link>
          </div>
        </section>

        {profile.needs.length > 0 && (
          <section className="dashboard2-focus-grid">
            {profile.needs.includes('daily-money') && (
              <article>
                <span>Daily money</span>
                <strong>
                  {formatNu(
                    dashboard.monthlyNet,
                  )}
                </strong>
                <p>
                  Recorded net cash flow this month.
                </p>
              </article>
            )}

            {profile.needs.includes('salary') && (
              <article>
                <span>Salary & commitments</span>
                <strong>
                  {dashboard.safeToSpend.nextExpectedIncomeDate
                    ? formatScheduleDate(
                        dashboard.safeToSpend.nextExpectedIncomeDate,
                      )
                    : 'Not scheduled'}
                </strong>
                <p>
                  Next unrecorded recurring income date.
                </p>
              </article>
            )}

            {profile.needs.includes('irregular-income') && (
              <article>
                <span>Irregular income</span>
                <strong>
                  {formatNu(
                    dashboard.safeToSpend.safeToSpendChetrum,
                  )}
                </strong>
                <p>
                  Unreceived income is not assumed.
                </p>
              </article>
            )}

            {profile.needs.includes('savings-goals') && (
              <article>
                <span>Savings goals</span>
                <strong>
                  {formatNu(
                    dashboard.goalSaved,
                  )}
                </strong>
                <p>
                  Recorded contributions toward goals.
                </p>
              </article>
            )}

            {profile.needs.includes('retirement') && (
              <article>
                <span>Liquid savings</span>
                <strong>
                  {formatNu(
                    dashboard.savingsAssets,
                  )}
                </strong>
                <p>
                  Savings-account balances only; FD and RD are
                  not presented here as everyday cash.
                </p>
              </article>
            )}

            {profile.needs.includes('small-business') && (
              <article>
                <span>Small business</span>
                <strong>Separate workspace</strong>
                <p>
                  Business money stays outside your personal
                  balance and Safe to Spend.
                </p>
                <Link to="/app/business">
                  Open business
                </Link>
              </article>
            )}
          </section>
        )}

        <section className="dashboard2-month-grid">
          <article className="dashboard2-stat-card">
            <span>Money in this month</span>
            <strong className="income-text">
              {formatNu(
                dashboard.monthlyIncome,
              )}
            </strong>
          </article>

          <article className="dashboard2-stat-card">
            <span>Money out this month</span>
            <strong>
              {formatNu(
                dashboard.monthlyExpense,
              )}
            </strong>
          </article>

          <article className="dashboard2-stat-card">
            <span>Net cash flow</span>
            <strong
              className={
                dashboard.monthlyNet >= 0
                  ? 'income-text'
                  : ''
              }
            >
              {formatNu(
                dashboard.monthlyNet,
              )}
            </strong>
          </article>

          <article className="dashboard2-stat-card">
            <span>Due to record</span>
            <strong>
              {dashboard.regularDueCount}
            </strong>
            <small>
              Outstanding Regular Money occurrences.
            </small>
          </article>
        </section>

        <div className="dashboard2-fact-strip">
          {monthlyDirection}
          {' '}
          {dashboard.monthlyNet !== 0 && (
            <strong>
              Difference:{' '}
              {formatNu(
                Math.abs(
                  dashboard.monthlyNet,
                ),
              )}
            </strong>
          )}
        </div>

        <section className="dashboard2-two-column">
          <article className="dashboard2-panel">
            <div className="dashboard2-panel-heading">
              <div>
                <p className="dashboard-eyebrow">
                  Spending plan
                </p>
                <h2>This month's budget</h2>
              </div>

              <Link to="/app/budget">
                View budget
              </Link>
            </div>

            {data.budgets.length === 0 ? (
              <div className="dashboard2-empty">
                No category budgets set for this month.
              </div>
            ) : (
              <>
                <div className="dashboard2-budget-numbers">
                  <div>
                    <span>Planned</span>
                    <strong>
                      {formatNu(
                        dashboard.budgetPlanned,
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Spent against plan</span>
                    <strong>
                      {formatNu(
                        dashboard.budgetSpent,
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      {dashboard.budgetRemaining >= 0
                        ? 'Remaining'
                        : 'Over plan'}
                    </span>
                    <strong>
                      {formatNu(
                        Math.abs(
                          dashboard.budgetRemaining,
                        ),
                      )}
                    </strong>
                  </div>
                </div>

                <div className="dashboard2-progress-track">
                  <div
                    className={
                      dashboard.budgetRemaining < 0
                        ? 'dashboard2-progress-fill over'
                        : 'dashboard2-progress-fill'
                    }
                    style={{
                      width:
                        dashboard.budgetPlanned > 0
                          ? `${Math.min(
                              (
                                dashboard.budgetSpent /
                                dashboard.budgetPlanned
                              ) * 100,
                              100,
                            )}%`
                          : '0%',
                    }}
                  />
                </div>

                <p className="dashboard2-panel-note">
                  {dashboard.overBudgetCategories > 0
                    ? `${dashboard.overBudgetCategories} ${
                        dashboard.overBudgetCategories === 1
                          ? 'category is'
                          : 'categories are'
                      } over budget.`
                    : 'No budgeted category is currently over its limit.'}
                </p>
              </>
            )}
          </article>

          <article className="dashboard2-panel">
            <div className="dashboard2-panel-heading">
              <div>
                <p className="dashboard-eyebrow">
                  Repeating money
                </p>
                <h2>Regular Money</h2>
              </div>

              <Link to="/app/regular-money">
                View schedules
              </Link>
            </div>

            <div className="dashboard2-budget-numbers">
              <div>
                <span>Expected in</span>
                <strong className="income-text">
                  {formatNu(
                    dashboard.regularExpectedIncome,
                  )}
                </strong>
              </div>

              <div>
                <span>Expected out</span>
                <strong>
                  {formatNu(
                    dashboard.regularExpectedExpense,
                  )}
                </strong>
              </div>

              <div>
                <span>Due to record</span>
                <strong>
                  {dashboard.regularDueCount}
                </strong>
              </div>
            </div>

            {dashboard.regularPreview.length === 0 ? (
              <div className="dashboard2-empty compact">
                No upcoming recurring money.
              </div>
            ) : (
              <div className="dashboard2-mini-list">
                {dashboard.regularPreview.map(
                  ({
                    item,
                    dueDate,
                    next,
                  }) => (
                    <div
                      className="dashboard2-mini-row"
                      key={item.id}
                    >
                      <div>
                        <strong>
                          {item.name}
                        </strong>

                        <span>
                          {dueDate
                            ? `Due ${formatScheduleDate(
                                dueDate,
                              )}`
                            : next
                              ? `Next ${formatScheduleDate(
                                  next,
                                )}`
                              : ''}
                        </span>
                      </div>

                      <strong
                        className={
                          item.kind === 'income'
                            ? 'income-text'
                            : ''
                        }
                      >
                        {item.kind === 'income'
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
            )}
          </article>
        </section>

        <section className="dashboard2-financial-position">
          <div className="dashboard2-panel-heading light">
            <div>
              <p className="dashboard-eyebrow">
                Financial position
              </p>
              <h2>What you own and owe</h2>
            </div>

            <Link to="/app/my-money">
              Open My Money
            </Link>
          </div>

          <div className="dashboard2-position-grid">
            <div>
              <span>Tracked assets</span>
              <strong>
                {formatNu(
                  dashboard.trackedAssets,
                )}
              </strong>
              <small>
                Savings + FD principal + RD contributions.
              </small>
            </div>

            <div>
              <span>Outstanding debt</span>
              <strong>
                {formatNu(
                  dashboard.outstandingDebt,
                )}
              </strong>
              <small>
                Across {dashboard.activeLoans}{' '}
                active{' '}
                {dashboard.activeLoans === 1
                  ? 'loan'
                  : 'loans'}.
              </small>
            </div>

            <div className="dashboard2-position-main">
              <span>Net tracked position</span>
              <strong>
                {formatNu(
                  dashboard.netTrackedPosition,
                )}
              </strong>
              <small>
                Tracked assets minus outstanding loan principal.
              </small>
            </div>
          </div>

          <p className="dashboard2-position-note">
            This is not your complete net worth. It only reflects
            assets and liabilities you have entered into Money Saathi.
            Scheme values are shown separately to avoid accidental
            double-counting.
          </p>
        </section>

        <section className="dashboard2-two-column">
          <article className="dashboard2-panel">
            <div className="dashboard2-panel-heading">
              <div>
                <p className="dashboard-eyebrow">
                  Goals
                </p>
                <h2>What you are building toward</h2>
              </div>

              <Link to="/app/goals">
                View goals
              </Link>
            </div>

            {data.goals.length === 0 ? (
              <div className="dashboard2-empty">
                No financial goals yet.
              </div>
            ) : (
              <>
                <div className="dashboard2-goal-hero">
                  <span>Saved toward goals</span>
                  <strong>
                    {formatNu(
                      dashboard.goalSaved,
                    )}
                  </strong>
                  <small>
                    of{' '}
                    {formatNu(
                      dashboard.goalTarget,
                    )}
                    {' '}targeted
                  </small>
                </div>

                <div className="dashboard2-progress-track">
                  <div
                    className="dashboard2-progress-fill"
                    style={{
                      width:
                        dashboard.goalTarget > 0
                          ? `${Math.min(
                              (
                                dashboard.goalSaved /
                                dashboard.goalTarget
                              ) * 100,
                              100,
                            )}%`
                          : '0%',
                    }}
                  />
                </div>

                <div className="dashboard2-inline-facts">
                  <span>
                    Remaining{' '}
                    <strong>
                      {formatNu(
                        dashboard.goalRemaining,
                      )}
                    </strong>
                  </span>

                  <span>
                    Reached{' '}
                    <strong>
                      {dashboard.goalsReached}
                    </strong>
                  </span>
                </div>
              </>
            )}
          </article>

          <article className="dashboard2-panel">
            <div className="dashboard2-panel-heading">
              <div>
                <p className="dashboard-eyebrow">
                  Schemes & protection
                </p>
                <h2>Long-term commitments</h2>
              </div>

              <Link to="/app/my-money/schemes">
                View schemes
              </Link>
            </div>

            {data.schemes.length === 0 ? (
              <div className="dashboard2-empty">
                No long-term schemes recorded yet.
              </div>
            ) : (
              <div className="dashboard2-scheme-grid">
                <div>
                  <span>Current recorded value</span>
                  <strong>
                    {formatNu(
                      dashboard.schemeCurrentValue,
                    )}
                  </strong>
                </div>

                <div>
                  <span>Protection cover</span>
                  <strong>
                    {formatNu(
                      dashboard.protectionCover,
                    )}
                  </strong>
                </div>

                <div>
                  <span>Annual scheduled contribution</span>
                  <strong>
                    {formatNu(
                      dashboard.annualSchemeCommitment,
                    )}
                  </strong>
                </div>

                <div>
                  <span>Active schemes</span>
                  <strong>
                    {dashboard.activeSchemes}
                  </strong>
                </div>
              </div>
            )}

            <p className="dashboard2-panel-note">
              Protection cover and future benefits are not counted
              as today's assets.
            </p>
          </article>
        </section>

        <section className="dashboard2-panel dashboard2-recent">
          <div className="dashboard2-panel-heading">
            <div>
              <p className="dashboard-eyebrow">
                Activity
              </p>
              <h2>Recent transactions</h2>
            </div>

            <Link to="/app/transactions">
              View all
            </Link>
          </div>

          {dashboard.recentTransactions.length === 0 ? (
            <div className="dashboard2-empty">
              No transactions recorded yet.
            </div>
          ) : (
            <div className="dashboard2-transaction-list">
              {dashboard.recentTransactions.map(
                (transaction) => (
                  <div
                    className="dashboard2-transaction-row"
                    key={transaction.id}
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

                    <div>
                      <strong
                        className={
                          transaction.kind ===
                          'income'
                            ? 'income-text'
                            : ''
                        }
                      >
                        {transaction.kind ===
                        'income'
                          ? '+'
                          : '−'}
                        {formatNu(
                          transaction.amountChetrum,
                        )}
                      </strong>

                      <span>
                        {transaction.date}
                      </span>
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  )
}

export default DashboardPage













