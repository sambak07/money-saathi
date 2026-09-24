import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  Link,
  useLocation,
} from 'react-router-dom'

import {
  LOCAL_LEARNING_ANSWERS,
  routeLocalSaathiQuestion,
} from '../saathi/localQuestionRouter'
import {
  getSaathiSuggestions,
} from '../saathi/contextualSuggestions'
import {
  assessAffordability,
  buildAttentionItems,
  buildDebtSnapshot,
  compareRecordedMonths,
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

import '../styles/saathi-floating.css'

interface FloatingData {
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

interface FloatingMessage {
  id: number
  role: 'user' | 'saathi'
  text: string
}

interface FloatingView {
  safeToSpendChetrum: number
  safetyBufferChetrum: number
  transactionCount: number
  attention: ReturnType<
    typeof buildAttentionItems
  >
  months: ReturnType<
    typeof compareRecordedMonths
  >
  debt: ReturnType<
    typeof buildDebtSnapshot
  >
}

function SaathiFloatingAssistant() {
  const { pathname } =
    useLocation()

  const [
    open,
    setOpen,
  ] =
    useState(false)

  const [
    question,
    setQuestion,
  ] =
    useState('')

  const [
    data,
    setData,
  ] =
    useState<FloatingData | null>(
      null,
    )

  const [
    loading,
    setLoading,
  ] =
    useState(false)

  const [
    loadError,
    setLoadError,
  ] =
    useState('')

  const [
    messages,
    setMessages,
  ] =
    useState<FloatingMessage[]>(
      [
        {
          id: 1,
          role: 'saathi',
          text:
            'Ask about spending, debt, monthly changes or money basics. Everything stays on this device.',
        },
      ],
    )

  const nextMessageId =
    useRef(2)

  const inputRef =
    useRef<HTMLInputElement | null>(
      null,
    )

  const suggestions =
    useMemo(
      () =>
        getSaathiSuggestions(
          pathname,
        ),
      [pathname],
    )

  useEffect(() => {
    if (!open) {
      return
    }

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

        setLoadError('')
      } catch {
        if (active) {
          setLoadError(
            'Saathi could not read your local Money Saathi records.',
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
  }, [
    open,
    pathname,
  ])

  useEffect(() => {
    if (!open) {
      return
    }

    function onKeyDown(
      event: KeyboardEvent,
    ) {
      if (
        event.key ===
        'Escape'
      ) {
        setOpen(false)
      }
    }

    window.addEventListener(
      'keydown',
      onKeyDown,
    )

    return () => {
      window.removeEventListener(
        'keydown',
        onKeyDown,
      )
    }
  }, [open])

  useEffect(() => {
    if (
      open &&
      inputRef.current
    ) {
      inputRef.current.focus()
    }
  }, [open])

  const view =
    useMemo<FloatingView | null>(
      () => {
        if (!data) {
          return null
        }

        const today =
          getLocalToday()

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

        const preferences =
          getPreferences()

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

        return {
          safeToSpendChetrum:
            safe.safeToSpendChetrum,
          safetyBufferChetrum:
            safe.safetyBufferChetrum,
          transactionCount:
            recordedTransactions.length,
          attention:
            buildAttentionItems({
              safeToSpendChetrum:
                safe.safeToSpendChetrum,
              upcomingCommitmentsChetrum:
                safe.upcomingCommitmentsChetrum,
              safetyBufferChetrum:
                safe.safetyBufferChetrum,
              currentMonthIncomeChetrum:
                health.currentMonth
                  .incomeChetrum,
              currentMonthExpenseChetrum:
                health.currentMonth
                  .expenseChetrum,
              outstandingLoanChetrum:
                debt.outstandingPrincipalChetrum,
              transactionCount:
                recordedTransactions.length,
            }),
          months:
            compareRecordedMonths(
              today.slice(
                0,
                7,
              ),
              recordedTransactions,
            ),
          debt,
        }
      },
      [data],
    )

  function addMessage(
    role: FloatingMessage['role'],
    text: string,
  ) {
    const id =
      nextMessageId.current

    nextMessageId.current += 1

    setMessages(
      (current) => [
        ...current,
        {
          id,
          role,
          text,
        },
      ],
    )
  }

  function answerQuestion(
    rawQuestion: string,
  ) {
    const trimmed =
      rawQuestion.trim()

    if (!trimmed) {
      return
    }

    addMessage(
      'user',
      trimmed,
    )

    setQuestion('')

    const routed =
      routeLocalSaathiQuestion(
        trimmed,
      )

    if (
      routed.intent ===
        'learn' &&
      routed.learningTopic
    ) {
      addMessage(
        'saathi',
        LOCAL_LEARNING_ANSWERS[
          routed.learningTopic
        ].answer,
      )

      return
    }

    if (
      loading ||
      !view
    ) {
      addMessage(
        'saathi',
        loadError ||
          'I am still reading the local records needed for that question. Try again in a moment.',
      )

      return
    }

    if (
      routed.intent ===
      'affordability'
    ) {
      if (!routed.amountNu) {
        addMessage(
          'saathi',
          'Tell me the amount as part of the question, for example: “Can I spend Nu. 5,000?”',
        )

        return
      }

      const amountChetrum =
        parseNuInputToChetrum(
          routed.amountNu,
        )

      if (
        amountChetrum ===
        null
      ) {
        addMessage(
          'saathi',
          'I could not safely read that amount. Use a non-negative amount with no more than two decimal places.',
        )

        return
      }

      const result =
        assessAffordability(
          amountChetrum,
          view.safeToSpendChetrum,
        )

      if (
        result.status ===
        'within'
      ) {
        addMessage(
          'saathi',
          `${formatNu(amountChetrum)} fits inside your current recorded Safe to Spend of ${formatNu(result.safeToSpendChetrum)}. About ${formatNu(result.remainingChetrum)} would remain within that planning amount. This is not a guarantee: unrecorded expenses can change the picture.`,
        )

        return
      }

      if (
        result.status ===
        'above'
      ) {
        addMessage(
          'saathi',
          `${formatNu(amountChetrum)} is above your current recorded Safe to Spend of ${formatNu(result.safeToSpendChetrum)} by ${formatNu(Math.abs(result.remainingChetrum))}. This is a planning comparison, not a purchase decision.`,
        )

        return
      }

      addMessage(
        'saathi',
        'There is currently no positive recorded Safe to Spend. Review known commitments and your safety buffer before optional spending.',
      )

      return
    }

    if (
      routed.intent ===
      'attention'
    ) {
      const topItems =
        view.attention
          .slice(0, 3)
          .map(
            (item, index) =>
              `${index + 1}. ${item.title}: ${item.explanation}`,
          )
          .join(' ')

      addMessage(
        'saathi',
        topItems,
      )

      return
    }

    if (
      routed.intent ===
      'month-change'
    ) {
      addMessage(
        'saathi',
        `Compared with the previous recorded month, income changed by ${formatNu(view.months.incomeChangeChetrum)}, expenses changed by ${formatNu(view.months.expenseChangeChetrum)}, and net movement changed by ${formatNu(view.months.netChangeChetrum)}. This reflects recorded transactions only.`,
      )

      return
    }

    if (
      routed.intent ===
      'debt'
    ) {
      addMessage(
        'saathi',
        `You have ${view.debt.loanCount} recorded loan${view.debt.loanCount === 1 ? '' : 's'}. Outstanding principal is ${formatNu(view.debt.outstandingPrincipalChetrum)} and recorded monthly EMIs total ${formatNu(view.debt.monthlyEmiChetrum)}. Savings Account balances recorded in Money Saathi total ${formatNu(view.debt.liquidSavingsChetrum)}. This is not full net worth.`,
      )

      return
    }

    if (
      routed.intent ===
      'saving-guidance'
    ) {
      if (
        view.transactionCount ===
        0
      ) {
        addMessage(
          'saathi',
          'A good first step is to record your real income and expenses. Once Money Saathi has some activity, I can show what is coming out, what is safe to use and what saving amount may be realistic. Start small and protect essentials first rather than forcing a fixed percentage.',
        )

        return
      }

      addMessage(
        'saathi',
        `This month you have recorded ${formatNu(view.months.current.incomeChetrum)} coming in and ${formatNu(view.months.current.expenseChetrum)} going out. Current Safe to Spend is ${formatNu(view.safeToSpendChetrum)} and recorded Savings Account balances are ${formatNu(view.debt.liquidSavingsChetrum)}. Protect essentials, known commitments and your safety buffer first; then choose a saving amount you can repeat consistently.`,
      )

      return
    }

    if (
      routed.intent ===
      'spending-control'
    ) {
      if (
        view.transactionCount ===
        0
      ) {
        addMessage(
          'saathi',
          'Start by recording actual expenses for a few days. Without real transactions, I should not guess where your money is going. Once you have records, review repeated flexible spending before cutting essentials.',
        )

        return
      }

      addMessage(
        'saathi',
        `This month you have recorded ${formatNu(view.months.current.expenseChetrum)} of expenses against ${formatNu(view.months.current.incomeChetrum)} of income. Review repeated flexible spending first, while protecting essentials and known commitments. I will not assume every expense can or should be reduced.`,
      )

      return
    }

    if (
      routed.intent ===
      'salary-plan'
    ) {
      if (
        view.months.current.incomeChetrum ===
        0
      ) {
        addMessage(
          'saathi',
          'Record your salary as income and add your regular commitments first. Then I can separate what is already committed from what may be safe to use. I will not build a plan from an assumed salary amount.',
        )

        return
      }

      addMessage(
        'saathi',
        `Recorded income this month is ${formatNu(view.months.current.incomeChetrum)}, recorded expenses are ${formatNu(view.months.current.expenseChetrum)}, and current Safe to Spend is ${formatNu(view.safeToSpendChetrum)}. A practical order is essentials, known commitments, safety buffer, then flexible spending and repeatable saving.`,
      )

      return
    }

    addMessage(
      'saathi',
      'I could not safely match that question yet. Try asking about spending an amount, what needs attention, what changed this month, debt, EMI, interest, budget, safety buffer, fixed deposits, insurance or digital-money safety.',
    )
  }

  function submit(
    event: React.FormEvent,
  ) {
    event.preventDefault()

    answerQuestion(
      question,
    )
  }

  return (
    <>
      {open && (
        <section
          id="saathi-floating-panel"
          className="saathi-floating-panel"
          role="region"
          aria-label="Ask Saathi"
        >
          <header className="saathi-floating-header">
            <div>
              <span className="saathi-floating-kicker">
                Local money helper
              </span>

              <strong>
                Saathi
              </strong>
            </div>

            <button
              type="button"
              className="saathi-floating-close"
              aria-label="Close Saathi"
              onClick={() =>
                setOpen(false)
              }
            >
              ×
            </button>
          </header>

          <div
            className="saathi-floating-messages"
            aria-live="polite"
          >
            {messages.map(
              (message) => (
                <div
                  key={message.id}
                  className={
                    message.role ===
                    'user'
                      ? 'saathi-floating-message user'
                      : 'saathi-floating-message saathi'
                  }
                >
                  <span>
                    {message.role ===
                    'user'
                      ? 'You'
                      : 'Saathi'}
                  </span>

                  <p>
                    {message.text}
                  </p>
                </div>
              ),
            )}
          </div>

          {loadError && (
            <div
              className="saathi-floating-error"
              role="alert"
            >
              {loadError}
            </div>
          )}

          <div className="saathi-floating-suggestions">
            {suggestions.map(
              (suggestion) => (
                <button
                  key={
                    suggestion.question
                  }
                  type="button"
                  onClick={() =>
                    answerQuestion(
                      suggestion.question,
                    )
                  }
                >
                  {suggestion.label}
                </button>
              ),
            )}
          </div>

          <form
            className="saathi-floating-form"
            onSubmit={submit}
          >
            <label
              htmlFor="saathi-floating-question"
              className="visually-hidden"
            >
              Ask Saathi a money question
            </label>

            <input
              id="saathi-floating-question"
              ref={inputRef}
              type="text"
              value={question}
              placeholder="Ask Saathi…"
              autoComplete="off"
              onChange={(event) =>
                setQuestion(
                  event.target.value,
                )
              }
            />

            <button
              type="submit"
              disabled={
                !question.trim()
              }
            >
              Ask
            </button>
          </form>

          <footer className="saathi-floating-footer">
            <span>
              Local only · Vault stays private
            </span>

            <Link to="/app/saathi/ask">
              Open full Saathi
            </Link>
          </footer>
        </section>
      )}

      {!open && (
        <button
          type="button"
          className="saathi-floating-launcher"
          aria-expanded={false}
          aria-controls="saathi-floating-panel"
          aria-label="Ask Saathi"
          onClick={() => {
            setLoading(true)
            setLoadError('')
            setOpen(true)
          }}
        >
          <span
            className="saathi-floating-mark"
            aria-hidden="true"
          >
            S
          </span>

          <span className="saathi-floating-label">
            <strong>
              Saathi
            </strong>

            <small>
              Ask
            </small>
          </span>
        </button>
      )}
    </>
  )
}

export default SaathiFloatingAssistant