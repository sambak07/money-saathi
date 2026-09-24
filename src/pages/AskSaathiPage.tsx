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
  LOCAL_LEARNING_ANSWERS,
  routeLocalSaathiQuestion,
  type LocalLearningTopic,
} from '../saathi/localQuestionRouter'
import {
  buildAttentionItems,
  buildDebtSnapshot,
  compareRecordedMonths,
  assessAffordability,
} from '../saathi/saathiTools'
import {
  getLoans,
  getRegularMoney,
  getSavingsAccounts,
  getTransactions,
} from '../storage/db'
import {
  getPreferences,
} from '../settings/preferences'
import {
  formatNu,
  getLocalToday,
} from '../utils/money'
import {
  calculateSafeToSpend,
  parseNuInputToChetrum,
} from '../utils/safeToSpend'
import {
  transactionBalanceChetrum,
} from '../utils/simpleHome'
import {
  buildMoneyHealthSnapshot,
} from '../utils/moneyHealth'
import {
  sumSafeChetrum,
} from '../utils/explainMoney'

import '../styles/ask-saathi.css'

interface AskData {
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
}

function AskSaathiPage() {
  const [today] =
    useState(() => getLocalToday())

  const [profile] =
    useState(() => getProfile())

  const [preferences] =
    useState(() => getPreferences())

  const [
    data,
    setData,
  ] =
    useState<AskData | null>(
      null,
    )

  const [
    loading,
    setLoading,
  ] =
    useState(true)

  const [
    error,
    setError,
  ] =
    useState('')

  const [
    amountText,
    setAmountText,
  ] =
    useState('')

  const [
    activeTool,
    setActiveTool,
  ] =
    useState<
      'affordability' |
      'attention' |
      'month' |
      'debt'
    >('affordability')

  const [
    question,
    setQuestion,
  ] =
    useState('')

  const [
    localMessage,
    setLocalMessage,
  ] =
    useState('')

  const [
    learningTopic,
    setLearningTopic,
  ] =
    useState<LocalLearningTopic | null>(
      null,
    )

  const [
    localGuidance,
    setLocalGuidance,
  ] =
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
        ] =
          await Promise.all([
            getTransactions(),
            getRegularMoney(),
            getSavingsAccounts(),
            getLoans(),
          ])

        if (!active) {
          return
        }

        setData({
          transactions,
          regularMoney,
          savingsAccounts,
          loans,
        })
      } catch {
        if (active) {
          setError(
            'Ask Saathi could not read your local Money Saathi records.',
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
          today.slice(
            0,
            7,
          ),
          recordedTransactions,
          liquidSavingsChetrum,
        )

      const debt =
        buildDebtSnapshot(
          data.loans,
          data.savingsAccounts,
        )

      const attention =
        buildAttentionItems({
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
          outstandingLoanChetrum:
            debt.outstandingPrincipalChetrum,
          transactionCount:
            recordedTransactions.length,
        })

      const months =
        compareRecordedMonths(
          today.slice(
            0,
            7,
          ),
          recordedTransactions,
        )

      return {
        recordedTransactions,
        safe,
        debt,
        attention,
        months,
      }
    }, [
      data,
      preferences.safetyBufferChetrum,
      today,
    ])

  function handleLocalQuestion() {
    const routed =
      routeLocalSaathiQuestion(
        question,
      )

    setLearningTopic(null)
    setLocalGuidance('')

    if (
      routed.intent ===
      'affordability'
    ) {
      setActiveTool(
        'affordability',
      )

      if (
        routed.amountNu
      ) {
        setAmountText(
          routed.amountNu,
        )

        setLocalMessage(
          'I understood this as an affordability question and opened the local Safe to Spend comparison.',
        )
      } else {
        setLocalMessage(
          'I understood this as an affordability question. Enter the amount you want to test.',
        )
      }

      return
    }

    if (
      routed.intent ===
      'attention'
    ) {
      setActiveTool(
        'attention',
      )

      setLocalMessage(
        'I understood this as a request to review what currently deserves attention.',
      )

      return
    }

    if (
      routed.intent ===
      'month-change'
    ) {
      setActiveTool(
        'month',
      )

      setLocalMessage(
        'I understood this as a request to compare this month with the previous recorded month.',
      )

      return
    }

    if (
      routed.intent ===
      'debt'
    ) {
      setActiveTool(
        'debt',
      )

      setLocalMessage(
        'I understood this as a debt question and opened the recorded debt snapshot.',
      )

      return
    }

    if (
      routed.intent ===
      'saving-guidance'
    ) {
      setLocalMessage(
        'I understood this as a saving question.',
      )

      if (
        !view ||
        !data ||
        view.recordedTransactions.length === 0
      ) {
        setLocalGuidance(
          'A good first step is to record your real income and expenses. Once Money Saathi has some activity, Saathi can show what is coming out, what is safe to use and what saving amount may be realistic. Start small and protect essentials first rather than forcing a fixed percentage.',
        )
      } else {
        setLocalGuidance(
          `This month you have recorded ${formatNu(view.months.current.incomeChetrum)} coming in and ${formatNu(view.months.current.expenseChetrum)} going out. Current Safe to Spend is ${formatNu(view.safe.safeToSpendChetrum)} and recorded Savings Account balances are ${formatNu(view.debt.liquidSavingsChetrum)}. Protect essentials, known commitments and your safety buffer first; then choose a saving amount you can repeat consistently.`,
        )
      }

      return
    }

    if (
      routed.intent ===
      'spending-control'
    ) {
      setLocalMessage(
        'I understood this as a spending-control question.',
      )

      if (
        !view ||
        view.recordedTransactions.length === 0
      ) {
        setLocalGuidance(
          'Start by recording actual expenses for a few days. Without real transactions, Saathi should not guess where your money is going. Once you have records, review repeated flexible spending before cutting essentials.',
        )
      } else {
        setLocalGuidance(
          `This month you have recorded ${formatNu(view.months.current.expenseChetrum)} of expenses against ${formatNu(view.months.current.incomeChetrum)} of income. Review repeated flexible spending first, while protecting essentials and commitments. Money Saathi will not assume every expense can or should be reduced.`,
        )
      }

      return
    }

    if (
      routed.intent ===
      'salary-plan'
    ) {
      setLocalMessage(
        'I understood this as a salary-management question.',
      )

      if (
        !view ||
        view.months.current.incomeChetrum === 0
      ) {
        setLocalGuidance(
          'Record your salary as income and add your regular commitments first. Then Money Saathi can separate what is already committed from what may be safe to use. Avoid building a plan from an assumed salary amount.',
        )
      } else {
        setLocalGuidance(
          `Recorded income this month is ${formatNu(view.months.current.incomeChetrum)}, recorded expenses are ${formatNu(view.months.current.expenseChetrum)}, and current Safe to Spend is ${formatNu(view.safe.safeToSpendChetrum)}. A practical order is essentials, known commitments, safety buffer, then flexible spending and repeatable saving.`,
        )
      }

      return
    }

    if (
      routed.intent ===
        'learn' &&
      routed.learningTopic
    ) {
      setLearningTopic(
        routed.learningTopic,
      )

      setLocalMessage(
        'I understood this as a financial-learning question.',
      )

      return
    }

    setLocalMessage(
      'I could not safely match that question yet. Try asking about spending an amount, what needs attention, what changed this month, debt, EMI, interest, budget, safety buffer, FD, insurance or digital-money safety.',
    )
  }

  const amountChetrum =
    parseNuInputToChetrum(
      amountText,
    )

  const affordability =
    view &&
    amountChetrum !== null
      ? assessAffordability(
          amountChetrum,
          view.safe
            .safeToSpendChetrum,
        )
      : null

  if (loading) {
    return (
      <AppShell>
        <div className="dashboard-container">
          <div className="dashboard2-loading">
            Ask Saathi is reading your local records…
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
              'Ask Saathi could not prepare these local tools.'}
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="dashboard-container ask-saathi-page">
        <header className="ask-saathi-header">
          <p className="dashboard-eyebrow">
            Ask with verified calculations
          </p>

          <h1>Ask Saathi</h1>

          <p>
            These tools answer common money questions with
            deterministic calculations from records on this device.
            There is no generative AI call in this stage.
          </p>

          <div className="ask-saathi-header-links">
            <Link to="/app/saathi">
              Saathi guidance
            </Link>

            <Link to="/app/saathi/privacy">
              Data permissions
            </Link>
          </div>
        </header>

        <section className="ask-saathi-trust">
          <strong>
            The calculation happens before the explanation.
          </strong>

          <span>
            Saathi does not invent balances, income, debt or Safe to
            Spend. Missing records can still make the real-world
            picture incomplete.
          </span>
        </section>

        <section className="ask-saathi-question-box">
          <div>
            <p className="dashboard-eyebrow">
              Ask in your own words
            </p>

            <h2>
              What would you like to understand?
            </h2>

            <p>
              This local language router matches supported phrases to
              Money Saathi's verified tools. It does not send your
              question or financial records anywhere.
            </p>
          </div>

          <div className="ask-saathi-question-input-row">
            <input
              type="text"
              value={question}
              placeholder="Example: Can I spend Nu. 5,000 before salary?"
              onChange={(event) => {
                setQuestion(
                  event.target.value,
                )
                setLocalMessage('')
                setLearningTopic(null)
                setLocalGuidance('')
              }}
              onKeyDown={(event) => {
                if (
                  event.key ===
                  'Enter'
                ) {
                  handleLocalQuestion()
                }
              }}
            />

            <button
              type="button"
              onClick={
                handleLocalQuestion
              }
            >
              Ask locally
            </button>
          </div>

          <div className="ask-saathi-question-examples">
            <button
              type="button"
              onClick={() =>
                setQuestion(
                  'What needs attention?',
                )
              }
            >
              What needs attention?
            </button>

            <button
              type="button"
              onClick={() =>
                setQuestion(
                  'Why did I spend more this month?',
                )
              }
            >
              Why did I spend more?
            </button>

            <button
              type="button"
              onClick={() =>
                setQuestion(
                  'Explain EMI',
                )
              }
            >
              Explain EMI
            </button>
          </div>

          {localMessage && (
            <div
              className="ask-saathi-local-message"
              role="status"
            >
              {localMessage}
            </div>
          )}

          {learningTopic && (
            <div className="ask-saathi-learning-answer">
              <strong>
                {
                  LOCAL_LEARNING_ANSWERS[
                    learningTopic
                  ].title
                }
              </strong>

              <p>
                {
                  LOCAL_LEARNING_ANSWERS[
                    learningTopic
                  ].answer
                }
              </p>
            </div>
          )}

          {localGuidance && (
            <div className="ask-saathi-learning-answer">
              <strong>
                Saathi
              </strong>

              <p>
                {localGuidance}
              </p>
            </div>
          )}
        </section>

        <nav
          className="ask-saathi-tools"
          aria-label="Ask Saathi local tools"
        >
          <button
            type="button"
            className={
              activeTool ===
              'affordability'
                ? 'active'
                : ''
            }
            aria-pressed={
              activeTool ===
              'affordability'
            }
            onClick={() =>
              setActiveTool(
                'affordability',
              )
            }
          >
            Can I spend this?
          </button>

          <button
            type="button"
            className={
              activeTool ===
              'attention'
                ? 'active'
                : ''
            }
            aria-pressed={
              activeTool ===
              'attention'
            }
            onClick={() =>
              setActiveTool(
                'attention',
              )
            }
          >
            What needs attention?
          </button>

          <button
            type="button"
            className={
              activeTool ===
              'month'
                ? 'active'
                : ''
            }
            aria-pressed={
              activeTool ===
              'month'
            }
            onClick={() =>
              setActiveTool(
                'month',
              )
            }
          >
            What changed?
          </button>

          <button
            type="button"
            className={
              activeTool ===
              'debt'
                ? 'active'
                : ''
            }
            aria-pressed={
              activeTool ===
              'debt'
            }
            onClick={() =>
              setActiveTool(
                'debt',
              )
            }
          >
            Debt snapshot
          </button>
        </nav>

        {activeTool ===
          'affordability' && (
          <section className="ask-saathi-panel">
            <div>
              <p className="dashboard-eyebrow">
                Scenario tool
              </p>

              <h2>
                Can I spend this amount?
              </h2>

              <p>
                This compares the amount only with current Safe to
                Spend. It does not assume future income or make a
                purchase decision for you.
              </p>
            </div>

            <label className="ask-saathi-amount">
              Amount in Nu.

              <input
                type="text"
                inputMode="decimal"
                placeholder="5000"
                value={amountText}
                onChange={(event) =>
                  setAmountText(
                    event.target.value,
                  )
                }
              />
            </label>

            <div className="ask-saathi-affordability">
              <article>
                <span>
                  Current Safe to Spend
                </span>

                <strong>
                  {formatNu(
                    view.safe
                      .safeToSpendChetrum,
                  )}
                </strong>
              </article>

              {affordability && (
                <article>
                  <span>
                    After this scenario
                  </span>

                  <strong>
                    {formatNu(
                      affordability
                        .remainingChetrum,
                    )}
                  </strong>
                </article>
              )}
            </div>

            {amountText &&
            amountChetrum ===
              null && (
              <div
                className="ask-saathi-warning"
                role="alert"
              >
                Enter a non-negative amount with no more than two
                decimal places.
              </div>
            )}

            {affordability && (
              <div
                className={
                  `ask-saathi-result ${affordability.status}`
                }
              >
                <strong>
                  {affordability.status ===
                  'within'
                    ? 'This amount fits inside the current recorded Safe to Spend.'
                    : affordability.status ===
                        'above'
                      ? 'This amount is above the current recorded Safe to Spend.'
                      : 'There is currently no positive recorded Safe to Spend.'}
                </strong>

                <p>
                  This is a planning comparison, not a guarantee that
                  the purchase is affordable in real life. Unrecorded
                  expenses, cash needs or debt can change the answer.
                </p>
              </div>
            )}
          </section>
        )}

        {activeTool ===
          'attention' && (
          <section className="ask-saathi-panel">
            <div>
              <p className="dashboard-eyebrow">
                Local signals
              </p>

              <h2>
                What deserves attention?
              </h2>

              <p>
                These signals are generated from the records currently
                stored in Money Saathi. They are not a financial score.
              </p>
            </div>

            <div className="ask-saathi-attention-list">
              {view.attention.map(
                (item) => (
                  <article
                    key={item.id}
                    className={
                      `ask-saathi-attention ${item.priority}`
                    }
                  >
                    <span>
                      {item.priority}
                    </span>

                    <strong>
                      {item.title}
                    </strong>

                    <p>
                      {item.explanation}
                    </p>
                  </article>
                ),
              )}
            </div>
          </section>
        )}

        {activeTool ===
          'month' && (
          <section className="ask-saathi-panel">
            <div>
              <p className="dashboard-eyebrow">
                Recorded month comparison
              </p>

              <h2>
                What changed?
              </h2>

              <p>
                This compares recorded transactions in the current
                calendar month with the previous calendar month.
              </p>
            </div>

            <div className="ask-saathi-month-grid">
              <article>
                <span>
                  Income change
                </span>

                <strong>
                  {formatNu(
                    view.months
                      .incomeChangeChetrum,
                  )}
                </strong>
              </article>

              <article>
                <span>
                  Expense change
                </span>

                <strong>
                  {formatNu(
                    view.months
                      .expenseChangeChetrum,
                  )}
                </strong>
              </article>

              <article>
                <span>
                  Net movement change
                </span>

                <strong>
                  {formatNu(
                    view.months
                      .netChangeChetrum,
                  )}
                </strong>
              </article>
            </div>

            <div className="ask-saathi-month-detail">
              <div>
                <strong>
                  {view.months.current.month}
                </strong>

                <span>
                  In{' '}
                  {formatNu(
                    view.months.current
                      .incomeChetrum,
                  )}
                  {' · '}
                  Out{' '}
                  {formatNu(
                    view.months.current
                      .expenseChetrum,
                  )}
                </span>
              </div>

              <div>
                <strong>
                  {view.months.previous.month}
                </strong>

                <span>
                  In{' '}
                  {formatNu(
                    view.months.previous
                      .incomeChetrum,
                  )}
                  {' · '}
                  Out{' '}
                  {formatNu(
                    view.months.previous
                      .expenseChetrum,
                  )}
                </span>
              </div>
            </div>
          </section>
        )}

        {activeTool ===
          'debt' && (
          <section className="ask-saathi-panel">
            <div>
              <p className="dashboard-eyebrow">
                Recorded loan position
              </p>

              <h2>
                Debt snapshot
              </h2>

              <p>
                This summarizes the outstanding loan values and Savings
                Account balances you entered. It does not value all
                assets and is not a recommendation to repay debt.
              </p>
            </div>

            <div className="ask-saathi-debt-grid">
              <article>
                <span>
                  Outstanding principal
                </span>

                <strong>
                  {formatNu(
                    view.debt
                      .outstandingPrincipalChetrum,
                  )}
                </strong>
              </article>

              <article>
                <span>
                  Recorded monthly EMIs
                </span>

                <strong>
                  {formatNu(
                    view.debt
                      .monthlyEmiChetrum,
                  )}
                </strong>
              </article>

              <article>
                <span>
                  Savings Account balances
                </span>

                <strong>
                  {formatNu(
                    view.debt
                      .liquidSavingsChetrum,
                  )}
                </strong>
              </article>

              <article>
                <span>
                  Principal less liquid savings
                </span>

                <strong>
                  {formatNu(
                    view.debt
                      .principalLessLiquidSavingsChetrum,
                  )}
                </strong>
              </article>
            </div>
          </section>
        )}

        <section className="ask-saathi-provenance">
          <div>
            <strong>
              Based on
            </strong>

            <p>
              {view.recordedTransactions.length} recorded transaction
              {view.recordedTransactions.length === 1 ? '' : 's'},
              {' '}
              {data.regularMoney.length} regular-money item
              {data.regularMoney.length === 1 ? '' : 's'},
              {' '}
              {data.loans.length} loan
              {data.loans.length === 1 ? '' : 's'},
              {' '}
              {data.savingsAccounts.length} Savings Account record
              {data.savingsAccounts.length === 1 ? '' : 's'}.
            </p>
          </div>

          <div>
            <strong>
              Not used
            </strong>

            <p>
              Money Vault, bank APIs, internet searches, external AI models,
              future unreceived income or information you did
              not record.
            </p>
          </div>
        </section>

        <section className="ask-saathi-profile-note">
          <strong>
            Your selected setup
          </strong>

          <p>
            {profile.needs.length > 0
              ? profile.needs.join(' · ')
              : 'General Money Saathi'}
          </p>
        </section>
      </div>
    </AppShell>
  )
}

export default AskSaathiPage