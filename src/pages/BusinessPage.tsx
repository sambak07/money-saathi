import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  Link,
} from 'react-router-dom'

import AppShell from '../components/AppShell'
import {
  addBusinessTransaction,
  deleteBusinessProfileWithTransactions,
  deleteBusinessTransaction,
  getBusinessProfiles,
  getBusinessTransactions,
  updateBusinessTransaction,
  upsertBusinessProfile,
} from '../storage/db'
import type {
  BusinessProfile,
  BusinessTransaction,
  BusinessTransactionKind,
} from '../types/business'
import {
  formatChetrumForInput,
  formatNu,
  getLocalToday,
} from '../utils/money'
import {
  parseNuInputToChetrum,
} from '../utils/safeToSpend'
import {
  summarizeBusinessTransactions,
} from '../utils/business'

import '../styles/business.css'

const BUSINESS_CATEGORIES = [
  'Sales',
  'Service income',
  'Purchase / stock',
  'Transport',
  'Rent',
  'Utilities',
  'Salary / wages',
  'Other',
]

function BusinessPage() {
  const [businesses, setBusinesses] =
    useState<BusinessProfile[]>([])

  const [selectedBusinessId, setSelectedBusinessId] =
    useState('')

  const [transactions, setTransactions] =
    useState<BusinessTransaction[]>([])

  const [businessName, setBusinessName] =
    useState('')

  const [renameBusinessName, setRenameBusinessName] =
    useState('')

  const [editingTransaction, setEditingTransaction] =
    useState<BusinessTransaction | null>(null)

  const [kind, setKind] =
    useState<BusinessTransactionKind>('income')

  const [amount, setAmount] = useState('')
  const [category, setCategory] =
    useState('Sales')
  const [note, setNote] = useState('')
  const [date, setDate] =
    useState(() => getLocalToday())

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function loadBusinesses(
    preferredId?: string,
  ) {
    const records =
      await getBusinessProfiles()

    setBusinesses(records)

    const nextId =
      preferredId &&
      records.some(
        (item) => item.id === preferredId,
      )
        ? preferredId
        : selectedBusinessId &&
            records.some(
              (item) =>
                item.id === selectedBusinessId,
            )
          ? selectedBusinessId
          : records[0]?.id ?? ''

    setSelectedBusinessId(nextId)

    setRenameBusinessName(
      records.find(
        (item) =>
          item.id === nextId,
      )?.name ?? '',
    )

    setEditingTransaction(null)
  }

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const records =
          await getBusinessProfiles()

        if (!active) return

        setBusinesses(records)

        const firstBusiness =
          records[0] ?? null

        setSelectedBusinessId(
          firstBusiness?.id ?? '',
        )

        setRenameBusinessName(
          firstBusiness?.name ?? '',
        )
      } catch {
        if (active) {
          setError(
            'Money Saathi could not load business workspaces.',
          )
        }
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true

    if (!selectedBusinessId) {
      return () => {
        active = false
      }
    }

    async function load() {
      try {
        const records =
          await getBusinessTransactions(
            selectedBusinessId,
          )

        if (active) {
          setTransactions(records)
        }
      } catch {
        if (active) {
          setError(
            'Money Saathi could not load business transactions.',
          )
        }
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [selectedBusinessId])

  const selectedBusiness =
    businesses.find(
      (item) =>
        item.id === selectedBusinessId,
    ) ?? null


  const summary = useMemo(
    () =>
      summarizeBusinessTransactions(
        transactions,
      ),
    [transactions],
  )

  async function createBusiness(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setMessage('')
    setError('')

    const name = businessName.trim()

    if (!name) {
      setError('Enter a business name.')
      return
    }

    const now = Date.now()

    const record: BusinessProfile = {
      id: crypto.randomUUID(),
      name,
      createdAt: now,
      updatedAt: now,
    }

    try {
      await upsertBusinessProfile(record)
      setBusinessName('')
      await loadBusinesses(record.id)
      setMessage(
        'Business workspace created. Its money is separate from your personal ledger.',
      )
    } catch {
      setError(
        'Money Saathi could not create the business workspace.',
      )
    }
  }

  async function renameBusiness(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setMessage('')
    setError('')

    if (!selectedBusiness) {
      return
    }

    const name =
      renameBusinessName.trim()

    if (name.length < 2) {
      setError(
        'Give this business a clear name.',
      )
      return
    }

    try {
      await upsertBusinessProfile({
        ...selectedBusiness,
        name,
        updatedAt:
          Date.now(),
      })

      await loadBusinesses(
        selectedBusiness.id,
      )

      setMessage(
        'Business name updated.',
      )
    } catch {
      setError(
        'Money Saathi could not rename this business.',
      )
    }
  }

  function resetTransactionForm() {
    setEditingTransaction(null)
    setKind('income')
    setAmount('')
    setCategory('Sales')
    setNote('')
    setDate(
      getLocalToday(),
    )
  }

  function editTransaction(
    transaction: BusinessTransaction,
  ) {
    setEditingTransaction(
      transaction,
    )
    setKind(
      transaction.kind,
    )
    setAmount(
      formatChetrumForInput(
        transaction.amountChetrum,
      ),
    )
    setCategory(
      transaction.category,
    )
    setNote(
      transaction.note,
    )
    setDate(
      transaction.date,
    )
    setMessage('')
    setError('')
  }

  async function addTransaction(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setMessage('')
    setError('')

    if (!selectedBusiness) {
      setError(
        'Create or choose a business first.',
      )
      return
    }

    const amountChetrum =
      parseNuInputToChetrum(amount)

    if (
      amountChetrum === null ||
      amountChetrum <= 0
    ) {
      setError(
        'Enter a valid amount greater than zero.',
      )
      return
    }

    const now = Date.now()

    const record: BusinessTransaction = {
      id:
        editingTransaction?.id ??
        crypto.randomUUID(),
      businessId:
        selectedBusiness.id,
      kind,
      amountChetrum,
      category,
      note: note.trim(),
      date,
      createdAt:
        editingTransaction?.createdAt ??
        now,
      updatedAt: now,
    }

    try {
      const wasEditing =
        editingTransaction !== null

      if (wasEditing) {
        await updateBusinessTransaction(
          record,
        )
      } else {
        await addBusinessTransaction(
          record,
        )
      }

      resetTransactionForm()

      setTransactions(
        await getBusinessTransactions(
          selectedBusiness.id,
        ),
      )

      setMessage(
        wasEditing
          ? 'Business transaction updated.'
          : 'Business transaction recorded.',
      )
    } catch {
      setError(
        'Money Saathi could not save the business transaction.',
      )
    }
  }

  async function removeTransaction(
    id: string,
  ) {
    if (
      !window.confirm(
        'Delete this business transaction?',
      )
    ) {
      return
    }

    setMessage('')
    setError('')

    try {
      await deleteBusinessTransaction(id)

      if (selectedBusinessId) {
        setTransactions(
          await getBusinessTransactions(
            selectedBusinessId,
          ),
        )
      }
    } catch {
      setError(
        'Money Saathi could not delete the business transaction.',
      )
    }
  }

  async function removeBusiness() {
    if (!selectedBusiness) return

    if (
      !window.confirm(
        `Delete "${selectedBusiness.name}" and all of its business transactions? This cannot be undone.`,
      )
    ) {
      return
    }

    setMessage('')
    setError('')

    try {
      await deleteBusinessProfileWithTransactions(
        selectedBusiness.id,
      )

      setTransactions([])
      await loadBusinesses()
      setMessage(
        'Business workspace deleted.',
      )
    } catch {
      setError(
        'Money Saathi could not delete the business workspace.',
      )
    }
  }

  return (
    <AppShell>
      <div className="dashboard-container business-page">
        <header className="business-header">
          <div>
            <p className="dashboard-eyebrow">
              Separate workspace
            </p>

            <h1>Business</h1>

            <p>
              Track business cash separately from personal money.
              Business transactions here never enter your personal
              Home balance or Safe to Spend.
            </p>
          </div>

          <Link to="/app">
            Personal Home
          </Link>
        </header>

        {message && (
          <div
            className="business-message"
            role="status"
          >
            {message}
          </div>
        )}

        {error && (
          <div
            className="business-error"
            role="alert"
          >
            {error}
          </div>
        )}

        <section className="business-separation-note">
          <strong>Personal and business remain separate.</strong>
          <span>
            This workspace is for cash-flow tracking. It is not
            presented as audited accounting, tax filing or a bank
            balance.
          </span>
        </section>

        <section className="business-workspace-row">
          <form
            className="business-create-form"
            onSubmit={createBusiness}
          >
            <label htmlFor="business-name">
              Add a business
            </label>

            <div>
              <input
                id="business-name"
                type="text"
                maxLength={120}
                placeholder="e.g. Karma General Shop"
                value={businessName}
                onChange={(event) =>
                  setBusinessName(
                    event.target.value,
                  )
                }
              />

              <button type="submit">
                Create workspace
              </button>
            </div>
          </form>

          {businesses.length > 0 && (
            <div className="business-selector">
              <label htmlFor="business-select">
                Current business
              </label>

              <select
                id="business-select"
                value={selectedBusinessId}
                onChange={(event) => {
                  const nextId =
                    event.target.value

                  setSelectedBusinessId(
                    nextId,
                  )

                  setRenameBusinessName(
                    businesses.find(
                      (business) =>
                        business.id === nextId,
                    )?.name ?? '',
                  )

                  setEditingTransaction(
                    null,
                  )
                }}
              >
                {businesses.map(
                  (business) => (
                    <option
                      key={business.id}
                      value={business.id}
                    >
                      {business.name}
                    </option>
                  ),
                )}
              </select>

              <form
                className="business-rename-form"
                onSubmit={renameBusiness}
              >
                <label htmlFor="business-rename">
                  Rename current business
                </label>

                <div>
                  <input
                    id="business-rename"
                    type="text"
                    maxLength={120}
                    value={renameBusinessName}
                    onChange={(event) =>
                      setRenameBusinessName(
                        event.target.value,
                      )
                    }
                  />

                  <button type="submit">
                    Rename
                  </button>
                </div>
              </form>
            </div>
          )}
        </section>

        {!selectedBusiness ? (
          <section className="business-empty">
            <strong>
              Start with one business workspace.
            </strong>

            <p>
              Your business sales and expenses will stay outside
              the personal transaction ledger.
            </p>
          </section>
        ) : (
          <>
            <section className="business-summary-grid">
              <article>
                <span>Business money in</span>
                <strong className="income-text">
                  {formatNu(
                    summary.moneyInChetrum,
                  )}
                </strong>
              </article>

              <article>
                <span>Business money out</span>
                <strong>
                  {formatNu(
                    summary.moneyOutChetrum,
                  )}
                </strong>
              </article>

              <article>
                <span>Recorded business net cash</span>
                <strong
                  className={
                    summary.netCashChetrum >= 0
                      ? 'income-text'
                      : ''
                  }
                >
                  {formatNu(
                    summary.netCashChetrum,
                  )}
                </strong>
                <small>
                  Income minus expenses recorded in this workspace.
                </small>
              </article>
            </section>

            <section className="business-two-column">
              <article className="business-panel">
                <p className="dashboard-eyebrow">
                  Record business money
                </p>

                <h2>
                  {editingTransaction
                    ? 'Edit transaction'
                    : 'Add transaction'}
                </h2>

                {editingTransaction && (
                  <button
                    type="button"
                    className="business-cancel-edit"
                    onClick={resetTransactionForm}
                  >
                    Cancel edit
                  </button>
                )}

                <form
                  className="business-transaction-form"
                  onSubmit={addTransaction}
                >
                  <div className="business-kind-toggle">
                    <button
                      type="button"
                      aria-pressed={
                        kind === 'income'
                      }
                      className={
                        kind === 'income'
                          ? 'selected'
                          : ''
                      }
                      onClick={() => {
                        setKind('income')
                        setCategory('Sales')
                      }}
                    >
                      Money in
                    </button>

                    <button
                      type="button"
                      aria-pressed={
                        kind === 'expense'
                      }
                      className={
                        kind === 'expense'
                          ? 'selected'
                          : ''
                      }
                      onClick={() => {
                        setKind('expense')
                        setCategory(
                          'Purchase / stock',
                        )
                      }}
                    >
                      Money out
                    </button>
                  </div>

                  <label>
                    Amount (Nu.)
                    <input
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={amount}
                      onChange={(event) =>
                        setAmount(
                          event.target.value,
                        )
                      }
                    />
                  </label>

                  <label>
                    Category
                    <select
                      value={category}
                      onChange={(event) =>
                        setCategory(
                          event.target.value,
                        )
                      }
                    >
                      {BUSINESS_CATEGORIES.map(
                        (item) => (
                          <option
                            key={item}
                            value={item}
                          >
                            {item}
                          </option>
                        ),
                      )}
                    </select>
                  </label>

                  <label>
                    Date
                    <input
                      type="date"
                      value={date}
                      onChange={(event) =>
                        setDate(
                          event.target.value,
                        )
                      }
                    />
                  </label>

                  <label>
                    Note
                    <input
                      type="text"
                      maxLength={500}
                      value={note}
                      onChange={(event) =>
                        setNote(
                          event.target.value,
                        )
                      }
                    />
                  </label>

                  <button type="submit">
                    {editingTransaction
                      ? 'Update business transaction'
                      : 'Save business transaction'}
                  </button>
                </form>
              </article>

              <article className="business-panel">
                <div className="business-panel-heading">
                  <div>
                    <p className="dashboard-eyebrow">
                      Activity
                    </p>

                    <h2>
                      {selectedBusiness.name}
                    </h2>
                  </div>

                  <button
                    type="button"
                    className="business-danger-link"
                    onClick={() =>
                      void removeBusiness()
                    }
                  >
                    Delete business
                  </button>
                </div>

                {transactions.length === 0 ? (
                  <div className="business-empty compact">
                    No business transactions yet.
                  </div>
                ) : (
                  <div className="business-transaction-list">
                    {transactions.map(
                      (transaction) => (
                        <div
                          key={transaction.id}
                          className="business-transaction-row"
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

                          <div className="business-transaction-amount">
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

                            <button
                              type="button"
                              aria-label={`Edit ${transaction.category} transaction`}
                              onClick={() =>
                                editTransaction(
                                  transaction,
                                )
                              }
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              aria-label={`Delete ${transaction.category} transaction`}
                              onClick={() =>
                                void removeTransaction(
                                  transaction.id,
                                )
                              }
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </article>
            </section>
          </>
        )}
      </div>
    </AppShell>
  )
}

export default BusinessPage

