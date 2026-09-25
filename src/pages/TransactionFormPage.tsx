import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  Link,
  useNavigate,
  useParams,
} from 'react-router-dom'

import AppShell from '../components/AppShell'
import {
  addTransaction,
  getTransaction,
  getTransactions,
  updateTransaction,
} from '../storage/db'
import type {
  MoneyTransaction,
  TransactionKind,
} from '../types/transaction'
import {
  formatChetrumForInput,
  formatNu,
  getLocalToday,
  parseNuToChetrum,
} from '../utils/money'
import {
  isFutureTransactionDate,
  preserveRecurringMetadata,
} from '../utils/transactionIntegrity'
import {
  parseTransactionMessage,
  type ParsedTransactionMessage,
} from '../utils/transactionMessage'

const incomeCategories = [
  'Salary',
  'Business',
  'Rent',
  'Allowance',
  'Interest',
  'Gift',
  'Other income',
]

const expenseCategories = [
  'Food',
  'Transport',
  'Housing',
  'Bills',
  'Shopping',
  'Health',
  'Education',
  'Family',
  'Loan payment',
  'Entertainment',
  'Other expense',
]

function TransactionFormPage() {
  const navigate = useNavigate()
  const params = useParams()

  const editingId = params.id
  const [today] =
    useState(() => getLocalToday())

  const [existingTransaction, setExistingTransaction] =
    useState<MoneyTransaction | null>(null)

  const [kind, setKind] =
    useState<TransactionKind>('expense')

  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [date, setDate] = useState(today)
  const [note, setNote] = useState('')

  const [createdAt, setCreatedAt] =
    useState<number | null>(null)

  const [loading, setLoading] =
    useState(Boolean(editingId))

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [pastedMessage, setPastedMessage] =
    useState('')

  const [messageAnalysis, setMessageAnalysis] =
    useState<ParsedTransactionMessage | null>(null)

  const [messageError, setMessageError] =
    useState('')

  const [messageDuplicateWarning, setMessageDuplicateWarning] =
    useState('')

  const categories =
    kind === 'income'
      ? incomeCategories
      : expenseCategories

  const parsedAmount = useMemo(
    () => parseNuToChetrum(amount),
    [amount],
  )

  useEffect(() => {
    if (!editingId) {
      return
    }

    let active = true

    async function loadExistingTransaction() {
      try {
        const record = await getTransaction(editingId!)

        if (!active) {
          return
        }

        if (!record) {
          setError('Transaction could not be found.')
          return
        }

        setKind(record.kind)
        setAmount(
          formatChetrumForInput(record.amountChetrum),
        )
        setCategory(record.category)
        setDate(record.date)
        setNote(record.note)
        setCreatedAt(record.createdAt)
        setExistingTransaction(record)
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadExistingTransaction()

    return () => {
      active = false
    }
  }, [editingId])

  function handleKindChange(
    nextKind: TransactionKind,
  ) {
    if (
      existingTransaction?.recurringSourceId &&
      existingTransaction.scheduledFor
    ) {
      setError(
        'This transaction is linked to Regular Money. Change the schedule if its Money in or Money out type is wrong.',
      )
      return
    }

    setKind(nextKind)
    setCategory('')
    setError('')
  }

  async function analyzePastedMessage() {
    setMessageError('')
    setMessageDuplicateWarning('')

    if (!pastedMessage.trim()) {
      setMessageAnalysis(null)
      setMessageError(
        'Paste a transaction message first.',
      )
      return
    }

    const analysis =
      parseTransactionMessage(
        pastedMessage,
      )

    setMessageAnalysis(
      analysis,
    )

    if (
      analysis.amountChetrum ===
      null
    ) {
      setMessageError(
        'Money Saathi could not safely identify one transaction amount. Review the message and enter the amount manually.',
      )
      return
    }

    if (
      analysis.direction ===
        'unknown' ||
      !analysis.date
    ) {
      return
    }

    try {
      const transactions =
        await getTransactions()

      const possibleDuplicate =
        transactions.some(
          (transaction) =>
            transaction.kind ===
              analysis.direction &&
            transaction.amountChetrum ===
              analysis.amountChetrum &&
            transaction.date ===
              analysis.date,
        )

      if (possibleDuplicate) {
        setMessageDuplicateWarning(
          'A transaction with the same money in/out type, amount and date is already recorded. Check it before saving another one.',
        )
      }
    } catch {
      setMessageDuplicateWarning(
        'Money Saathi could not check existing records for a possible duplicate. Review your transactions before saving.',
      )
    }
  }

  function usePastedMessageDetails() {
    if (!messageAnalysis) {
      return
    }

    setMessageError('')

    if (
      messageAnalysis.amountChetrum !==
      null
    ) {
      setAmount(
        formatChetrumForInput(
          messageAnalysis.amountChetrum,
        ),
      )
    }

    if (
      messageAnalysis.direction !==
      'unknown'
    ) {
      if (
        messageAnalysis.direction !==
        kind
      ) {
        setCategory('')
      }

      setKind(
        messageAnalysis.direction,
      )
    }

    if (messageAnalysis.date) {
      if (
        isFutureTransactionDate(
          messageAnalysis.date,
          today,
        )
      ) {
        setMessageError(
          'The detected date is in the future, so it was not applied. Transactions must already have happened.',
        )
      } else {
        setDate(
          messageAnalysis.date,
        )
      }
    }

    setError('')
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setError('')

    if (parsedAmount === null) {
      setError(
        'Enter a valid amount greater than Nu. 0.00 with no more than two decimal places.',
      )
      return
    }

    if (!category) {
      setError('Choose a category.')
      return
    }

    if (!date) {
      setError('Choose a transaction date.')
      return
    }

    if (
      isFutureTransactionDate(
        date,
        today,
      )
    ) {
      setError(
        'Transactions are money already received or paid. Use Regular Money or planning tools for future dates.',
      )
      return
    }

    setSaving(true)

    try {
      const now = Date.now()

      const record: MoneyTransaction = {
        id: editingId ?? crypto.randomUUID(),
        kind,
        amountChetrum: parsedAmount,
        category,
        note: note.trim(),
        date,
        createdAt: createdAt ?? now,
        updatedAt: now,
        ...preserveRecurringMetadata(
          existingTransaction,
        ),
      }

      if (editingId) {
        await updateTransaction(record)
      } else {
        await addTransaction(record)
      }

      navigate('/app/transactions')
    } catch {
      setError(
        'Money Saathi could not save this transaction. Please try again.',
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="form-container">
          <p>Loading transaction...</p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="form-container">
        <Link
          to="/app/transactions"
          className="back-link"
        >
          ← Transactions
        </Link>

        <header className="form-header">
          <p className="dashboard-eyebrow">
            {editingId
              ? 'Update your record'
              : 'Record your money'}
          </p>

          <h1>
            {editingId
              ? 'Edit transaction'
              : 'Add transaction'}
          </h1>

          <p>
            Enter only what you know. Money Saathi
            keeps the process simple.
          </p>
        </header>

        <form
          className="transaction-form"
          onSubmit={(event) => {
            void handleSubmit(event)
          }}
        >
          {!editingId && (
            <details className="message-import">
              <summary>
                Paste transaction message
              </summary>

              <p>
                Paste a bank, QR, wallet or payment alert.
                Money Saathi reads it locally on this device.
                Nothing is saved until you review and save the transaction.
              </p>

              <div className="form-field">
                <label htmlFor="transaction-message">
                  Message
                </label>

                <textarea
                  id="transaction-message"
                  maxLength={2000}
                  rows={5}
                  placeholder="Example: Your account was debited by Nu. 1,250 on 25/09/2026."
                  value={pastedMessage}
                  onChange={(event) => {
                    setPastedMessage(
                      event.target.value,
                    )
                    setMessageAnalysis(
                      null,
                    )
                    setMessageError('')
                    setMessageDuplicateWarning('')
                  }}
                />
              </div>

              <div className="message-import-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => {
                    void analyzePastedMessage()
                  }}
                >
                  Read message locally
                </button>
              </div>

              {messageAnalysis && (
                <div
                  className="message-import-result"
                  role="status"
                >
                  <strong>
                    Detected details
                  </strong>

                  <span>
                    Amount:{' '}
                    {messageAnalysis.amountChetrum !== null
                      ? formatNu(
                          messageAnalysis.amountChetrum,
                        )
                      : 'Not safely identified'}
                  </span>

                  <span>
                    Direction:{' '}
                    {messageAnalysis.direction === 'income'
                      ? 'Money in'
                      : messageAnalysis.direction === 'expense'
                        ? 'Money out'
                        : 'Not clear'}
                  </span>

                  <span>
                    Date:{' '}
                    {messageAnalysis.date ??
                      'Not identified'}
                  </span>

                  <p>
                    Review every field before saving. A credit can be a transfer, not income.
                    Money Saathi does not save the pasted message itself.
                  </p>

                  <button
                    type="button"
                    className="save-button"
                    disabled={
                      messageAnalysis.amountChetrum === null &&
                      messageAnalysis.date === null &&
                      messageAnalysis.direction === 'unknown'
                    }
                    onClick={usePastedMessageDetails}
                  >
                    Use detected details
                  </button>
                </div>
              )}

              {messageDuplicateWarning && (
                <div
                  className="message-import-warning"
                  role="status"
                >
                  {messageDuplicateWarning}
                </div>
              )}

              {messageError && (
                <div
                  className="form-error"
                  role="alert"
                >
                  {messageError}
                </div>
              )}
            </details>
          )}

          <fieldset className="kind-selector">
            <legend>Transaction type</legend>

            <div className="kind-options">
              <button
                type="button"
                className={
                  kind === 'expense'
                    ? 'kind-button selected'
                    : 'kind-button'
                }
                disabled={Boolean(
                  existingTransaction?.recurringSourceId &&
                  existingTransaction.scheduledFor,
                )}
                onClick={() =>
                  handleKindChange('expense')
                }
              >
                Money out
              </button>

              <button
                type="button"
                className={
                  kind === 'income'
                    ? 'kind-button selected'
                    : 'kind-button'
                }
                disabled={Boolean(
                  existingTransaction?.recurringSourceId &&
                  existingTransaction.scheduledFor,
                )}
                onClick={() =>
                  handleKindChange('income')
                }
              >
                Money in
              </button>
            </div>

            {existingTransaction?.recurringSourceId &&
              existingTransaction.scheduledFor && (
                <p className="input-preview">
                  Linked to Regular Money for{' '}
                  {existingTransaction.scheduledFor}. Its Money
                  in/out type stays linked to that schedule.
                </p>
              )}
          </fieldset>

          <div className="form-field">
            <label htmlFor="amount">
              Amount
            </label>

            <div className="amount-input-wrap">
              <span>Nu.</span>

              <input
                id="amount"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                placeholder="0.00"
                value={amount}
                onChange={(event) =>
                  setAmount(event.target.value)
                }
                autoFocus={!editingId}
              />
            </div>

            {parsedAmount !== null && (
              <p className="input-preview">
                Recording {formatNu(parsedAmount)}
              </p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="category">
              Category
            </label>

            <select
              id="category"
              value={category}
              onChange={(event) =>
                setCategory(event.target.value)
              }
            >
              <option value="">
                Choose a category
              </option>

              {categories.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="date">
              Date
            </label>

            <input
              id="date"
              type="date"
              max={today}
              value={date}
              onChange={(event) =>
                setDate(event.target.value)
              }
            />
          </div>

          <div className="form-field">
            <label htmlFor="note">
              Note
              <span className="optional-label">
                Optional
              </span>
            </label>

            <input
              id="note"
              type="text"
              maxLength={120}
              placeholder="Example: Monthly groceries"
              value={note}
              onChange={(event) =>
                setNote(event.target.value)
              }
            />
          </div>

          {error && (
            <div
              className="form-error"
              role="alert"
            >
              {error}
            </div>
          )}

          <div className="form-actions">
            <Link
              to="/app/transactions"
              className="cancel-button"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="save-button"
              disabled={saving}
            >
              {saving
                ? 'Saving...'
                : editingId
                  ? 'Save changes'
                  : 'Save transaction'}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  )
}

export default TransactionFormPage



