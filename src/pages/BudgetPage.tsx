import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  useAccessibleDialog,
} from '../accessibility/useAccessibleDialog'
import AppShell from '../components/AppShell'
import {
  deleteBudget,
  getBudgets,
  getTransactions,
  upsertBudget,
} from '../storage/db'
import type { Budget } from '../types/budget'
import type { MoneyTransaction } from '../types/transaction'
import {
  formatChetrumForInput,
  formatNu,
  getLocalToday,
  parseNuToChetrum,
} from '../utils/money'

import '../styles/budget.css'

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

function getCurrentMonth(): string {
  return getLocalToday().slice(0, 7)
}

function formatMonth(month: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    month: 'long',
    year: 'numeric',
  }).format(
    new Date(`${month}-01T00:00:00`),
  )
}

function BudgetPage() {
  const [month, setMonth] =
    useState(getCurrentMonth())

  const [budgets, setBudgets] =
    useState<Budget[]>([])

  const [transactions, setTransactions] =
    useState<MoneyTransaction[]>([])

  const [loading, setLoading] = useState(true)

  const [category, setCategory] = useState('')
  const [amount, setAmount] = useState('')

  const [editingBudget, setEditingBudget] =
    useState<Budget | null>(null)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [deleteTarget, setDeleteTarget] =
    useState<Budget | null>(null)

  const [deleting, setDeleting] = useState(false)

  const budgetDeleteDialogRef =
    useAccessibleDialog(
      deleteTarget !== null,
      () => {
        if (!deleting) {
          setDeleteTarget(null)
        }
      },
    )

  async function loadData(
    selectedMonth: string,
  ) {
    const [budgetRecords, transactionRecords] =
      await Promise.all([
        getBudgets(selectedMonth),
        getTransactions(),
      ])

    setBudgets(budgetRecords)
    setTransactions(transactionRecords)
  }

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)

      try {
        const [budgetRecords, transactionRecords] =
          await Promise.all([
            getBudgets(month),
            getTransactions(),
          ])

        if (!active) {
          return
        }

        setBudgets(budgetRecords)
        setTransactions(transactionRecords)
      } catch {
        if (active) {
          setError(
            'Money Saathi could not load your budget.',
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
  }, [month])

  const monthExpenses = useMemo(
    () =>
      transactions.filter(
        (record) =>
          record.kind === 'expense' &&
          record.date.slice(0, 7) === month,
      ),
    [transactions, month],
  )

  const spentByCategory = useMemo(() => {
    const map = new Map<string, number>()

    for (const record of monthExpenses) {
      map.set(
        record.category,
        (map.get(record.category) ?? 0) +
          record.amountChetrum,
      )
    }

    return map
  }, [monthExpenses])

  const totals = useMemo(() => {
    let planned = 0
    let spentAgainstPlan = 0

    const budgetedCategories = new Set<string>()

    for (const budget of budgets) {
      planned += budget.limitChetrum
      budgetedCategories.add(budget.category)

      spentAgainstPlan +=
        spentByCategory.get(budget.category) ?? 0
    }

    let unbudgeted = 0

    for (const record of monthExpenses) {
      if (
        !budgetedCategories.has(record.category)
      ) {
        unbudgeted += record.amountChetrum
      }
    }

    return {
      planned,
      spentAgainstPlan,
      remaining: planned - spentAgainstPlan,
      unbudgeted,
    }
  }, [
    budgets,
    monthExpenses,
    spentByCategory,
  ])

  const unbudgetedGroups = useMemo(() => {
    const budgetedCategories = new Set(
      budgets.map((budget) => budget.category),
    )

    return Array.from(
      spentByCategory.entries(),
    )
      .filter(
        ([categoryName]) =>
          !budgetedCategories.has(categoryName),
      )
      .sort((a, b) => b[1] - a[1])
  }, [budgets, spentByCategory])

  function resetForm() {
    setCategory('')
    setAmount('')
    setEditingBudget(null)
    setError('')
  }

  function startEdit(budget: Budget) {
    setEditingBudget(budget)
    setCategory(budget.category)

    setAmount(
      formatChetrumForInput(budget.limitChetrum),
    )

    setError('')

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setError('')

    const parsedAmount =
      parseNuToChetrum(amount)

    if (!category) {
      setError('Choose a budget category.')
      return
    }

    if (parsedAmount === null) {
      setError(
        'Enter a valid budget amount greater than Nu. 0.00.',
      )
      return
    }

    const duplicate = budgets.find(
      (budget) =>
        budget.category === category &&
        budget.id !== editingBudget?.id,
    )

    if (duplicate) {
      setError(
        `${category} already has a budget for ${formatMonth(
          month,
        )}. Edit the existing budget instead.`,
      )

      return
    }

    setSaving(true)

    try {
      const now = Date.now()

      const budget: Budget = {
        id:
          editingBudget?.id ??
          `${month}:${category}`,
        month,
        category,
        limitChetrum: parsedAmount,
        createdAt:
          editingBudget?.createdAt ?? now,
        updatedAt: now,
      }

      await upsertBudget(budget)
      await loadData(month)

      resetForm()
    } catch {
      setError(
        'Money Saathi could not save this budget. Please try again.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) {
      return
    }

    setDeleting(true)
    setError('')

    try {
      await deleteBudget(deleteTarget.id)
      await loadData(month)

      if (
        editingBudget?.id === deleteTarget.id
      ) {
        resetForm()
      }

      setDeleteTarget(null)
    } catch {
      setError(
        'Money Saathi could not delete this budget.',
      )
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AppShell>
      <div className="dashboard-container">
        <header className="budget-header">
          <div>
            <p className="dashboard-eyebrow">
              Plan before you spend
            </p>

            <h1>Budget</h1>

            <p>
              Give important spending categories a
              monthly limit and Money Saathi will track
              progress automatically.
            </p>
          </div>

          <div className="month-control">
            <label htmlFor="budget-month">
              Budget month
            </label>

            <input
              id="budget-month"
              type="month"
              value={month}
              onChange={(event) => {
                setMonth(event.target.value)
                resetForm()
              }}
            />
          </div>
        </header>

        <section
          className="budget-summary-grid"
          aria-label="Budget summary"
        >
          <article className="budget-summary-card">
            <span>Planned</span>

            <strong>
              {formatNu(totals.planned)}
            </strong>
          </article>

          <article className="budget-summary-card">
            <span>Spent against plan</span>

            <strong>
              {formatNu(
                totals.spentAgainstPlan,
              )}
            </strong>
          </article>

          <article className="budget-summary-card">
            <span>
              {totals.remaining >= 0
                ? 'Remaining'
                : 'Over budget'}
            </span>

            <strong
              className={
                totals.remaining < 0
                  ? 'budget-negative'
                  : 'budget-positive'
              }
            >
              {formatNu(
                Math.abs(totals.remaining),
              )}
            </strong>
          </article>

          <article className="budget-summary-card">
            <span>Unbudgeted spending</span>

            <strong>
              {formatNu(totals.unbudgeted)}
            </strong>
          </article>
        </section>

        <div className="budget-layout">
          <section className="budget-list-section">
            <div className="budget-section-heading">
              <div>
                <p className="dashboard-eyebrow">
                  {formatMonth(month)}
                </p>

                <h2>Your spending plan</h2>
              </div>

              <span>
                {budgets.length}{' '}
                {budgets.length === 1
                  ? 'category'
                  : 'categories'}
              </span>
            </div>

            {loading ? (
              <div className="budget-empty">
                Loading your budget...
              </div>
            ) : budgets.length === 0 ? (
              <div className="budget-empty">
                <div className="budget-empty-icon">
                  +
                </div>

                <h3>No budget yet</h3>

                <p>
                  Start with one category you want to
                  control this month.
                </p>
              </div>
            ) : (
              <div className="budget-list">
                {budgets.map((budget) => {
                  const spent =
                    spentByCategory.get(
                      budget.category,
                    ) ?? 0

                  const remaining =
                    budget.limitChetrum - spent

                  const rawPercent =
                    budget.limitChetrum > 0
                      ? (spent /
                          budget.limitChetrum) *
                        100
                      : 0

                  const barPercent = Math.min(
                    rawPercent,
                    100,
                  )

                  const overspent =
                    remaining < 0

                  return (
                    <article
                      className="budget-row"
                      key={budget.id}
                    >
                      <div className="budget-row-top">
                        <div>
                          <h3>
                            {budget.category}
                          </h3>

                          <p>
                            {formatNu(spent)} spent of{' '}
                            {formatNu(
                              budget.limitChetrum,
                            )}
                          </p>
                        </div>

                        <div className="budget-row-amount">
                          <strong
                            className={
                              overspent
                                ? 'budget-negative'
                                : 'budget-positive'
                            }
                          >
                            {overspent
                              ? 'Over by '
                              : 'Left '}
                            {formatNu(
                              Math.abs(remaining),
                            )}
                          </strong>

                          <span>
                            {Math.round(rawPercent)}%
                            used
                          </span>
                        </div>
                      </div>

                      <div
                        className="budget-progress-track"
                        aria-label={`${Math.round(
                          rawPercent,
                        )}% of ${budget.category} budget used`}
                      >
                        <div
                          className={
                            overspent
                              ? 'budget-progress-fill overspent'
                              : 'budget-progress-fill'
                          }
                          style={{
                            width: `${barPercent}%`,
                          }}
                        />
                      </div>

                      <div className="budget-row-actions">
                        <button
                          type="button"
                          onClick={() =>
                            startEdit(budget)
                          }
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="budget-delete-link"
                          onClick={() =>
                            setDeleteTarget(
                              budget,
                            )
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}

            {unbudgetedGroups.length > 0 && (
              <section className="unbudgeted-section">
                <div className="unbudgeted-heading">
                  <div>
                    <h3>
                      Spending without a budget
                    </h3>

                    <p>
                      These expenses are real, but they
                      are not included in your spending
                      plan yet.
                    </p>
                  </div>
                </div>

                <div className="unbudgeted-list">
                  {unbudgetedGroups.map(
                    ([categoryName, spent]) => (
                      <div
                        className="unbudgeted-row"
                        key={categoryName}
                      >
                        <span>
                          {categoryName}
                        </span>

                        <strong>
                          {formatNu(spent)}
                        </strong>
                      </div>
                    ),
                  )}
                </div>
              </section>
            )}
          </section>

          <aside className="budget-form-card">
            <p className="dashboard-eyebrow">
              {editingBudget
                ? 'Update plan'
                : 'Add to your plan'}
            </p>

            <h2>
              {editingBudget
                ? `Edit ${editingBudget.category}`
                : 'Set a budget'}
            </h2>

            <p className="budget-form-description">
              Choose how much you want to allow for one
              spending category during{' '}
              {formatMonth(month)}.
            </p>

            <form
              onSubmit={(event) => {
                void handleSubmit(event)
              }}
            >
              <div className="budget-form-field">
                <label htmlFor="budget-category">
                  Category
                </label>

                <select
                  id="budget-category"
                  value={category}
                  disabled={Boolean(
                    editingBudget,
                  )}
                  onChange={(event) =>
                    setCategory(
                      event.target.value,
                    )
                  }
                >
                  <option value="">
                    Choose category
                  </option>

                  {expenseCategories.map(
                    (item) => (
                      <option
                        value={item}
                        key={item}
                      >
                        {item}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div className="budget-form-field">
                <label htmlFor="budget-amount">
                  Monthly limit
                </label>

                <div className="budget-amount-input">
                  <span>Nu.</span>

                  <input
                    id="budget-amount"
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="0.00"
                    value={amount}
                    onChange={(event) =>
                      setAmount(
                        event.target.value,
                      )
                    }
                  />
                </div>
              </div>

              {error && (
                <div
                  className="budget-form-error"
                  role="alert"
                >
                  {error}
                </div>
              )}

              <div className="budget-form-actions">
                {editingBudget && (
                  <button
                    type="button"
                    className="budget-cancel-button"
                    onClick={resetForm}
                  >
                    Cancel
                  </button>
                )}

                <button
                  type="submit"
                  className="budget-save-button"
                  disabled={saving}
                >
                  {saving
                    ? 'Saving...'
                    : editingBudget
                      ? 'Save changes'
                      : 'Add budget'}
                </button>
              </div>
            </form>
          </aside>
        </div>
      </div>

      {deleteTarget && (
        <div className="budget-dialog-backdrop">
          <section
            ref={budgetDeleteDialogRef}
            className="budget-dialog"
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            aria-labelledby="budget-delete-title"
          >
            <div className="budget-dialog-icon">
              !
            </div>

            <h2 id="budget-delete-title">
              Remove this budget?
            </h2>

            <p>
              This removes the{' '}
              <strong>
                {deleteTarget.category}
              </strong>{' '}
              limit for{' '}
              <strong>
                {formatMonth(
                  deleteTarget.month,
                )}
              </strong>
              .
            </p>

            <p>
              Your transactions will not be deleted.
            </p>

            <div className="budget-dialog-actions">
              <button
                type="button"
                className="budget-dialog-cancel"
                disabled={deleting}
                onClick={() =>
                  setDeleteTarget(null)
                }
              >
                Keep budget
              </button>

              <button
                type="button"
                className="budget-dialog-delete"
                disabled={deleting}
                onClick={() => {
                  void confirmDelete()
                }}
              >
                {deleting
                  ? 'Removing...'
                  : 'Remove budget'}
              </button>
            </div>
          </section>
        </div>
      )}
    </AppShell>
  )
}

export default BudgetPage

