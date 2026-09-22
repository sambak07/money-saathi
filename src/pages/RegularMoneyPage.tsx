import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react'

import AppShell from '../components/AppShell'
import {
  addTransaction,
  deleteRegularMoney,
  getRegularMoney,
  getTransactions,
  upsertRegularMoney,
} from '../storage/db'
import type {
  RegularFrequency,
  RegularMoney,
} from '../types/regularMoney'
import type {
  MoneyTransaction,
  TransactionKind,
} from '../types/transaction'
import {
  formatNu,
  getLocalToday,
  parseNuToChetrum,
} from '../utils/money'
import {
  formatScheduleDate,
  generateOccurrencesBetween,
  getFrequencyLabel,
  getMonthBounds,
  getNextOccurrence,
} from '../utils/recurrence'

import '../styles/regular-money.css'

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

function currentMonth(): string {
  return getLocalToday().slice(0, 7)
}

function RegularMoneyPage() {
  const [items, setItems] = useState<RegularMoney[]>([])
  const [transactions, setTransactions] =
    useState<MoneyTransaction[]>([])
  const [loading, setLoading] = useState(true)

  const [name, setName] = useState('')
  const [kind, setKind] =
    useState<TransactionKind>('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [frequency, setFrequency] =
    useState<RegularFrequency>('monthly')
  const [startDate, setStartDate] =
    useState(getLocalToday())
  const [endDate, setEndDate] = useState('')
  const [note, setNote] = useState('')
  const [editingItem, setEditingItem] =
    useState<RegularMoney | null>(null)

  const [saving, setSaving] = useState(false)
  const [recordingId, setRecordingId] =
    useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] =
    useState<RegularMoney | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function loadData() {
    const [regularRecords, transactionRecords] =
      await Promise.all([
        getRegularMoney(),
        getTransactions(),
      ])

    setItems(regularRecords)
    setTransactions(transactionRecords)
  }

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const [regularRecords, transactionRecords] =
          await Promise.all([
            getRegularMoney(),
            getTransactions(),
          ])

        if (!active) return

        setItems(regularRecords)
        setTransactions(transactionRecords)
      } catch {
        if (active) {
          setError(
            'Money Saathi could not load Regular Money.',
          )
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [])

  const categories =
    kind === 'income'
      ? incomeCategories
      : expenseCategories

  const recordedScheduleKeys = useMemo(() => {
    const keys = new Set<string>()

    for (const transaction of transactions) {
      if (
        transaction.recurringSourceId &&
        transaction.scheduledFor
      ) {
        keys.add(
          `${transaction.recurringSourceId}|${transaction.scheduledFor}`,
        )
      }
    }

    return keys
  }, [transactions])

  const itemStatus = useMemo(() => {
    const today = getLocalToday()
    const map = new Map<
      string,
      { outstanding: string[]; next: string | null }
    >()

    for (const item of items) {
      const occurrences = generateOccurrencesBetween(
        item,
        item.startDate,
        today,
      )

      const outstanding = occurrences.filter(
        (date) =>
          !recordedScheduleKeys.has(
            `${item.id}|${date}`,
          ),
      )

      map.set(item.id, {
        outstanding,
        next: getNextOccurrence(item, today),
      })
    }

    return map
  }, [items, recordedScheduleKeys])

  const summary = useMemo(() => {
    const bounds = getMonthBounds(currentMonth())

    let expectedIncome = 0
    let expectedExpense = 0
    let dueCount = 0

    for (const item of items) {
      const occurrences = generateOccurrencesBetween(
        item,
        bounds.start,
        bounds.end,
      )

      const total =
        occurrences.length * item.amountChetrum

      if (item.kind === 'income') {
        expectedIncome += total
      } else {
        expectedExpense += total
      }

      dueCount += itemStatus.get(item.id)?.outstanding.length ?? 0
    }

    return {
      expectedIncome,
      expectedExpense,
      dueCount,
    }
  }, [items, itemStatus])

  function resetForm() {
    setName('')
    setKind('expense')
    setAmount('')
    setCategory('')
    setFrequency('monthly')
    setStartDate(getLocalToday())
    setEndDate('')
    setNote('')
    setEditingItem(null)
    setError('')
  }

  function handleKindChange(nextKind: TransactionKind) {
    setKind(nextKind)
    setCategory('')
    setError('')
  }

  function startEdit(item: RegularMoney) {
    setEditingItem(item)
    setName(item.name)
    setKind(item.kind)
    setAmount((item.amountChetrum / 100).toFixed(2))
    setCategory(item.category)
    setFrequency(item.frequency)
    setStartDate(item.startDate)
    setEndDate(item.endDate)
    setNote(item.note)
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setError('')

    const trimmedName = name.trim()
    const parsedAmount = parseNuToChetrum(amount)

    if (trimmedName.length < 2) {
      setError('Give this regular payment a clear name.')
      return
    }

    if (parsedAmount === null) {
      setError(
        'Enter a valid amount greater than Nu. 0.00.',
      )
      return
    }

    if (!category) {
      setError('Choose a category.')
      return
    }

    if (!startDate) {
      setError('Choose a start date.')
      return
    }

    if (endDate && endDate < startDate) {
      setError(
        'End date cannot be before the start date.',
      )
      return
    }

    setSaving(true)

    try {
      const now = Date.now()

      const record: RegularMoney = {
        id: editingItem?.id ?? crypto.randomUUID(),
        name: trimmedName,
        kind,
        amountChetrum: parsedAmount,
        category,
        frequency,
        startDate,
        endDate,
        note: note.trim(),
        createdAt: editingItem?.createdAt ?? now,
        updatedAt: now,
      }

      await upsertRegularMoney(record)
      await loadData()
      resetForm()
    } catch {
      setError(
        'Money Saathi could not save this schedule.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function recordOccurrence(
    item: RegularMoney,
    scheduledFor: string,
    recordedAt: number,
  ) {
    const key = `${item.id}|${scheduledFor}`

    if (recordedScheduleKeys.has(key)) {
      setError(
        'That scheduled occurrence has already been recorded.',
      )
      return
    }

    setRecordingId(item.id)
    setError('')

    try {
      const transaction: MoneyTransaction = {
        id: crypto.randomUUID(),
        kind: item.kind,
        amountChetrum: item.amountChetrum,
        category: item.category,
        note: item.note || item.name,
        date: scheduledFor,
        createdAt: recordedAt,
        updatedAt: recordedAt,
        recurringSourceId: item.id,
        scheduledFor,
      }

      await addTransaction(transaction)
      await loadData()
    } catch {
      setError(
        'Money Saathi could not record this scheduled payment.',
      )
    } finally {
      setRecordingId(null)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return

    setDeleting(true)
    setError('')

    try {
      await deleteRegularMoney(deleteTarget.id)
      await loadData()

      if (editingItem?.id === deleteTarget.id) {
        resetForm()
      }

      setDeleteTarget(null)
    } catch {
      setError(
        'Money Saathi could not remove this schedule.',
      )
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AppShell>
      <div className="dashboard-container">
        <header className="regular-header">
          <p className="dashboard-eyebrow">Money that repeats</p>
          <h1>Regular money</h1>
          <p>
            Keep track of salary, rent, EMIs, subscriptions and other
            recurring money. A schedule changes your balance only when
            you record an actual occurrence.
          </p>
        </header>

        <section className="regular-summary-grid">
          <article className="regular-summary-card">
            <span>Expected in this month</span>
            <strong className="income-text">
              {formatNu(summary.expectedIncome)}
            </strong>
          </article>

          <article className="regular-summary-card">
            <span>Expected out this month</span>
            <strong>
              {formatNu(summary.expectedExpense)}
            </strong>
          </article>

          <article className="regular-summary-card">
            <span>Due to record</span>
            <strong>{summary.dueCount}</strong>
          </article>

          <article className="regular-summary-card">
            <span>Active schedules</span>
            <strong>{items.length}</strong>
          </article>
        </section>

        {error && (
          <div className="regular-error" role="alert">
            {error}
          </div>
        )}

        <div className="regular-layout">
          <section className="regular-list-card">
            <div className="regular-section-heading">
              <div>
                <p className="dashboard-eyebrow">
                  Your recurring money
                </p>
                <h2>Schedules</h2>
              </div>
              <span>
                {items.length}{' '}
                {items.length === 1 ? 'schedule' : 'schedules'}
              </span>
            </div>

            {loading ? (
              <div className="regular-empty">
                Loading your regular money...
              </div>
            ) : items.length === 0 ? (
              <div className="regular-empty">
                <div className="regular-empty-icon">↻</div>
                <h3>No regular money yet</h3>
                <p>
                  Add salary, rent, an EMI, subscription or another
                  repeating amount.
                </p>
              </div>
            ) : (
              <div className="regular-list">
                {items.map((item) => {
                  const status = itemStatus.get(item.id)
                  const outstanding = status?.outstanding ?? []
                  const dueDate = outstanding[0]

                  return (
                    <article className="regular-row" key={item.id}>
                      <div className="regular-row-main">
                        <div
                          className={
                            item.kind === 'income'
                              ? 'regular-kind income'
                              : 'regular-kind expense'
                          }
                        >
                          {item.kind === 'income' ? '+' : '−'}
                        </div>

                        <div>
                          <h3>{item.name}</h3>
                          <p>
                            {item.category} ·{' '}
                            {getFrequencyLabel(item.frequency)}
                          </p>
                        </div>
                      </div>

                      <div className="regular-row-amount">
                        <strong
                          className={
                            item.kind === 'income'
                              ? 'income-text'
                              : ''
                          }
                        >
                          {item.kind === 'income' ? '+' : '−'}
                          {formatNu(item.amountChetrum)}
                        </strong>

                        {outstanding.length > 0 ? (
                          <span className="regular-due">
                            {outstanding.length}{' '}
                            {outstanding.length === 1
                              ? 'occurrence'
                              : 'occurrences'}{' '}
                            due
                          </span>
                        ) : status?.next ? (
                          <span>
                            Next {formatScheduleDate(status.next)}
                          </span>
                        ) : (
                          <span>Schedule ended</span>
                        )}
                      </div>

                      <div className="regular-row-footer">
                        <div className="regular-actions">
                          <button
                            type="button"
                            onClick={() => startEdit(item)}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="regular-delete-link"
                            onClick={() => setDeleteTarget(item)}
                          >
                            Delete
                          </button>
                        </div>

                        {dueDate && (
                          <button
                            type="button"
                            className="record-due-button"
                            disabled={recordingId === item.id}
                            onClick={() =>
                              void recordOccurrence(
                                item,
                                dueDate,
                                Date.now(),
                              )
                            }
                          >
                            {recordingId === item.id
                              ? 'Recording...'
                              : `Record ${formatScheduleDate(dueDate)}`}
                          </button>
                        )}
                      </div>

                      {outstanding.length > 1 && (
                        <p className="regular-overdue-note">
                          Record the oldest outstanding occurrence
                          first. The next one will appear automatically.
                        </p>
                      )}
                    </article>
                  )
                })}
              </div>
            )}
          </section>

          <aside className="regular-form-card">
            <p className="dashboard-eyebrow">
              {editingItem ? 'Update schedule' : 'New schedule'}
            </p>

            <h2>
              {editingItem
                ? `Edit ${editingItem.name}`
                : 'Add regular money'}
            </h2>

            <p className="regular-form-description">
              Create the schedule here, then record each real occurrence
              when it happens.
            </p>

            <form onSubmit={(event) => void handleSubmit(event)}>
              <div className="regular-kind-selector">
                <button
                  type="button"
                  className={
                    kind === 'expense'
                      ? 'regular-kind-button selected'
                      : 'regular-kind-button'
                  }
                  onClick={() => handleKindChange('expense')}
                >
                  Money out
                </button>

                <button
                  type="button"
                  className={
                    kind === 'income'
                      ? 'regular-kind-button selected'
                      : 'regular-kind-button'
                  }
                  onClick={() => handleKindChange('income')}
                >
                  Money in
                </button>
              </div>

              <div className="regular-form-field">
                <label htmlFor="regular-name">Name</label>
                <input
                  id="regular-name"
                  type="text"
                  maxLength={60}
                  placeholder="Example: Monthly salary"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>

              <div className="regular-form-field">
                <label htmlFor="regular-amount">Amount</label>
                <div className="regular-amount-input">
                  <span>Nu.</span>
                  <input
                    id="regular-amount"
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="0.00"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                  />
                </div>
              </div>

              <div className="regular-form-field">
                <label htmlFor="regular-category">Category</label>
                <select
                  id="regular-category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  <option value="">Choose category</option>
                  {categories.map((item) => (
                    <option value={item} key={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="regular-form-field">
                <label htmlFor="regular-frequency">Frequency</label>
                <select
                  id="regular-frequency"
                  value={frequency}
                  onChange={(event) =>
                    setFrequency(
                      event.target.value as RegularFrequency,
                    )
                  }
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div className="regular-date-grid">
                <div className="regular-form-field">
                  <label htmlFor="regular-start">Start date</label>
                  <input
                    id="regular-start"
                    type="date"
                    value={startDate}
                    onChange={(event) =>
                      setStartDate(event.target.value)
                    }
                  />
                </div>

                <div className="regular-form-field">
                  <label htmlFor="regular-end">
                    End date <span>Optional</span>
                  </label>
                  <input
                    id="regular-end"
                    type="date"
                    min={startDate || undefined}
                    value={endDate}
                    onChange={(event) =>
                      setEndDate(event.target.value)
                    }
                  />
                </div>
              </div>

              <div className="regular-form-field">
                <label htmlFor="regular-note">
                  Note <span>Optional</span>
                </label>
                <input
                  id="regular-note"
                  type="text"
                  maxLength={120}
                  placeholder="Example: Salary credit"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
              </div>

              <div className="regular-form-actions">
                {editingItem && (
                  <button
                    type="button"
                    className="regular-cancel-button"
                    onClick={resetForm}
                  >
                    Cancel
                  </button>
                )}

                <button
                  type="submit"
                  className="regular-save-button"
                  disabled={saving}
                >
                  {saving
                    ? 'Saving...'
                    : editingItem
                      ? 'Save changes'
                      : 'Add schedule'}
                </button>
              </div>
            </form>
          </aside>
        </div>
      </div>

      {deleteTarget && (
        <div className="regular-dialog-backdrop">
          <section
            className="regular-dialog"
            role="dialog"
            aria-modal="true"
          >
            <div className="regular-dialog-icon">!</div>
            <h2>Delete schedule?</h2>
            <p>
              This removes <strong>{deleteTarget.name}</strong> from
              Regular Money.
            </p>
            <p>
              Transactions already recorded from this schedule remain
              untouched.
            </p>

            <div className="regular-dialog-actions">
              <button
                type="button"
                className="regular-dialog-cancel"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
              >
                Keep schedule
              </button>

              <button
                type="button"
                className="regular-dialog-delete"
                disabled={deleting}
                onClick={() => void confirmDelete()}
              >
                {deleting ? 'Deleting...' : 'Delete schedule'}
              </button>
            </div>
          </section>
        </div>
      )}
    </AppShell>
  )
}

export default RegularMoneyPage

