import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { Link } from 'react-router-dom'

import AppShell from '../components/AppShell'
import {
  deleteLoan,
  getFixedDeposits,
  getLoans,
  getRecurringDeposits,
  getSavingsAccounts,
  upsertLoan,
} from '../storage/db'
import type { Loan } from '../types/loan'
import {
  formatRateBps,
  multiplyChetrum,
  parsePercentToBasisPoints,
} from '../utils/assets'
import {
  formatChetrumForInput,
  formatNu,
  getLocalToday,
  parseNuToChetrum,
  parseNuToChetrumAllowZero,
} from '../utils/money'
import {
  subtractChetrumExact,
  sumChetrumExact,
} from '../utils/moneyTotals'

import '../styles/loans.css'

function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [trackedAssets, setTrackedAssets] = useState(0)
  const [loading, setLoading] = useState(true)

  const [name, setName] = useState('')
  const [lender, setLender] = useState('')
  const [originalPrincipal, setOriginalPrincipal] = useState('')
  const [outstandingPrincipal, setOutstandingPrincipal] =
    useState('')
  const [annualRate, setAnnualRate] = useState('')
  const [emi, setEmi] = useState('')
  const [tenure, setTenure] = useState('')
  const [startDate, setStartDate] =
    useState(getLocalToday())
  const [note, setNote] = useState('')

  const [editingLoan, setEditingLoan] =
    useState<Loan | null>(null)
  const [deleteTarget, setDeleteTarget] =
    useState<Loan | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function loadData() {
    const [
      loanRecords,
      savingsRecords,
      fdRecords,
      rdRecords,
    ] = await Promise.all([
      getLoans(),
      getSavingsAccounts(),
      getFixedDeposits(),
      getRecurringDeposits(),
    ])

    const savingsTotal = savingsRecords.reduce(
      (sum, item) => sum + item.balanceChetrum,
      0,
    )

    const fdTotal = fdRecords.reduce(
      (sum, item) => sum + item.principalChetrum,
      0,
    )

    const rdTotal = rdRecords.reduce(
      (sum, item) =>
        sum +
        multiplyChetrum(
          item.installmentChetrum,
          item.installmentsPaid,
        ),
      0,
    )

    setLoans(loanRecords)
    setTrackedAssets(
      savingsTotal + fdTotal + rdTotal,
    )
  }

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const [
          loanRecords,
          savingsRecords,
          fdRecords,
          rdRecords,
        ] = await Promise.all([
          getLoans(),
          getSavingsAccounts(),
          getFixedDeposits(),
          getRecurringDeposits(),
        ])

        if (!active) return

        const savingsTotal = savingsRecords.reduce(
          (sum, item) => sum + item.balanceChetrum,
          0,
        )

        const fdTotal = fdRecords.reduce(
          (sum, item) => sum + item.principalChetrum,
          0,
        )

        const rdTotal = rdRecords.reduce(
          (sum, item) =>
            sum +
            multiplyChetrum(
              item.installmentChetrum,
              item.installmentsPaid,
            ),
          0,
        )

        setLoans(loanRecords)
        setTrackedAssets(
          savingsTotal + fdTotal + rdTotal,
        )
      } catch {
        if (active) {
          setError(
            'Money Saathi could not load your loans.',
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
    try {
      const original =
        sumChetrumExact(
          loans.map(
            (loan) =>
              loan.originalPrincipalChetrum,
          ),
          'Original loan principal',
        )

      const outstanding =
        sumChetrumExact(
          loans.map(
            (loan) =>
              loan.outstandingPrincipalChetrum,
          ),
          'Outstanding loan principal',
        )

      const active = loans.filter(
        (loan) => loan.outstandingPrincipalChetrum > 0,
      ).length

      return {
        original,
        outstanding,
        principalReduced:
          subtractChetrumExact(
            original,
            outstanding,
            'Principal reduced',
          ),
        active,
        netTrackedPosition:
          subtractChetrumExact(
            trackedAssets,
            outstanding,
            'Net tracked position',
          ),
      }
    } catch {
      return null
    }
  }, [loans, trackedAssets])

  function resetForm() {
    setName('')
    setLender('')
    setOriginalPrincipal('')
    setOutstandingPrincipal('')
    setAnnualRate('')
    setEmi('')
    setTenure('')
    setStartDate(getLocalToday())
    setNote('')
    setEditingLoan(null)
    setError('')
  }

  function startEdit(loan: Loan) {
    setEditingLoan(loan)
    setName(loan.name)
    setLender(loan.lender)
    setOriginalPrincipal(
      formatChetrumForInput(loan.originalPrincipalChetrum),
    )
    setOutstandingPrincipal(
      formatChetrumForInput(loan.outstandingPrincipalChetrum),
    )
    setAnnualRate(
      (loan.annualRateBps / 100).toFixed(2),
    )
    setEmi(
      loan.emiChetrum > 0
        ? formatChetrumForInput(loan.emiChetrum)
        : '',
    )
    setTenure(
      loan.tenureMonths > 0
        ? String(loan.tenureMonths)
        : '',
    )
    setStartDate(loan.startDate)
    setNote(loan.note)
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

    const original =
      parseNuToChetrum(originalPrincipal)

    const outstanding =
      parseNuToChetrumAllowZero(outstandingPrincipal)

    const rateBps =
      parsePercentToBasisPoints(annualRate)

    const emiChetrum =
      emi.trim() === ''
        ? 0
        : parseNuToChetrumAllowZero(emi)

    const tenureMonths =
      tenure.trim() === ''
        ? 0
        : Number(tenure)

    if (name.trim().length < 2) {
      setError('Give this loan a clear name.')
      return
    }

    if (original === null) {
      setError(
        'Enter an original principal greater than Nu. 0.00.',
      )
      return
    }

    if (outstanding === null) {
      setError(
        'Enter a valid outstanding principal, including zero for a repaid loan.',
      )
      return
    }

    if (outstanding > original) {
      setError(
        'Outstanding principal cannot exceed the original principal.',
      )
      return
    }

    if (rateBps === null) {
      setError(
        'Enter an annual rate from 0.00% to 100.00%.',
      )
      return
    }

    if (emiChetrum === null) {
      setError('Enter a valid EMI or leave it blank.')
      return
    }

    if (
      !Number.isInteger(tenureMonths) ||
      tenureMonths < 0 ||
      tenureMonths > 600
    ) {
      setError(
        'Tenure must be between 0 and 600 months.',
      )
      return
    }

    if (!startDate) {
      setError('Choose the loan start date.')
      return
    }

    setSaving(true)

    try {
      const now = Date.now()

      const record: Loan = {
        id: editingLoan?.id ?? crypto.randomUUID(),
        name: name.trim(),
        lender: lender.trim(),
        originalPrincipalChetrum: original,
        outstandingPrincipalChetrum: outstanding,
        annualRateBps: rateBps,
        emiChetrum,
        tenureMonths,
        startDate,
        note: note.trim(),
        createdAt: editingLoan?.createdAt ?? now,
        updatedAt: now,
      }

      await upsertLoan(record)
      await loadData()
      resetForm()
    } catch {
      setError(
        'Money Saathi could not save this loan.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return

    setDeleting(true)
    setError('')

    try {
      await deleteLoan(deleteTarget.id)
      await loadData()

      if (editingLoan?.id === deleteTarget.id) {
        resetForm()
      }

      setDeleteTarget(null)
    } catch {
      setError(
        'Money Saathi could not remove this loan.',
      )
    } finally {
      setDeleting(false)
    }
  }

  if (!summary) {
    return (
      <AppShell>
        <div className="dashboard-container">
          <div
            className="loans-error"
            role="alert"
          >
            Loan or tracked-asset totals exceed the money range
            Money Saathi can represent exactly. No rounded total
            has been shown.
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="dashboard-container">
        <header className="loans-header">
          <div>
            <Link
              to="/app/my-money"
              className="loans-back-link"
            >
              ← My Money
            </Link>

            <p className="dashboard-eyebrow">
              What you still owe
            </p>

            <h1>Loans</h1>

            <p>
              Track outstanding principal separately from
              day-to-day cash flow. EMI payments can still be
              recorded in Transactions or Regular Money.
            </p>
          </div>
        </header>

        <section className="loan-summary-grid">
          <article className="loan-summary-card">
            <span>Outstanding principal</span>
            <strong>
              {formatNu(summary.outstanding)}
            </strong>
          </article>

          <article className="loan-summary-card">
            <span>Principal reduced</span>
            <strong className="income-text">
              {formatNu(summary.principalReduced)}
            </strong>
          </article>

          <article className="loan-summary-card">
            <span>Active loans</span>
            <strong>{summary.active}</strong>
          </article>

          <article className="loan-summary-card emphasized">
            <span>Net tracked position</span>
            <strong>
              {formatNu(summary.netTrackedPosition)}
            </strong>
            <small>
              Tracked assets minus outstanding loan principal.
            </small>
          </article>
        </section>

        <div className="loan-guidance">
          Loan outstanding is updated manually because an EMI contains
          both principal and interest. Money Saathi will not subtract
          the full EMI from principal and create a false balance.
        </div>

        {error && (
          <div className="loan-error" role="alert">
            {error}
          </div>
        )}

        <div className="loan-layout">
          <section className="loan-list-card">
            <div className="loan-section-heading">
              <div>
                <p className="dashboard-eyebrow">
                  Debt snapshot
                </p>
                <h2>Your loans</h2>
              </div>

              <span>
                {loans.length}{' '}
                {loans.length === 1 ? 'loan' : 'loans'}
              </span>
            </div>

            {loading ? (
              <div className="loan-empty">Loading loans...</div>
            ) : loans.length === 0 ? (
              <div className="loan-empty">
                <div className="loan-empty-icon">−</div>
                <h3>No loans recorded</h3>
                <p>
                  Add a loan only if you want it included in
                  your tracked financial position.
                </p>
              </div>
            ) : (
              <div className="loan-list">
                {loans.map((loan) => {
                  const principalReduced =
                    loan.originalPrincipalChetrum -
                    loan.outstandingPrincipalChetrum

                  const progress =
                    loan.originalPrincipalChetrum > 0
                      ? (principalReduced /
                          loan.originalPrincipalChetrum) *
                        100
                      : 0

                  const repaid =
                    loan.outstandingPrincipalChetrum === 0

                  return (
                    <article
                      className="loan-card"
                      key={loan.id}
                    >
                      <div className="loan-card-top">
                        <div>
                          <h3>{loan.name}</h3>
                          <p>
                            {loan.lender || 'Lender not specified'}
                            {' · '}
                            {formatRateBps(loan.annualRateBps)}
                          </p>
                        </div>

                        <span
                          className={
                            repaid
                              ? 'loan-status repaid'
                              : 'loan-status'
                          }
                        >
                          {repaid ? 'Repaid' : 'Active'}
                        </span>
                      </div>

                      <div className="loan-progress-track">
                        <div
                          className="loan-progress-fill"
                          style={{
                            width: `${Math.min(
                              Math.max(progress, 0),
                              100,
                            )}%`,
                          }}
                        />
                      </div>

                      <div className="loan-money-grid">
                        <div>
                          <span>Original</span>
                          <strong>
                            {formatNu(
                              loan.originalPrincipalChetrum,
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>Outstanding</span>
                          <strong>
                            {formatNu(
                              loan.outstandingPrincipalChetrum,
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>Principal reduced</span>
                          <strong className="income-text">
                            {formatNu(principalReduced)}
                          </strong>
                        </div>

                        <div>
                          <span>EMI</span>
                          <strong>
                            {loan.emiChetrum > 0
                              ? formatNu(loan.emiChetrum)
                              : 'Not set'}
                          </strong>
                        </div>
                      </div>

                      <div className="loan-meta">
                        {loan.tenureMonths > 0 && (
                          <span>
                            {loan.tenureMonths}-month tenure
                          </span>
                        )}

                        <span>
                          Started {loan.startDate}
                        </span>
                      </div>

                      {loan.note && (
                        <p className="loan-note">
                          {loan.note}
                        </p>
                      )}

                      <div className="loan-actions">
                        <button
                          type="button"
                          onClick={() => startEdit(loan)}
                        >
                          Update balance
                        </button>

                        <button
                          type="button"
                          className="danger"
                          onClick={() =>
                            setDeleteTarget(loan)
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
          </section>

          <aside className="loan-form-card">
            <p className="dashboard-eyebrow">
              {editingLoan ? 'Update loan' : 'New loan'}
            </p>

            <h2>
              {editingLoan
                ? `Update ${editingLoan.name}`
                : 'Add a loan'}
            </h2>

            <p className="loan-form-description">
              Use the lender's current outstanding principal from
              your latest statement whenever possible.
            </p>

            <form
              onSubmit={(event) =>
                void handleSubmit(event)
              }
            >
              <div className="loan-field">
                <label htmlFor="loan-name">
                  Loan name
                </label>
                <input
                  id="loan-name"
                  type="text"
                  maxLength={60}
                  placeholder="Example: Home loan"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                />
              </div>

              <div className="loan-field">
                <label htmlFor="loan-lender">
                  Lender <span>Optional</span>
                </label>
                <input
                  id="loan-lender"
                  type="text"
                  maxLength={80}
                  placeholder="Example: Your bank"
                  value={lender}
                  onChange={(event) =>
                    setLender(event.target.value)
                  }
                />
              </div>

              <div className="loan-field">
                <label htmlFor="loan-original">
                  Original principal
                </label>
                <div className="loan-money-input">
                  <span>Nu.</span>
                  <input
                    id="loan-original"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={originalPrincipal}
                    onChange={(event) =>
                      setOriginalPrincipal(
                        event.target.value,
                      )
                    }
                  />
                </div>
              </div>

              <div className="loan-field">
                <label htmlFor="loan-outstanding">
                  Outstanding principal
                </label>
                <div className="loan-money-input">
                  <span>Nu.</span>
                  <input
                    id="loan-outstanding"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={outstandingPrincipal}
                    onChange={(event) =>
                      setOutstandingPrincipal(
                        event.target.value,
                      )
                    }
                  />
                </div>
              </div>

              <div className="loan-field">
                <label htmlFor="loan-rate">
                  Annual rate (%)
                </label>
                <input
                  id="loan-rate"
                  type="text"
                  inputMode="decimal"
                  placeholder="9.00"
                  value={annualRate}
                  onChange={(event) =>
                    setAnnualRate(event.target.value)
                  }
                />
              </div>

              <div className="loan-field">
                <label htmlFor="loan-emi">
                  EMI <span>Optional</span>
                </label>
                <div className="loan-money-input">
                  <span>Nu.</span>
                  <input
                    id="loan-emi"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={emi}
                    onChange={(event) =>
                      setEmi(event.target.value)
                    }
                  />
                </div>
              </div>

              <div className="loan-field">
                <label htmlFor="loan-tenure">
                  Original tenure (months)
                  <span>Optional</span>
                </label>
                <input
                  id="loan-tenure"
                  type="number"
                  min="0"
                  max="600"
                  step="1"
                  placeholder="72"
                  value={tenure}
                  onChange={(event) =>
                    setTenure(event.target.value)
                  }
                />
              </div>

              <div className="loan-field">
                <label htmlFor="loan-start">
                  Start date
                </label>
                <input
                  id="loan-start"
                  type="date"
                  value={startDate}
                  onChange={(event) =>
                    setStartDate(event.target.value)
                  }
                />
              </div>

              <div className="loan-field">
                <label htmlFor="loan-note">
                  Note <span>Optional</span>
                </label>
                <input
                  id="loan-note"
                  type="text"
                  maxLength={120}
                  placeholder="Example: Outstanding as per latest statement"
                  value={note}
                  onChange={(event) =>
                    setNote(event.target.value)
                  }
                />
              </div>

              <div className="loan-form-actions">
                {editingLoan && (
                  <button
                    type="button"
                    className="loan-secondary-button"
                    onClick={resetForm}
                  >
                    Cancel
                  </button>
                )}

                <button
                  type="submit"
                  className="loan-primary-button"
                  disabled={saving}
                >
                  {saving
                    ? 'Saving...'
                    : editingLoan
                      ? 'Save update'
                      : 'Add loan'}
                </button>
              </div>
            </form>
          </aside>
        </div>
      </div>

      {deleteTarget && (
        <div className="loan-dialog-backdrop">
          <section
            className="loan-dialog"
            role="dialog"
            aria-modal="true"
          >
            <div className="loan-dialog-icon">!</div>

            <h2>Delete loan record?</h2>

            <p>
              <strong>{deleteTarget.name}</strong> will be removed
              from your tracked liabilities. Existing expense
              transactions and Regular Money schedules remain
              untouched.
            </p>

            <div className="loan-dialog-actions">
              <button
                type="button"
                className="loan-secondary-button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
              >
                Keep loan
              </button>

              <button
                type="button"
                className="loan-delete-button"
                disabled={deleting}
                onClick={() => void confirmDelete()}
              >
                {deleting ? 'Deleting...' : 'Delete loan'}
              </button>
            </div>
          </section>
        </div>
      )}
    </AppShell>
  )
}

export default LoansPage


