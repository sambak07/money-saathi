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
  getLoans,
  getRegularMoney,
  getSavingsAccounts,
  getTransactions,
  getGoals,
} from '../storage/db'
import {
  getProfile,
} from '../profile/userProfile'
import {
  getPreferences,
} from '../settings/preferences'
import {
  buildMoneyQuestions,
  buildMoneySignals,
  sumSafeChetrum,
} from '../utils/explainMoney'
import {
  buildMoneyHealthSnapshot,
  formatCoverageMonths,
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

import '../styles/explain-money.css'

interface ExplainData {
  transactions: Awaited<
    ReturnType<typeof getTransactions>
  >
  regularMoney: Awaited<
    ReturnType<typeof getRegularMoney>
  >
  savingsAccounts: Awaited<
    ReturnType<typeof getSavingsAccounts>
  >
  loans: Awaited<
    ReturnType<typeof getLoans>
  >
  goals: Awaited<
    ReturnType<typeof getGoals>
  >
}

function ExplainMoneyPage() {
  const [today] =
    useState(() => getLocalToday())

  const [profile] =
    useState(() => getProfile())

  const [preferences] =
    useState(() => getPreferences())

  const [data, setData] =
    useState<ExplainData | null>(null)

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
          loans,
          goals,
        ] = await Promise.all([
          getTransactions(),
          getRegularMoney(),
          getSavingsAccounts(),
          getLoans(),
          getGoals(),
        ])

        if (!active) return

        setData({
          transactions,
          regularMoney,
          savingsAccounts,
          loans,
          goals,
        })
      } catch {
        if (active) {
          setError(
            'Money Saathi could not explain your current records.',
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

    const recordedBalanceChetrum =
      transactionBalanceChetrum(
        data.transactions,
      )

    const safeToSpend =
      calculateSafeToSpend(
        today,
        recordedBalanceChetrum,
        data.regularMoney,
        data.transactions,
        preferences.safetyBufferChetrum,
      )

    const liquidSavingsChetrum =
      sumSafeChetrum(
        data.savingsAccounts.map(
          (account) =>
            account.balanceChetrum,
        ),
        'Savings balance',
      )

    const health =
      buildMoneyHealthSnapshot(
        today.slice(0, 7),
        data.transactions,
        liquidSavingsChetrum,
      )

    const outstandingLoanChetrum =
      sumSafeChetrum(
        data.loans.map(
          (loan) =>
            loan.outstandingPrincipalChetrum,
        ),
        'Outstanding loan principal',
      )

    const inputs = {
      recordedBalanceChetrum,
      safeToSpendChetrum:
        safeToSpend.safeToSpendChetrum,
      upcomingCommitmentsChetrum:
        safeToSpend.upcomingCommitmentsChetrum,
      safetyBufferChetrum:
        safeToSpend.safetyBufferChetrum,
      currentMonthIncomeChetrum:
        health.currentMonth.incomeChetrum,
      currentMonthExpenseChetrum:
        health.currentMonth.expenseChetrum,
      liquidSavingsChetrum,
      averageMonthlyExpenseChetrum:
        health.averageMonthlyExpenseChetrum,
      emergencyCoverageMonthsTenths:
        health.emergencyCoverageMonthsTenths,
      outstandingLoanChetrum,
      goalCount:
        data.goals.length,
      irregularIncomeSelected:
        profile.needs.includes(
          'irregular-income',
        ),
    }

    return {
      inputs,
      signals:
        buildMoneySignals(inputs),
      questions:
        buildMoneyQuestions(inputs),
    }
  }, [
    data,
    preferences.safetyBufferChetrum,
    profile.needs,
    today,
  ])

  if (loading) {
    return (
      <AppShell>
        <div className="dashboard-container">
          <div className="dashboard2-loading">
            Reading your Money Saathi records...
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
              'Money Saathi could not explain your records.'}
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="dashboard-container explain-money-page">
        <header className="explain-money-header">
          <div>
            <p className="dashboard-eyebrow">
              Plain language, from your own records
            </p>

            <h1>Explain my money</h1>

            <p>
              Money Saathi turns the numbers you already recorded
              into simple explanations. There is no hidden score,
              no bank connection, no prediction and no AI sending
              your financial data anywhere.
            </p>
          </div>

          <Link to="/app/money-health">
            Money health
          </Link>
        </header>

        <section className="explain-money-trust">
          <strong>
            Deterministic and local
          </strong>

          <span>
            The same records produce the same explanation. This
            page uses rules inside Money Saathi on your device.
          </span>
        </section>

        <section className="explain-money-facts">
          <article>
            <span>Recorded balance</span>

            <strong>
              {formatNu(
                view.inputs.recordedBalanceChetrum,
              )}
            </strong>

            <small>
              Recorded income minus recorded expenses.
            </small>
          </article>

          <article>
            <span>Safe to Spend</span>

            <strong>
              {formatNu(
                view.inputs.safeToSpendChetrum,
              )}
            </strong>

            <small>
              After upcoming commitments and your safety buffer.
            </small>
          </article>

          <article>
            <span>Potential savings coverage</span>

            <strong>
              {formatCoverageMonths(
                view.inputs
                  .emergencyCoverageMonthsTenths,
              )}
            </strong>

            <small>
              Savings Account balances compared with recent
              recorded expenses.
            </small>
          </article>

          <article>
            <span>Outstanding loan principal</span>

            <strong>
              {formatNu(
                view.inputs.outstandingLoanChetrum,
              )}
            </strong>

            <small>
              Based on the current outstanding values you entered.
            </small>
          </article>
        </section>

        <section className="explain-money-section">
          <div className="explain-money-section-heading">
            <div>
              <p className="dashboard-eyebrow">
                What your records say
              </p>

              <h2>
                Clear signals, without judgment
              </h2>
            </div>

            <span>
              {view.signals.length}{' '}
              {view.signals.length === 1
                ? 'signal'
                : 'signals'}
            </span>
          </div>

          <div className="explain-money-signals">
            {view.signals.map(
              (signal) => (
                <article key={signal.id}>
                  <span>
                    {signal.kind.replace(
                      '-',
                      ' ',
                    )}
                  </span>

                  <strong>
                    {signal.title}
                  </strong>

                  <p>
                    {signal.explanation}
                  </p>
                </article>
              ),
            )}
          </div>
        </section>

        <section className="explain-money-section">
          <div className="explain-money-section-heading">
            <div>
              <p className="dashboard-eyebrow">
                Questions worth considering
              </p>

              <h2>
                You decide what matters next
              </h2>
            </div>
          </div>

          <div className="explain-money-questions">
            {view.questions.map(
              (question, index) => (
                <article key={question}>
                  <span>
                    {index + 1}
                  </span>

                  <strong>
                    {question}
                  </strong>
                </article>
              ),
            )}
          </div>
        </section>

        <section className="explain-money-actions">
          <Link
            to="/app/transactions"
            className="primary"
          >
            Review transactions
          </Link>

          <Link to="/app/upcoming">
            Upcoming money
          </Link>

          <Link to="/app/financial-safety">
            Financial safety
          </Link>

          <Link to="/app/irregular-income">
            Income rhythm
          </Link>
        </section>

        <section className="explain-money-limitations">
          <div>
            <strong>
              Money Saathi only knows what you record
            </strong>

            <p>
              Missing cash, unrecorded debt, assets outside the
              app or outdated balances can change your real
              financial picture.
            </p>
          </div>

          <div>
            <strong>
              Explanation is not prediction
            </strong>

            <p>
              Historical patterns and scheduled items can help
              planning, but Money Saathi does not claim to know
              future income, investment returns or unexpected
              expenses.
            </p>
          </div>

          <div>
            <strong>
              Built in Bhutan, understandable anywhere
            </strong>

            <p>
              The experience stays Ngultrum-first and grounded in
              Bhutanese money life while using plain financial
              concepts that remain understandable to beginners.
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  )
}

export default ExplainMoneyPage
