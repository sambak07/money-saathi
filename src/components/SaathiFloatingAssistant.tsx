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
            'Ask me about spending, what needs attention, month-to-month changes, debt or a money concept. Everything here runs locally.',
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
              Local only · Money Vault stays private
            </span>

            <Link to="/app/saathi/ask">
              Open full Saathi
            </Link>
          </footer>
        </section>
      )}

      <button
        type="button"
        className={
          open
            ? 'saathi-floating-launcher open'
            : 'saathi-floating-launcher'
        }
        aria-expanded={open}
        aria-controls="saathi-floating-panel"
        aria-label={
          open
            ? 'Hide Saathi'
            : 'Ask Saathi'
        }
        onClick={() => {
          if (open) {
            setOpen(false)
            return
          }

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
    </>
  )
}

export default SaathiFloatingAssistant