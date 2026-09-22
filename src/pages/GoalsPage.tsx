import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react'

import AppShell from '../components/AppShell'
import {
  addGoalContribution,
  deleteGoalContribution,
  deleteGoalWithContributions,
  getGoalContributions,
  getGoals,
  upsertGoal,
} from '../storage/db'
import type { Goal, GoalContribution } from '../types/goal'
import {
  formatChetrumForInput,
  formatNu,
  getLocalToday,
  parseNuToChetrum,
} from '../utils/money'
import {
  formatGoalDate,
  getGoalDateStatus,
  getGoalProgress,
  getGoalSaved,
} from '../utils/goals'

import '../styles/goals.css'

function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [contributions, setContributions] =
    useState<GoalContribution[]>([])
  const [loading, setLoading] = useState(true)

  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [note, setNote] = useState('')
  const [editingGoal, setEditingGoal] =
    useState<Goal | null>(null)

  const [contributionGoal, setContributionGoal] =
    useState<Goal | null>(null)
  const [contributionAmount, setContributionAmount] =
    useState('')
  const [contributionDate, setContributionDate] =
    useState(getLocalToday())
  const [contributionNote, setContributionNote] =
    useState('')

  const [saving, setSaving] = useState(false)
  const [savingContribution, setSavingContribution] =
    useState(false)
  const [deleteGoalTarget, setDeleteGoalTarget] =
    useState<Goal | null>(null)
  const [deleteContributionTarget, setDeleteContributionTarget] =
    useState<GoalContribution | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function loadData() {
    const [goalRecords, contributionRecords] =
      await Promise.all([
        getGoals(),
        getGoalContributions(),
      ])

    setGoals(goalRecords)
    setContributions(contributionRecords)
  }

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const [goalRecords, contributionRecords] =
          await Promise.all([
            getGoals(),
            getGoalContributions(),
          ])

        if (!active) return

        setGoals(goalRecords)
        setContributions(contributionRecords)
      } catch {
        if (active) {
          setError(
            'Money Saathi could not load your goals.',
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

  const summary = useMemo(() => {
    let targetTotal = 0
    let savedTotal = 0
    let reached = 0

    for (const goal of goals) {
      const saved = getGoalSaved(goal.id, contributions)
      targetTotal += goal.targetChetrum
      savedTotal += saved

      if (saved >= goal.targetChetrum) {
        reached += 1
      }
    }

    return {
      targetTotal,
      savedTotal,
      remaining: Math.max(0, targetTotal - savedTotal),
      reached,
    }
  }, [goals, contributions])

  function resetGoalForm() {
    setName('')
    setTarget('')
    setTargetDate('')
    setNote('')
    setEditingGoal(null)
    setError('')
  }

  function startEdit(goal: Goal) {
    setEditingGoal(goal)
    setName(goal.name)
    setTarget(formatChetrumForInput(goal.targetChetrum))
    setTargetDate(goal.targetDate)
    setNote(goal.note)
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function saveGoal(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setError('')

    const trimmedName = name.trim()
    const parsedTarget = parseNuToChetrum(target)

    if (trimmedName.length < 2) {
      setError('Give your goal a clear name.')
      return
    }

    if (parsedTarget === null) {
      setError(
        'Enter a valid target amount greater than Nu. 0.00.',
      )
      return
    }

    setSaving(true)

    try {
      const now = Date.now()

      const goal: Goal = {
        id: editingGoal?.id ?? crypto.randomUUID(),
        name: trimmedName,
        targetChetrum: parsedTarget,
        targetDate,
        note: note.trim(),
        createdAt: editingGoal?.createdAt ?? now,
        updatedAt: now,
      }

      await upsertGoal(goal)
      await loadData()
      resetGoalForm()
    } catch {
      setError(
        'Money Saathi could not save this goal.',
      )
    } finally {
      setSaving(false)
    }
  }

  function openContribution(goal: Goal) {
    setContributionGoal(goal)
    setContributionAmount('')
    setContributionDate(getLocalToday())
    setContributionNote('')
    setError('')
  }

  async function saveContribution(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (!contributionGoal) return

    setError('')
    const parsedAmount =
      parseNuToChetrum(contributionAmount)

    if (parsedAmount === null) {
      setError(
        'Enter a valid contribution amount greater than Nu. 0.00.',
      )
      return
    }

    if (!contributionDate) {
      setError('Choose a contribution date.')
      return
    }

    setSavingContribution(true)

    try {
      const contribution: GoalContribution = {
        id: crypto.randomUUID(),
        goalId: contributionGoal.id,
        amountChetrum: parsedAmount,
        date: contributionDate,
        note: contributionNote.trim(),
        createdAt: Date.now(),
      }

      await addGoalContribution(contribution)
      await loadData()
      setContributionGoal(null)
      setContributionAmount('')
      setContributionNote('')
    } catch {
      setError(
        'Money Saathi could not save this contribution.',
      )
    } finally {
      setSavingContribution(false)
    }
  }

  async function confirmGoalDelete() {
    if (!deleteGoalTarget) return

    setDeleting(true)
    setError('')

    try {
      await deleteGoalWithContributions(deleteGoalTarget.id)
      await loadData()

      if (editingGoal?.id === deleteGoalTarget.id) {
        resetGoalForm()
      }

      setDeleteGoalTarget(null)
    } catch {
      setError(
        'Money Saathi could not delete this goal.',
      )
    } finally {
      setDeleting(false)
    }
  }

  async function confirmContributionDelete() {
    if (!deleteContributionTarget) return

    setDeleting(true)
    setError('')

    try {
      await deleteGoalContribution(
        deleteContributionTarget.id,
      )
      await loadData()
      setDeleteContributionTarget(null)
    } catch {
      setError(
        'Money Saathi could not remove this contribution.',
      )
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AppShell>
      <div className="dashboard-container">
        <header className="goals-header">
          <p className="dashboard-eyebrow">
            Give your money a purpose
          </p>
          <h1>Goals</h1>
          <p>
            Track what you are saving for without counting
            savings as everyday spending.
          </p>
        </header>

        <section className="goals-summary-grid">
          <article className="goals-summary-card">
            <span>Total target</span>
            <strong>{formatNu(summary.targetTotal)}</strong>
          </article>

          <article className="goals-summary-card">
            <span>Saved toward goals</span>
            <strong className="income-text">
              {formatNu(summary.savedTotal)}
            </strong>
          </article>

          <article className="goals-summary-card">
            <span>Still needed</span>
            <strong>{formatNu(summary.remaining)}</strong>
          </article>

          <article className="goals-summary-card">
            <span>Goals reached</span>
            <strong>{summary.reached}</strong>
          </article>
        </section>

        {error && (
          <div className="goals-error" role="alert">
            {error}
          </div>
        )}

        <div className="goals-layout">
          <section className="goals-list-card">
            <div className="goals-section-heading">
              <div>
                <p className="dashboard-eyebrow">Your plans</p>
                <h2>Financial goals</h2>
              </div>
              <span>
                {goals.length}{' '}
                {goals.length === 1 ? 'goal' : 'goals'}
              </span>
            </div>

            {loading ? (
              <div className="goals-empty">Loading goals...</div>
            ) : goals.length === 0 ? (
              <div className="goals-empty">
                <div className="goals-empty-icon">◎</div>
                <h3>No goals yet</h3>
                <p>
                  Start with an emergency fund, education,
                  travel, a home or another meaningful target.
                </p>
              </div>
            ) : (
              <div className="goal-list">
                {goals.map((goal) => {
                  const saved = getGoalSaved(
                    goal.id,
                    contributions,
                  )
                  const progress = getGoalProgress(
                    goal,
                    saved,
                  )
                  const remaining =
                    goal.targetChetrum - saved
                  const history = contributions.filter(
                    (item) => item.goalId === goal.id,
                  )

                  return (
                    <article
                      className="goal-card"
                      key={goal.id}
                    >
                      <div className="goal-top">
                        <div>
                          <h3>{goal.name}</h3>
                          <p>
                            {formatGoalDate(goal.targetDate)}
                            {' · '}
                            {getGoalDateStatus(goal, saved)}
                          </p>
                        </div>

                        <strong className="goal-percent">
                          {Math.round(progress)}%
                        </strong>
                      </div>

                      <div className="goal-progress-track">
                        <div
                          className={
                            progress >= 100
                              ? 'goal-progress-fill complete'
                              : 'goal-progress-fill'
                          }
                          style={{
                            width: `${Math.min(progress, 100)}%`,
                          }}
                        />
                      </div>

                      <div className="goal-money-row">
                        <div>
                          <span>Saved</span>
                          <strong className="income-text">
                            {formatNu(saved)}
                          </strong>
                        </div>

                        <div>
                          <span>Target</span>
                          <strong>
                            {formatNu(goal.targetChetrum)}
                          </strong>
                        </div>

                        <div>
                          <span>
                            {remaining >= 0
                              ? 'Remaining'
                              : 'Above target'}
                          </span>
                          <strong>
                            {formatNu(Math.abs(remaining))}
                          </strong>
                        </div>
                      </div>

                      {goal.note && (
                        <p className="goal-note">
                          {goal.note}
                        </p>
                      )}

                      <div className="goal-actions">
                        <button
                          type="button"
                          className="goal-contribute-button"
                          onClick={() =>
                            openContribution(goal)
                          }
                        >
                          + Add contribution
                        </button>

                        <button
                          type="button"
                          onClick={() => startEdit(goal)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="goal-delete-link"
                          onClick={() =>
                            setDeleteGoalTarget(goal)
                          }
                        >
                          Delete
                        </button>
                      </div>

                      {history.length > 0 && (
                        <div className="goal-history">
                          <div className="goal-history-heading">
                            <span>Contribution history</span>
                            <span>
                              {history.length}{' '}
                              {history.length === 1
                                ? 'entry'
                                : 'entries'}
                            </span>
                          </div>

                          {history.slice(0, 5).map((item) => (
                            <div
                              className="goal-history-row"
                              key={item.id}
                            >
                              <div>
                                <strong>
                                  {formatNu(item.amountChetrum)}
                                </strong>
                                <span>
                                  {formatGoalDate(item.date)}
                                  {item.note
                                    ? ` · ${item.note}`
                                    : ''}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteContributionTarget(
                                    item,
                                  )
                                }
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </article>
                  )
                })}
              </div>
            )}
          </section>

          <aside className="goal-form-card">
            <p className="dashboard-eyebrow">
              {editingGoal ? 'Update goal' : 'New goal'}
            </p>

            <h2>
              {editingGoal
                ? `Edit ${editingGoal.name}`
                : 'Create a goal'}
            </h2>

            <p className="goal-form-description">
              Contributions are tracked separately from income
              and everyday expenses.
            </p>

            <form onSubmit={(event) => void saveGoal(event)}>
              <div className="goal-form-field">
                <label htmlFor="goal-name">Goal name</label>
                <input
                  id="goal-name"
                  type="text"
                  maxLength={60}
                  placeholder="Example: Emergency fund"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                />
              </div>

              <div className="goal-form-field">
                <label htmlFor="goal-target">
                  Target amount
                </label>

                <div className="goal-amount-input">
                  <span>Nu.</span>
                  <input
                    id="goal-target"
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="0.00"
                    value={target}
                    onChange={(event) =>
                      setTarget(event.target.value)
                    }
                  />
                </div>
              </div>

              <div className="goal-form-field">
                <label htmlFor="goal-date">
                  Target date <span>Optional</span>
                </label>

                <input
                  id="goal-date"
                  type="date"
                  value={targetDate}
                  onChange={(event) =>
                    setTargetDate(event.target.value)
                  }
                />
              </div>

              <div className="goal-form-field">
                <label htmlFor="goal-note">
                  Note <span>Optional</span>
                </label>

                <input
                  id="goal-note"
                  type="text"
                  maxLength={120}
                  placeholder="Why this goal matters"
                  value={note}
                  onChange={(event) =>
                    setNote(event.target.value)
                  }
                />
              </div>

              <div className="goal-form-actions">
                {editingGoal && (
                  <button
                    type="button"
                    className="goal-cancel-button"
                    onClick={resetGoalForm}
                  >
                    Cancel
                  </button>
                )}

                <button
                  type="submit"
                  className="goal-save-button"
                  disabled={saving}
                >
                  {saving
                    ? 'Saving...'
                    : editingGoal
                      ? 'Save changes'
                      : 'Create goal'}
                </button>
              </div>
            </form>
          </aside>
        </div>
      </div>

      {contributionGoal && (
        <div className="goal-dialog-backdrop">
          <section
            className="goal-dialog"
            role="dialog"
            aria-modal="true"
          >
            <p className="dashboard-eyebrow">Add progress</p>
            <h2>{contributionGoal.name}</h2>

            <form
              className="contribution-form"
              onSubmit={(event) =>
                void saveContribution(event)
              }
            >
              <div className="goal-form-field">
                <label htmlFor="contribution-amount">
                  Contribution
                </label>

                <div className="goal-amount-input">
                  <span>Nu.</span>
                  <input
                    id="contribution-amount"
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="0.00"
                    value={contributionAmount}
                    onChange={(event) =>
                      setContributionAmount(
                        event.target.value,
                      )
                    }
                    autoFocus
                  />
                </div>
              </div>

              <div className="goal-form-field">
                <label htmlFor="contribution-date">
                  Date
                </label>

                <input
                  id="contribution-date"
                  type="date"
                  value={contributionDate}
                  onChange={(event) =>
                    setContributionDate(
                      event.target.value,
                    )
                  }
                />
              </div>

              <div className="goal-form-field">
                <label htmlFor="contribution-note">
                  Note <span>Optional</span>
                </label>

                <input
                  id="contribution-note"
                  type="text"
                  maxLength={120}
                  placeholder="Example: September saving"
                  value={contributionNote}
                  onChange={(event) =>
                    setContributionNote(
                      event.target.value,
                    )
                  }
                />
              </div>

              <div className="goal-dialog-actions">
                <button
                  type="button"
                  className="goal-dialog-cancel"
                  disabled={savingContribution}
                  onClick={() =>
                    setContributionGoal(null)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="goal-dialog-save"
                  disabled={savingContribution}
                >
                  {savingContribution
                    ? 'Saving...'
                    : 'Add contribution'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {deleteGoalTarget && (
        <div className="goal-dialog-backdrop">
          <section
            className="goal-dialog"
            role="dialog"
            aria-modal="true"
          >
            <div className="goal-dialog-icon">!</div>
            <h2>Delete goal?</h2>

            <p>
              <strong>{deleteGoalTarget.name}</strong> and its
              contribution history will be permanently removed.
            </p>

            <div className="goal-dialog-actions">
              <button
                type="button"
                className="goal-dialog-cancel"
                disabled={deleting}
                onClick={() =>
                  setDeleteGoalTarget(null)
                }
              >
                Keep goal
              </button>

              <button
                type="button"
                className="goal-dialog-delete"
                disabled={deleting}
                onClick={() =>
                  void confirmGoalDelete()
                }
              >
                {deleting
                  ? 'Deleting...'
                  : 'Delete goal'}
              </button>
            </div>
          </section>
        </div>
      )}

      {deleteContributionTarget && (
        <div className="goal-dialog-backdrop">
          <section
            className="goal-dialog"
            role="dialog"
            aria-modal="true"
          >
            <div className="goal-dialog-icon">!</div>
            <h2>Remove contribution?</h2>

            <p>
              Remove{' '}
              <strong>
                {formatNu(
                  deleteContributionTarget.amountChetrum,
                )}
              </strong>{' '}
              from this goal's progress?
            </p>

            <div className="goal-dialog-actions">
              <button
                type="button"
                className="goal-dialog-cancel"
                disabled={deleting}
                onClick={() =>
                  setDeleteContributionTarget(null)
                }
              >
                Keep contribution
              </button>

              <button
                type="button"
                className="goal-dialog-delete"
                disabled={deleting}
                onClick={() =>
                  void confirmContributionDelete()
                }
              >
                {deleting ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </section>
        </div>
      )}
    </AppShell>
  )
}

export default GoalsPage


