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
  getProfile,
} from '../profile/userProfile'
import {
  SAATHI_LEARNING_TOPICS,
  buildSaathiGuidance,
} from '../saathi/financialInclusion'
import {
  getGoals,
  getLoans,
  getRegularMoney,
  getSavingsAccounts,
  getTransactions,
} from '../storage/db'
import {
  getPreferences,
} from '../settings/preferences'
import {
  sumSafeChetrum,
} from '../utils/explainMoney'
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

import '../styles/saathi-guide.css'

interface SaathiData {
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

function SaathiGuidePage() {
  const [today] =
    useState(() => getLocalToday())

  const [profile] =
    useState(() => getProfile())

  const [preferences] =
    useState(() => getPreferences())

  const [data, setData] =
    useState<SaathiData | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  const [
    activeKind,
    setActiveKind,
  ] = useState<
    'all' |
    'understand' |
    'plan' |
    'learn' |
    'protect'
  >('all')

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
        ] =
          await Promise.all([
            getTransactions(),
            getRegularMoney(),
            getSavingsAccounts(),
            getLoans(),
            getGoals(),
          ])

        if (!active) {
          return
        }

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
            'Saathi could not read your current Money Saathi records.',
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

  const view =
    useMemo(() => {
      if (!data) {
        return null
      }

      const recordedTransactions =
        data.transactions.filter(
          (transaction) =>
            transaction.date <=
            today,
        )

      const recordedBalanceChetrum =
        transactionBalanceChetrum(
          recordedTransactions,
          today,
        )

      const safe =
        calculateSafeToSpend(
          today,
          recordedBalanceChetrum,
          data.regularMoney,
          recordedTransactions,
          preferences.safetyBufferChetrum,
        )

      const health =
        buildMoneyHealthSnapshot(
          today.slice(0, 7),
          recordedTransactions,
          sumSafeChetrum(
            data.savingsAccounts.map(
              (account) =>
                account.balanceChetrum,
            ),
            'Savings balance',
          ),
        )

      const liquidSavingsChetrum =
        sumSafeChetrum(
          data.savingsAccounts.map(
            (account) =>
              account.balanceChetrum,
          ),
          'Savings balance',
        )

      const outstandingLoanChetrum =
        sumSafeChetrum(
          data.loans.map(
            (loan) =>
              loan.outstandingPrincipalChetrum,
          ),
          'Outstanding loan principal',
        )

      const snapshot = {
        needs:
          profile.needs,
        transactionCount:
          recordedTransactions.length,
        recordedBalanceChetrum,
        safeToSpendChetrum:
          safe.safeToSpendChetrum,
        upcomingCommitmentsChetrum:
          safe.upcomingCommitmentsChetrum,
        safetyBufferChetrum:
          safe.safetyBufferChetrum,
        currentMonthIncomeChetrum:
          health.currentMonth.incomeChetrum,
        currentMonthExpenseChetrum:
          health.currentMonth.expenseChetrum,
        liquidSavingsChetrum,
        outstandingLoanChetrum,
        goalCount:
          data.goals.length,
        nextExpectedIncomeDate:
          safe.nextExpectedIncomeDate,
        horizonDate:
          safe.horizonDate,
      }

      return {
        snapshot,
        guidance:
          buildSaathiGuidance(
            snapshot,
          ),
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
            Saathi is reading your local records…
          </div>
        </div>
      </AppShell>
    )
  }

  if (
    error ||
    !view ||
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
              'Saathi could not prepare guidance.'}
          </div>
        </div>
      </AppShell>
    )
  }

  const filtered =
    activeKind === 'all'
      ? view.guidance
      : view.guidance.filter(
          (item) =>
            item.kind ===
            activeKind,
        )

  return (
    <AppShell>
      <div className="dashboard-container saathi-guide-page">
        <header className="saathi-guide-header">
          <p className="dashboard-eyebrow">
            Financial guidance for everyday life
          </p>

          <h1>Saathi</h1>

          <p>
            Saathi explains the Money Saathi records you choose to
            keep on this device. This foundation is deterministic:
            no generative AI, no cloud model and no Money Vault access.
          </p>
        </header>

        <section className="saathi-trust-strip">
          <strong>
            Guidance, not judgment
          </strong>

          <span>
            Saathi adapts only from the money needs you selected and
            the records you entered. It does not guess your income,
            background or financial situation.
          </span>

          <Link
            to="/app/saathi/privacy"
            className="saathi-privacy-link"
          >
            Review future AI data permissions
          </Link>
        </section>

        <section className="saathi-facts">
          <article>
            <span>Recorded balance</span>
            <strong>
              {formatNu(
                view.snapshot
                  .recordedBalanceChetrum,
              )}
            </strong>
          </article>

          <article>
            <span>Safe to Spend</span>
            <strong>
              {formatNu(
                view.snapshot
                  .safeToSpendChetrum,
              )}
            </strong>
          </article>

          <article>
            <span>Coming commitments</span>
            <strong>
              {formatNu(
                view.snapshot
                  .upcomingCommitmentsChetrum,
              )}
            </strong>
          </article>

          <article>
            <span>Recorded debt</span>
            <strong>
              {formatNu(
                view.snapshot
                  .outstandingLoanChetrum,
              )}
            </strong>
          </article>
        </section>

        <section className="saathi-guidance-section">
          <div className="saathi-section-heading">
            <div>
              <p className="dashboard-eyebrow">
                What Saathi can help with
              </p>

              <h2>
                Understand. Plan. Learn. Protect.
              </h2>
            </div>
          </div>

          <div
            className="saathi-filter-row"
            aria-label="Saathi guidance filters"
          >
            {[
              ['all', 'All'],
              ['understand', 'Understand'],
              ['plan', 'Plan'],
              ['learn', 'Learn'],
              ['protect', 'Protect'],
            ].map(
              ([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={
                    activeKind === id
                      ? 'active'
                      : ''
                  }
                  aria-pressed={
                    activeKind === id
                  }
                  onClick={() =>
                    setActiveKind(
                      id as typeof activeKind,
                    )
                  }
                >
                  {label}
                </button>
              ),
            )}
          </div>

          <div className="saathi-guidance-grid">
            {filtered.map(
              (item) => (
                <article
                  key={item.id}
                  className={
                    `saathi-guidance-card ${item.kind}`
                  }
                >
                  <span>
                    {item.kind}
                  </span>

                  <h3>
                    {item.title}
                  </h3>

                  <p>
                    {item.explanation}
                  </p>

                  {item.action && (
                    <div className="saathi-next-action">
                      <strong>
                        Consider
                      </strong>

                      <span>
                        {item.action}
                      </span>
                    </div>
                  )}
                </article>
              ),
            )}
          </div>
        </section>

        <section className="saathi-learning-section">
          <div className="saathi-section-heading">
            <div>
              <p className="dashboard-eyebrow">
                Explain like I’m new to money
              </p>

              <h2>
                Money basics without finance jargon
              </h2>
            </div>
          </div>

          <div className="saathi-learning-grid">
            {SAATHI_LEARNING_TOPICS.map(
              (topic) => (
                <article key={topic.id}>
                  <strong>
                    {topic.title}
                  </strong>

                  <p>
                    {topic.explanation}
                  </p>
                </article>
              ),
            )}
          </div>
        </section>

        <section className="saathi-source-card">
          <div>
            <strong>
              What this guidance used
            </strong>

            <p>
              {view.snapshot.transactionCount} recorded transaction
              {view.snapshot.transactionCount === 1 ? '' : 's'},
              {' '}
              {data.regularMoney.length} regular-money item
              {data.regularMoney.length === 1 ? '' : 's'},
              {' '}
              {data.loans.length} loan
              {data.loans.length === 1 ? '' : 's'},
              {' '}
              {data.savingsAccounts.length} savings record
              {data.savingsAccounts.length === 1 ? '' : 's'}.
            </p>
          </div>

          <div>
            <strong>
              What it did not use
            </strong>

            <p>
              Money Vault, bank APIs, internet searches, predictions,
              external AI models or information you did not record.
            </p>
          </div>
        </section>

        <section className="saathi-limit-card">
          <strong>
            Saathi is not deciding for you
          </strong>

          <p>
            These are explanations and planning prompts from your
            recorded information. Missing records can change the real
            picture, and future income or unexpected costs cannot be
            guaranteed.
          </p>
        </section>
      </div>
    </AppShell>
  )
}

export default SaathiGuidePage