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
  addChetrumExact,
  subtractChetrumExact,
  sumChetrumExact,
} from '../utils/moneyTotals'
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

    try {
      const recordedTransactions =
      data.transactions.filter(
        (item) =>
          item.date <= today,
      )

    const monthTransactions =
      recordedTransactions.filter(
        (item) =>
          item.date.slice(0, 7) ===
          currentMonth,
      )

    const monthlyIncome =
      sumChetrumExact(
        monthTransactions
          .filter(
            (item) =>
              item.kind === 'income',
          )
          .map(
            (item) =>
              item.amountChetrum,
          ),
        'Monthly income',
      )

    const monthlyExpense =
      sumChetrumExact(
        monthTransactions
          .filter(
            (item) =>
              item.kind === 'expense',
          )
          .map(
            (item) =>
              item.amountChetrum,
          ),
        'Monthly expenses',
      )

    const allTimeIncome =
      sumChetrumExact(
        recordedTransactions
          .filter(
            (item) =>
              item.kind === 'income',
          )
          .map(
            (item) =>
              item.amountChetrum,
          ),
        'Recorded income',
      )

    const allTimeExpense =
      sumChetrumExact(
        recordedTransactions
          .filter(
            (item) =>
              item.kind === 'expense',
          )
          .map(
            (item) =>
              item.amountChetrum,
          ),
        'Recorded expenses',
      )

    const transactionBalance =
      subtractChetrumExact(
        allTimeIncome,
        allTimeExpense,
        'Transaction balance',
      )
    const safeToSpend =
      calculateSafeToSpend(
        today,
        transactionBalance,
        data.regularMoney,
        recordedTransactions,
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
        addChetrumExact(
          current,
          transaction.amountChetrum,
          'Budget category spending',
        ),
      )
    }

    const budgetPlanned =
      sumChetrumExact(
        data.budgets.map(
          (budget) =>
            budget.limitChetrum,
        ),
        'Budget plan',
      )

    const budgetSpent =
      sumChetrumExact(
        budgetSpentByCategory.values(),
        'Budget spending',
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

    for (const transaction of recordedTransactions) {
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
        regularExpectedIncome =
          addChetrumExact(
            regularExpectedIncome,
            total,
            'Expected Regular Money income',
          )
      } else {
        regularExpectedExpense =
          addChetrumExact(
            regularExpectedExpense,
            total,
            'Expected Regular Money expenses',
          )
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

      goalTarget =
        addChetrumExact(
          goalTarget,
          goal.targetChetrum,
          'Goal targets',
        )

      goalSaved =
        addChetrumExact(
          goalSaved,
          saved,
          'Goal savings',
        )

      if (
        saved >=
        goal.targetChetrum
      ) {
        goalsReached += 1
      }
    }

    const savingsAssets =
      sumChetrumExact(
        data.savings.map(
          (item) =>
            item.balanceChetrum,
        ),
        'Savings assets',
      )

    const fdAssets =
      sumChetrumExact(
        data.fixedDeposits.map(
          (item) =>
            item.principalChetrum,
        ),
        'Fixed deposit assets',
      )

    const rdAssets =
      sumChetrumExact(
        data.recurringDeposits.map(
          (item) =>
            multiplyChetrum(
              item.installmentChetrum,
              item.installmentsPaid,
            ),
        ),
        'Recurring deposit assets',
      )

    const trackedAssets =
      sumChetrumExact(
        [
          savingsAssets,
          fdAssets,
          rdAssets,
        ],
        'Tracked assets',
      )

    const outstandingDebt =
      sumChetrumExact(
        data.loans.map(
          (loan) =>
            loan.outstandingPrincipalChetrum,
        ),
        'Outstanding debt',
      )

    const netTrackedPosition =
      subtractChetrumExact(
        trackedAssets,
        outstandingDebt,
        'Net tracked position',
      )

    const schemeCurrentValue =
      sumChetrumExact(
        data.schemes.map(
          (scheme) =>
            scheme.currentValueChetrum,
        ),
        'Scheme current values',
      )

    const protectionCover =
      sumChetrumExact(
        data.schemes.map(
          (scheme) =>
            scheme.protectionCoverChetrum,
        ),
        'Protection cover',
      )

    const annualSchemeCommitment =
      sumChetrumExact(
        data.schemes
          .filter(
            (scheme) =>
              scheme.status === 'active',
          )
          .map(
            (scheme) =>
              annualContributionChetrum(
                scheme,
              ),
          ),
        'Active annual scheme commitments',
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
      recordedTransactions.slice(
        0,
        preferences.dashboardRecentCount,
      )

      const monthlyNet =
        subtractChetrumExact(
          monthlyIncome,
          monthlyExpense,
          'Monthly net cash flow',
        )

      const budgetRemaining =
        subtractChetrumExact(
          budgetPlanned,
          budgetSpent,
          'Budget remaining',
        )

      const goalDifference =
        subtractChetrumExact(
          goalTarget,
          goalSaved,
          'Goal remaining amount',
        )

      return {
      monthlyIncome,
      monthlyExpense,
      monthlyNet,
      transactionBalance,
      safeToSpend,

      budgetPlanned,

      budgetSpent,
      budgetRemaining,
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
          goalDifference,
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
    } catch {
      return null
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

  const nextMoneyMessage =
    dashboard.regularDueCount > 0
      ? `${dashboard.regularDueCount} ${
          dashboard.regularDueCount === 1
            ? 'regular money item needs'
            : 'regular money items need'
        } to be recorded.`
      : dashboard.safeToSpend.nextExpectedIncomeDate
        ? `Next scheduled income: ${formatScheduleDate(
            dashboard.safeToSpend.nextExpectedIncomeDate,
          )}.`
        : `Planning through ${formatScheduleDate(
            dashboard.safeToSpend.horizonDate,
          )}.`

  const hasAttention =
    dashboard.regularDueCount > 0 ||
    dashboard.overBudgetCategories > 0

  return (
    <AppShell>
      <div className="dashboard-container dashboard2 dashboard2-focused">
        <header className="dashboard2-home-header">
          <div>
            <p className="dashboard-eyebrow">
              Your money today
            </p>

            <h1>
              {preferences.displayName
                ? `Hi, ${preferences.displayName}`
                : 'Home'}
            </h1>

            <p>
              Start with what you have, what is safe to use and
              what needs attention next.
            </p>
          </div>
        </header>

        <section
          className="dashboard2-core-grid"
          aria-label="Your main money picture"
        >
          <article className="dashboard2-core-card">
            <span>Recorded balance</span>

            <strong>
              {formatNu(
                dashboard.transactionBalance,
              )}
            </strong>

            <p>
              Income minus expenses you have actually recorded.
            </p>

            <Link to="/app/transactions">
              View activity
            </Link>
          </article>

          <article className="dashboard2-core-card safe">
            <span>Safe to Spend</span>

            <strong>
              {formatNu(
                dashboard.safeToSpend.safeToSpendChetrum,
              )}
            </strong>

            <p>
              After unrecorded commitments and your protected
              safety buffer.
            </p>

            <Link to="/app/safety-buffer">
              {dashboard.safeToSpend.safetyBufferChetrum > 0
                ? 'Adjust protected amount'
                : 'Protect some money'}
            </Link>
          </article>

          <article className="dashboard2-core-card next">
            <span>Coming next</span>

            <strong>
              {dashboard.regularDueCount > 0
                ? `${dashboard.regularDueCount} due`
                : 'On track'}
            </strong>

            <p>
              {nextMoneyMessage}
            </p>

            <Link to="/app/upcoming">
              View upcoming
            </Link>
          </article>
        </section>

        <nav
          className="dashboard2-core-actions"
          aria-label="Everyday money actions"
        >
          <Link
            to="/app/transactions/new"
            className="dashboard2-primary-action"
          >
            + Add transaction
          </Link>

          <Link to="/app/transactions">
            Transactions
          </Link>

          <Link to="/app/budget">
            Budget
          </Link>

          <Link to="/app/goals">
            Goals
          </Link>

          <Link to="/app/more">
            More
          </Link>
        </nav>

        <section className="dashboard2-month-summary">
          <div className="dashboard2-section-heading">
            <div>
              <p className="dashboard-eyebrow">
                This month
              </p>

              <h2>Money movement</h2>
            </div>

            <Link to="/app/reports">
              Open reports
            </Link>
          </div>

          <div className="dashboard2-month-compact-grid">
            <div>
              <span>Money in</span>
              <strong className="income-text">
                {formatNu(
                  dashboard.monthlyIncome,
                )}
              </strong>
            </div>

            <div>
              <span>Money out</span>
              <strong>
                {formatNu(
                  dashboard.monthlyExpense,
                )}
              </strong>
            </div>

            <div>
              <span>Difference</span>
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
            </div>
          </div>

          <p className="dashboard2-month-note">
            {monthlyDirection}
          </p>
        </section>

        <section
          className={
            hasAttention
              ? 'dashboard2-attention needs-attention'
              : 'dashboard2-attention'
          }
        >
          <div>
            <p className="dashboard-eyebrow">
              What needs attention
            </p>

            <h2>
              {hasAttention
                ? 'There are a few things to review.'
                : 'Nothing urgent from your recorded money.'}
            </h2>

            <div className="dashboard2-attention-list">
              {dashboard.regularDueCount > 0 && (
                <span>
                  {dashboard.regularDueCount}{' '}
                  {dashboard.regularDueCount === 1
                    ? 'Regular Money item is'
                    : 'Regular Money items are'}{' '}
                  due to be recorded.
                </span>
              )}

              {dashboard.overBudgetCategories > 0 && (
                <span>
                  {dashboard.overBudgetCategories}{' '}
                  {dashboard.overBudgetCategories === 1
                    ? 'budget category is'
                    : 'budget categories are'}{' '}
                  over plan.
                </span>
              )}

              {!hasAttention && (
                <span>
                  Money Saathi will surface recorded commitments
                  and budget pressure here.
                </span>
              )}
            </div>
          </div>

          <div className="dashboard2-attention-actions">
            <Link to="/app/upcoming">
              Upcoming
            </Link>

            <Link to="/app/alerts">
              Alerts
            </Link>
          </div>
        </section>

        <section className="dashboard2-panel dashboard2-recent">
          <div className="dashboard2-panel-heading">
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

          {dashboard.recentTransactions.length === 0 ? (
            <div className="dashboard2-empty">
              No money recorded yet. Start with one income or
              expense.
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

        <section className="dashboard2-explore">
          <div>
            <p className="dashboard-eyebrow">
              Go deeper when useful
            </p>

            <h2>Your other money tools</h2>

            <p>
              Assets, loans, regular money and detailed analysis
              stay available without crowding your Home screen.
            </p>
          </div>

          <div className="dashboard2-explore-links">
            <Link to="/app/my-money">
              My Money
            </Link>

            <Link to="/app/regular-money">
              Regular money
            </Link>

            <Link to="/app/reports">
              Reports
            </Link>

            <Link to="/app/more">
              All tools
            </Link>
          </div>
        </section>
      </div>
    </AppShell>
  )}

export default DashboardPage

















