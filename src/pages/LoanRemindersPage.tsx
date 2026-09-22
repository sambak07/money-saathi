import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  Link,
} from 'react-router-dom'

import {
  buildLoanReminderReferences,
  getLoanDueReminders,
  markLoanReminderPaid,
  removeLoanDueReminder,
  saveLoanDueReminder,
  type LoanDueReminder,
  type LoanReminderFrequency,
} from '../alerts/loanDueReminders'
import AppShell from '../components/AppShell'
import {
  getLoans,
} from '../storage/db'
import {
  formatNu,
  getLocalToday,
} from '../utils/money'
import {
  formatScheduleDate,
} from '../utils/recurrence'
import {
  formatChetrumForSafetyInput,
  parseNuInputToChetrum,
} from '../utils/safeToSpend'

import '../styles/loan-reminders.css'

interface LoanRow {
  id: string
  name: string
}

interface LoanReminderDraft {
  amount: string
  nextDueDate: string
  frequency: LoanReminderFrequency
}

function draftFromReminder(
  reminder: LoanDueReminder | undefined,
): LoanReminderDraft {
  return {
    amount:
      reminder &&
      reminder.amountChetrum > 0
        ? formatChetrumForSafetyInput(
            reminder.amountChetrum,
          )
        : '',
    nextDueDate:
      reminder?.nextDueDate ?? '',
    frequency:
      reminder?.frequency ??
      'monthly',
  }
}

function LoanRemindersPage() {
  const [today] =
    useState(() => getLocalToday())

  const [loans, setLoans] =
    useState<LoanRow[]>([])

  const [reminders, setReminders] =
    useState<LoanDueReminder[]>(
      () => getLoanDueReminders(),
    )

  const [drafts, setDrafts] =
    useState<Record<
      string,
      LoanReminderDraft
    >>({})

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
        const result =
          await getLoans()

        if (!active) return

        const reminderState =
          getLoanDueReminders()

        const loanRows =
          result.map(
            (loan) => ({
              id: loan.id,
              name: loan.name,
            }),
          )

        const initialDrafts: Record<
          string,
          LoanReminderDraft
        > = {}

        for (const loan of loanRows) {
          initialDrafts[loan.id] =
            draftFromReminder(
              reminderState.find(
                (item) =>
                  item.loanId ===
                  loan.id,
              ),
            )
        }

        setLoans(loanRows)
        setReminders(reminderState)
        setDrafts(initialDrafts)
      } catch {
        if (active) {
          setError(
            'Money Saathi could not load your loans.',
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

  const references =
    useMemo(
      () =>
        buildLoanReminderReferences(
          loans,
          reminders,
        ),
      [
        loans,
        reminders,
      ],
    )

  function refreshReminderState(
    loanId?: string,
  ) {
    const next =
      getLoanDueReminders()

    setReminders(next)

    if (loanId) {
      setDrafts(
        (current) => ({
          ...current,
          [loanId]:
            draftFromReminder(
              next.find(
                (item) =>
                  item.loanId ===
                  loanId,
              ),
            ),
        }),
      )
    }
  }

  function setDraft(
    loanId: string,
    patch: Partial<LoanReminderDraft>,
  ) {
    setDrafts(
      (current) => ({
        ...current,
        [loanId]: {
          ...(
            current[loanId] ?? {
              amount: '',
              nextDueDate: '',
              frequency: 'monthly',
            }
          ),
          ...patch,
        },
      }),
    )
  }

  function save(
    event: FormEvent<HTMLFormElement>,
    loan: LoanRow,
  ) {
    event.preventDefault()
    setError('')
    setMessage('')

    const draft =
      drafts[loan.id]

    if (!draft) {
      return
    }

    const amountChetrum =
      parseNuInputToChetrum(
        draft.amount,
      )

    if (
      amountChetrum === null ||
      amountChetrum <= 0
    ) {
      setError(
        `Enter a valid payment amount for ${loan.name}.`,
      )
      return
    }

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(
        draft.nextDueDate,
      )
    ) {
      setError(
        `Choose a verified next payment date for ${loan.name}.`,
      )
      return
    }

    saveLoanDueReminder({
      loanId: loan.id,
      amountChetrum,
      nextDueDate:
        draft.nextDueDate,
      frequency:
        draft.frequency,
      enabled: true,
    })

    refreshReminderState(
      loan.id,
    )

    setMessage(
      `${loan.name} reminder saved.`,
    )
  }

  function markPaid(
    reminder: LoanDueReminder,
    loanName: string,
  ) {
    const next =
      markLoanReminderPaid(
        reminder,
      )

    saveLoanDueReminder({
      loanId:
        next.loanId,
      amountChetrum:
        next.amountChetrum,
      nextDueDate:
        next.nextDueDate,
      frequency:
        next.frequency,
      enabled:
        next.enabled,
    })

    refreshReminderState(
      reminder.loanId,
    )

    setMessage(
      next.enabled
        ? `${loanName} marked paid. Next monthly due date moved to ${formatScheduleDate(next.nextDueDate)}.`
        : `${loanName} one-time reminder marked complete.`,
    )
  }

  function remove(
    loanId: string,
    loanName: string,
  ) {
    removeLoanDueReminder(
      loanId,
    )

    refreshReminderState(
      loanId,
    )

    setMessage(
      `${loanName} reminder removed.`,
    )
  }

  if (loading) {
    return (
      <AppShell>
        <div className="dashboard-container">
          <div className="dashboard2-loading">
            Loading loan reminders...
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="dashboard-container loan-reminders-page">
        <header className="loan-reminders-header">
          <div>
            <p className="dashboard-eyebrow">
              Verified dates, never guessed
            </p>

            <h1>Loan reminders</h1>

            <p>
              Add the next payment date and amount you know to be
              correct. Money Saathi will remind you from that
              verified information instead of trying to infer an
              EMI date from loan calculations.
            </p>
          </div>

          <Link to="/app/alerts">
            Alert Centre
          </Link>
        </header>

        {message && (
          <div
            className="loan-reminders-message"
            role="status"
          >
            {message}
          </div>
        )}

        {error && (
          <div
            className="loan-reminders-error"
            role="alert"
          >
            {error}
          </div>
        )}

        <section className="loan-reminders-trust">
          <strong>
            Payment date is user-confirmed.
          </strong>

          <span>
            Money Saathi does not derive it from tenure, EMI,
            interest rate or start date. If your lender changes
            the due date, update it here.
          </span>
        </section>

        {loans.length === 0 ? (
          <section className="loan-reminders-empty">
            <strong>
              No loans are recorded yet.
            </strong>

            <p>
              Add a loan first, then return here to configure its
              verified payment reminder.
            </p>

            <Link to="/app/my-money/loans">
              Open loans
            </Link>
          </section>
        ) : (
          <section className="loan-reminders-list">
            {loans.map(
              (loan) => {
                const reminder =
                  reminders.find(
                    (item) =>
                      item.loanId ===
                      loan.id,
                  )

                const draft =
                  drafts[loan.id] ??
                  draftFromReminder(
                    reminder,
                  )

                const reference =
                  references.find(
                    (item) =>
                      item.loanId ===
                      loan.id,
                  )

                return (
                  <article
                    key={loan.id}
                    className="loan-reminder-card"
                  >
                    <div className="loan-reminder-card-heading">
                      <div>
                        <span>Recorded loan</span>

                        <h2>
                          {loan.name}
                        </h2>
                      </div>

                      {reference && (
                        <div className="loan-reminder-status">
                          <strong>
                            {formatNu(
                              reference.amountChetrum,
                            )}
                          </strong>

                          <span>
                            {formatScheduleDate(
                              reference.nextDueDate,
                            )}
                          </span>
                        </div>
                      )}
                    </div>

                    <form
                      onSubmit={(event) =>
                        save(
                          event,
                          loan,
                        )
                      }
                    >
                      <label>
                        Payment amount (Nu.)
                        <input
                          type="text"
                          inputMode="decimal"
                          autoComplete="off"
                          placeholder="e.g. 14200"
                          value={
                            draft.amount
                          }
                          onChange={(event) =>
                            setDraft(
                              loan.id,
                              {
                                amount:
                                  event.target.value,
                              },
                            )
                          }
                        />
                      </label>

                      <label>
                        Verified next due date
                        <input
                          type="date"
                          min={
                            reminder
                              ? undefined
                              : today
                          }
                          value={
                            draft.nextDueDate
                          }
                          onChange={(event) =>
                            setDraft(
                              loan.id,
                              {
                                nextDueDate:
                                  event.target.value,
                              },
                            )
                          }
                        />
                      </label>

                      <label>
                        After I mark it paid
                        <select
                          value={
                            draft.frequency
                          }
                          onChange={(event) =>
                            setDraft(
                              loan.id,
                              {
                                frequency:
                                  event.target.value as LoanReminderFrequency,
                              },
                            )
                          }
                        >
                          <option value="monthly">
                            Move to next month
                          </option>

                          <option value="one-time">
                            Complete reminder
                          </option>
                        </select>
                      </label>

                      <button type="submit">
                        Save reminder
                      </button>
                    </form>

                    {reminder?.enabled && (
                      <div className="loan-reminder-actions">
                        <button
                          type="button"
                          onClick={() =>
                            markPaid(
                              reminder,
                              loan.name,
                            )
                          }
                        >
                          Mark paid
                        </button>

                        <button
                          type="button"
                          className="secondary"
                          onClick={() =>
                            remove(
                              loan.id,
                              loan.name,
                            )
                          }
                        >
                          Remove reminder
                        </button>
                      </div>
                    )}
                  </article>
                )
              },
            )}
          </section>
        )}

        <section className="loan-reminders-guardrails">
          <div>
            <strong>
              Mark paid is deliberate
            </strong>

            <p>
              Money Saathi will not assume a payment happened just
              because the due date passed. You confirm it.
            </p>
          </div>

          <div>
            <strong>
              Monthly means one calendar month forward
            </strong>

            <p>
              Month-end dates are safely clamped when the next
              month is shorter, such as 31 January to 28 or 29
              February.
            </p>
          </div>

          <div>
            <strong>
              Reminder settings are currently device-local
            </strong>

            <p>
              These verified reminder dates stay on this browser.
              They are not yet part of the encrypted backup file;
              Money Saathi shows this explicitly rather than
              pretending otherwise.
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  )
}

export default LoanRemindersPage
