import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { Link } from 'react-router-dom'

import AppShell from '../components/AppShell'
import {
  deleteFixedDeposit,
  deleteRecurringDeposit,
  deleteSavingsAccount,
  getFixedDeposits,
  getRecurringDeposits,
  getSavingsAccounts,
  upsertFixedDeposit,
  upsertRecurringDeposit,
  upsertSavingsAccount,
} from '../storage/db'
import type {
  FixedDeposit,
  RecurringDeposit,
  SavingsAccount,
} from '../types/asset'
import {
  calculateMaturityDate,
  estimateSimpleFdInterestChetrum,
  formatAssetDate,
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

import '../styles/my-money.css'

type FormMode =
  | 'savings'
  | 'fd'
  | 'rd'
  | null

type DeleteTarget =
  | {
      kind: 'savings'
      id: string
      name: string
    }
  | {
      kind: 'fd'
      id: string
      name: string
    }
  | {
      kind: 'rd'
      id: string
      name: string
    }

function MyMoneyPage() {
  const [savings, setSavings] = useState<SavingsAccount[]>([])
  const [fds, setFds] = useState<FixedDeposit[]>([])
  const [rds, setRds] = useState<RecurringDeposit[]>([])
  const [loading, setLoading] = useState(true)
  const [formMode, setFormMode] = useState<FormMode>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] =
    useState<DeleteTarget | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [savingsName, setSavingsName] = useState('')
  const [savingsBalance, setSavingsBalance] = useState('')
  const [savingsNote, setSavingsNote] = useState('')

  const [fdName, setFdName] = useState('')
  const [fdPrincipal, setFdPrincipal] = useState('')
  const [fdRate, setFdRate] = useState('')
  const [fdTenure, setFdTenure] = useState('')
  const [fdStartDate, setFdStartDate] =
    useState(getLocalToday())
  const [fdNote, setFdNote] = useState('')

  const [rdName, setRdName] = useState('')
  const [rdInstallment, setRdInstallment] = useState('')
  const [rdRate, setRdRate] = useState('')
  const [rdTenure, setRdTenure] = useState('')
  const [rdPaid, setRdPaid] = useState('0')
  const [rdStartDate, setRdStartDate] =
    useState(getLocalToday())
  const [rdNote, setRdNote] = useState('')

  async function loadData() {
    const [savingsRecords, fdRecords, rdRecords] =
      await Promise.all([
        getSavingsAccounts(),
        getFixedDeposits(),
        getRecurringDeposits(),
      ])

    setSavings(savingsRecords)
    setFds(fdRecords)
    setRds(rdRecords)
  }

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const [savingsRecords, fdRecords, rdRecords] =
          await Promise.all([
            getSavingsAccounts(),
            getFixedDeposits(),
            getRecurringDeposits(),
          ])

        if (!active) return

        setSavings(savingsRecords)
        setFds(fdRecords)
        setRds(rdRecords)
      } catch {
        if (active) {
          setError('Money Saathi could not load My Money.')
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
    const savingsTotal = savings.reduce(
      (sum, item) => sum + item.balanceChetrum,
      0,
    )

    const fdTotal = fds.reduce(
      (sum, item) => sum + item.principalChetrum,
      0,
    )

    const rdTotal = rds.reduce(
      (sum, item) =>
        sum +
        multiplyChetrum(
          item.installmentChetrum,
          item.installmentsPaid,
        ),
      0,
    )

    return {
      savingsTotal,
      fdTotal,
      rdTotal,
      total: savingsTotal + fdTotal + rdTotal,
    }
  }, [savings, fds, rds])

  function closeForm() {
    setFormMode(null)
    setEditingId(null)
    setError('')

    setSavingsName('')
    setSavingsBalance('')
    setSavingsNote('')

    setFdName('')
    setFdPrincipal('')
    setFdRate('')
    setFdTenure('')
    setFdStartDate(getLocalToday())
    setFdNote('')

    setRdName('')
    setRdInstallment('')
    setRdRate('')
    setRdTenure('')
    setRdPaid('0')
    setRdStartDate(getLocalToday())
    setRdNote('')
  }

  function openSavingsForm(record?: SavingsAccount) {
    closeForm()
    setFormMode('savings')

    if (record) {
      setEditingId(record.id)
      setSavingsName(record.name)
      setSavingsBalance(
        formatChetrumForInput(record.balanceChetrum),
      )
      setSavingsNote(record.note)
    }
  }

  function openFdForm(record?: FixedDeposit) {
    closeForm()
    setFormMode('fd')

    if (record) {
      setEditingId(record.id)
      setFdName(record.name)
      setFdPrincipal(
        formatChetrumForInput(record.principalChetrum),
      )
      setFdRate(
        (record.annualRateBps / 100).toFixed(2),
      )
      setFdTenure(String(record.tenureMonths))
      setFdStartDate(record.startDate)
      setFdNote(record.note)
    }
  }

  function openRdForm(record?: RecurringDeposit) {
    closeForm()
    setFormMode('rd')

    if (record) {
      setEditingId(record.id)
      setRdName(record.name)
      setRdInstallment(
        formatChetrumForInput(record.installmentChetrum),
      )
      setRdRate(
        (record.annualRateBps / 100).toFixed(2),
      )
      setRdTenure(String(record.tenureMonths))
      setRdPaid(String(record.installmentsPaid))
      setRdStartDate(record.startDate)
      setRdNote(record.note)
    }
  }

  async function saveSavings(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setError('')

    const parsedBalance =
      parseNuToChetrumAllowZero(
        savingsBalance,
      )

    if (savingsName.trim().length < 2) {
      setError('Give this savings account a clear name.')
      return
    }

    if (parsedBalance === null) {
      setError(
        'Enter a valid savings balance, including Nu. 0.00 for an empty account.',
      )
      return
    }

    setSaving(true)

    try {
      const existing = savings.find(
        (item) => item.id === editingId,
      )
      const now = Date.now()

      const record: SavingsAccount = {
        id: existing?.id ?? crypto.randomUUID(),
        name: savingsName.trim(),
        balanceChetrum: parsedBalance,
        note: savingsNote.trim(),
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      }

      await upsertSavingsAccount(record)
      await loadData()
      closeForm()
    } catch {
      setError(
        'Money Saathi could not save this savings account.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function saveFd(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setError('')

    const principal = parseNuToChetrum(fdPrincipal)
    const rateBps = parsePercentToBasisPoints(fdRate)
    const tenureMonths = Number(fdTenure)

    if (fdName.trim().length < 2) {
      setError('Give this fixed deposit a clear name.')
      return
    }

    if (principal === null) {
      setError(
        'Enter a valid FD principal greater than Nu. 0.00.',
      )
      return
    }

    if (rateBps === null) {
      setError(
        'Enter an annual rate from 0.00% to 100.00%.',
      )
      return
    }

    if (
      !Number.isInteger(tenureMonths) ||
      tenureMonths < 1 ||
      tenureMonths > 600
    ) {
      setError(
        'Enter an FD tenure between 1 and 600 months.',
      )
      return
    }

    if (!fdStartDate) {
      setError('Choose the FD start date.')
      return
    }

    setSaving(true)

    try {
      const existing = fds.find(
        (item) => item.id === editingId,
      )
      const now = Date.now()

      const record: FixedDeposit = {
        id: existing?.id ?? crypto.randomUUID(),
        name: fdName.trim(),
        principalChetrum: principal,
        annualRateBps: rateBps,
        tenureMonths,
        startDate: fdStartDate,
        note: fdNote.trim(),
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      }

      await upsertFixedDeposit(record)
      await loadData()
      closeForm()
    } catch {
      setError(
        'Money Saathi could not save this fixed deposit.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function saveRd(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setError('')

    const installment = parseNuToChetrum(rdInstallment)
    const rateBps = parsePercentToBasisPoints(rdRate)
    const tenureMonths = Number(rdTenure)
    const installmentsPaid = Number(rdPaid)

    if (rdName.trim().length < 2) {
      setError('Give this recurring deposit a clear name.')
      return
    }

    if (installment === null) {
      setError(
        'Enter a valid installment greater than Nu. 0.00.',
      )
      return
    }

    if (rateBps === null) {
      setError(
        'Enter an annual rate from 0.00% to 100.00%.',
      )
      return
    }

    if (
      !Number.isInteger(tenureMonths) ||
      tenureMonths < 1 ||
      tenureMonths > 600
    ) {
      setError(
        'Enter an RD tenure between 1 and 600 months.',
      )
      return
    }

    if (
      !Number.isInteger(installmentsPaid) ||
      installmentsPaid < 0 ||
      installmentsPaid > tenureMonths
    ) {
      setError(
        'Installments paid must be between 0 and the RD tenure.',
      )
      return
    }

    if (!rdStartDate) {
      setError('Choose the RD start date.')
      return
    }

    setSaving(true)

    try {
      const existing = rds.find(
        (item) => item.id === editingId,
      )
      const now = Date.now()

      const record: RecurringDeposit = {
        id: existing?.id ?? crypto.randomUUID(),
        name: rdName.trim(),
        installmentChetrum: installment,
        annualRateBps: rateBps,
        tenureMonths,
        installmentsPaid,
        startDate: rdStartDate,
        note: rdNote.trim(),
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      }

      await upsertRecurringDeposit(record)
      await loadData()
      closeForm()
    } catch {
      setError(
        'Money Saathi could not save this recurring deposit.',
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
      if (deleteTarget.kind === 'savings') {
        await deleteSavingsAccount(deleteTarget.id)
      } else if (deleteTarget.kind === 'fd') {
        await deleteFixedDeposit(deleteTarget.id)
      } else {
        await deleteRecurringDeposit(deleteTarget.id)
      }

      await loadData()
      setDeleteTarget(null)

      if (editingId === deleteTarget.id) {
        closeForm()
      }
    } catch {
      setError(
        'Money Saathi could not remove this asset.',
      )
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AppShell>
      <div className="dashboard-container">
        <header className="my-money-header">
          <p className="dashboard-eyebrow">
            Your financial position
          </p>
          <h1>My Money</h1>
          <p>
            See the money you have set aside across savings,
            fixed deposits and recurring deposits without mixing
            those assets into everyday spending.
          </p>

          <div className="my-money-header-actions">
            <Link
              to="/app/my-money/loans"
              className="asset-add-button"
            >
              View loans & financial position
            </Link>

            <Link
              to="/app/my-money/schemes"
              className="asset-close-button"
            >
              Schemes & commitments
            </Link>
          </div>
        </header>

        <section className="asset-summary-grid">
          <article className="asset-summary-card primary">
            <span>Total tracked assets</span>
            <strong>{formatNu(summary.total)}</strong>
            <small>
              Principal and balances only — no unearned interest.
            </small>
          </article>

          <article className="asset-summary-card">
            <span>Savings</span>
            <strong>{formatNu(summary.savingsTotal)}</strong>
          </article>

          <article className="asset-summary-card">
            <span>Fixed deposits</span>
            <strong>{formatNu(summary.fdTotal)}</strong>
          </article>

          <article className="asset-summary-card">
            <span>RD contributions</span>
            <strong>{formatNu(summary.rdTotal)}</strong>
          </article>
        </section>

        <div className="asset-info-note">
          Goal progress is not added here, because a goal may be funded
          from one of these accounts. Keeping it separate prevents
          double-counting your money.
        </div>

        {error && (
          <div className="asset-error" role="alert">
            {error}
          </div>
        )}

        {formMode && (
          <section className="asset-form-panel">
            <div className="asset-form-heading">
              <div>
                <p className="dashboard-eyebrow">
                  {editingId ? 'Update record' : 'Add asset'}
                </p>
                <h2>
                  {formMode === 'savings'
                    ? 'Savings account'
                    : formMode === 'fd'
                      ? 'Fixed deposit'
                      : 'Recurring deposit'}
                </h2>
              </div>

              <button
                type="button"
                className="asset-close-button"
                onClick={closeForm}
              >
                Close
              </button>
            </div>

            {formMode === 'savings' && (
              <form
                className="asset-form"
                onSubmit={(event) => void saveSavings(event)}
              >
                <div className="asset-field">
                  <label htmlFor="savings-name">Name</label>
                  <input
                    id="savings-name"
                    type="text"
                    maxLength={60}
                    placeholder="Example: Emergency savings"
                    value={savingsName}
                    onChange={(event) =>
                      setSavingsName(event.target.value)
                    }
                  />
                </div>

                <div className="asset-field">
                  <label htmlFor="savings-balance">
                    Current balance
                  </label>
                  <div className="asset-money-input">
                    <span>Nu.</span>
                    <input
                      id="savings-balance"
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={savingsBalance}
                      onChange={(event) =>
                        setSavingsBalance(event.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="asset-field full">
                  <label htmlFor="savings-note">
                    Note <span>Optional</span>
                  </label>
                  <input
                    id="savings-note"
                    type="text"
                    maxLength={120}
                    placeholder="Example: Main bank savings account"
                    value={savingsNote}
                    onChange={(event) =>
                      setSavingsNote(event.target.value)
                    }
                  />
                </div>

                <div className="asset-form-actions full">
                  <button
                    type="button"
                    className="asset-secondary-button"
                    onClick={closeForm}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="asset-primary-button"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save savings'}
                  </button>
                </div>
              </form>
            )}

            {formMode === 'fd' && (
              <form
                className="asset-form"
                onSubmit={(event) => void saveFd(event)}
              >
                <div className="asset-field">
                  <label htmlFor="fd-name">Name</label>
                  <input
                    id="fd-name"
                    type="text"
                    maxLength={60}
                    placeholder="Example: 12-month FD"
                    value={fdName}
                    onChange={(event) =>
                      setFdName(event.target.value)
                    }
                  />
                </div>

                <div className="asset-field">
                  <label htmlFor="fd-principal">Principal</label>
                  <div className="asset-money-input">
                    <span>Nu.</span>
                    <input
                      id="fd-principal"
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={fdPrincipal}
                      onChange={(event) =>
                        setFdPrincipal(event.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="asset-field">
                  <label htmlFor="fd-rate">
                    Annual rate (%)
                  </label>
                  <input
                    id="fd-rate"
                    type="text"
                    inputMode="decimal"
                    placeholder="7.50"
                    value={fdRate}
                    onChange={(event) =>
                      setFdRate(event.target.value)
                    }
                  />
                </div>

                <div className="asset-field">
                  <label htmlFor="fd-tenure">
                    Tenure (months)
                  </label>
                  <input
                    id="fd-tenure"
                    type="number"
                    min="1"
                    max="600"
                    step="1"
                    placeholder="12"
                    value={fdTenure}
                    onChange={(event) =>
                      setFdTenure(event.target.value)
                    }
                  />
                </div>

                <div className="asset-field">
                  <label htmlFor="fd-start">Start date</label>
                  <input
                    id="fd-start"
                    type="date"
                    value={fdStartDate}
                    onChange={(event) =>
                      setFdStartDate(event.target.value)
                    }
                  />
                </div>

                <div className="asset-field">
                  <label htmlFor="fd-note">
                    Note <span>Optional</span>
                  </label>
                  <input
                    id="fd-note"
                    type="text"
                    maxLength={120}
                    placeholder="Example: Bank FD reference"
                    value={fdNote}
                    onChange={(event) =>
                      setFdNote(event.target.value)
                    }
                  />
                </div>

                <p className="asset-form-disclaimer full">
                  Money Saathi will show a simple-interest estimate.
                  Actual bank maturity may differ because of compounding,
                  tax, premature closure rules or product-specific terms.
                </p>

                <div className="asset-form-actions full">
                  <button
                    type="button"
                    className="asset-secondary-button"
                    onClick={closeForm}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="asset-primary-button"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save FD'}
                  </button>
                </div>
              </form>
            )}

            {formMode === 'rd' && (
              <form
                className="asset-form"
                onSubmit={(event) => void saveRd(event)}
              >
                <div className="asset-field">
                  <label htmlFor="rd-name">Name</label>
                  <input
                    id="rd-name"
                    type="text"
                    maxLength={60}
                    placeholder="Example: Education RD"
                    value={rdName}
                    onChange={(event) =>
                      setRdName(event.target.value)
                    }
                  />
                </div>

                <div className="asset-field">
                  <label htmlFor="rd-installment">
                    Monthly installment
                  </label>
                  <div className="asset-money-input">
                    <span>Nu.</span>
                    <input
                      id="rd-installment"
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={rdInstallment}
                      onChange={(event) =>
                        setRdInstallment(event.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="asset-field">
                  <label htmlFor="rd-rate">
                    Annual rate (%)
                  </label>
                  <input
                    id="rd-rate"
                    type="text"
                    inputMode="decimal"
                    placeholder="7.00"
                    value={rdRate}
                    onChange={(event) =>
                      setRdRate(event.target.value)
                    }
                  />
                </div>

                <div className="asset-field">
                  <label htmlFor="rd-tenure">
                    Tenure (months)
                  </label>
                  <input
                    id="rd-tenure"
                    type="number"
                    min="1"
                    max="600"
                    step="1"
                    placeholder="24"
                    value={rdTenure}
                    onChange={(event) =>
                      setRdTenure(event.target.value)
                    }
                  />
                </div>

                <div className="asset-field">
                  <label htmlFor="rd-paid">
                    Installments paid
                  </label>
                  <input
                    id="rd-paid"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={rdPaid}
                    onChange={(event) =>
                      setRdPaid(event.target.value)
                    }
                  />
                </div>

                <div className="asset-field">
                  <label htmlFor="rd-start">Start date</label>
                  <input
                    id="rd-start"
                    type="date"
                    value={rdStartDate}
                    onChange={(event) =>
                      setRdStartDate(event.target.value)
                    }
                  />
                </div>

                <div className="asset-field full">
                  <label htmlFor="rd-note">
                    Note <span>Optional</span>
                  </label>
                  <input
                    id="rd-note"
                    type="text"
                    maxLength={120}
                    placeholder="Example: Monthly RD"
                    value={rdNote}
                    onChange={(event) =>
                      setRdNote(event.target.value)
                    }
                  />
                </div>

                <p className="asset-form-disclaimer full">
                  The tracked RD asset equals installments actually paid.
                  The interest rate is recorded for reference; Money
                  Saathi does not assume a bank-specific RD compounding
                  formula.
                </p>

                <div className="asset-form-actions full">
                  <button
                    type="button"
                    className="asset-secondary-button"
                    onClick={closeForm}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="asset-primary-button"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save RD'}
                  </button>
                </div>
              </form>
            )}
          </section>
        )}

        <section className="asset-section">
          <div className="asset-section-heading">
            <div>
              <p className="dashboard-eyebrow">Available money</p>
              <h2>Savings</h2>
            </div>

            <button
              type="button"
              className="asset-add-button"
              onClick={() => openSavingsForm()}
            >
              + Add savings
            </button>
          </div>

          {loading ? (
            <div className="asset-empty">Loading...</div>
          ) : savings.length === 0 ? (
            <div className="asset-empty">
              No savings accounts recorded yet.
            </div>
          ) : (
            <div className="asset-list">
              {savings.map((item) => (
                <article className="asset-row" key={item.id}>
                  <div>
                    <h3>{item.name}</h3>
                    <p>{item.note || 'Savings balance'}</p>
                  </div>

                  <div className="asset-row-value">
                    <strong>{formatNu(item.balanceChetrum)}</strong>
                    <div className="asset-row-actions">
                      <button
                        type="button"
                        onClick={() => openSavingsForm(item)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="danger"
                        onClick={() =>
                          setDeleteTarget({
                            kind: 'savings',
                            id: item.id,
                            name: item.name,
                          })
                        }
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="asset-section">
          <div className="asset-section-heading">
            <div>
              <p className="dashboard-eyebrow">
                Money locked for a term
              </p>
              <h2>Fixed deposits</h2>
            </div>

            <button
              type="button"
              className="asset-add-button"
              onClick={() => openFdForm()}
            >
              + Add FD
            </button>
          </div>

          {fds.length === 0 ? (
            <div className="asset-empty">
              No fixed deposits recorded yet.
            </div>
          ) : (
            <div className="asset-card-grid">
              {fds.map((item) => {
                const interest =
                  estimateSimpleFdInterestChetrum(
                    item.principalChetrum,
                    item.annualRateBps,
                    item.tenureMonths,
                  )

                const maturityDate =
                  calculateMaturityDate(
                    item.startDate,
                    item.tenureMonths,
                  )

                return (
                  <article className="deposit-card" key={item.id}>
                    <div className="deposit-card-top">
                      <div>
                        <h3>{item.name}</h3>
                        <p>
                          {formatRateBps(item.annualRateBps)}
                          {' · '}
                          {item.tenureMonths} months
                        </p>
                      </div>

                      <strong>
                        {formatNu(item.principalChetrum)}
                      </strong>
                    </div>

                    <div className="deposit-details">
                      <div>
                        <span>Maturity date</span>
                        <strong>
                          {formatAssetDate(maturityDate)}
                        </strong>
                      </div>
                      <div>
                        <span>Simple-interest estimate</span>
                        <strong>{formatNu(interest)}</strong>
                      </div>
                      <div>
                        <span>Estimated maturity value</span>
                        <strong>
                          {formatNu(
                            item.principalChetrum + interest,
                          )}
                        </strong>
                      </div>
                    </div>

                    <p className="deposit-disclaimer">
                      Estimate only; actual bank terms may differ.
                    </p>

                    <div className="asset-row-actions">
                      <button
                        type="button"
                        onClick={() => openFdForm(item)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="danger"
                        onClick={() =>
                          setDeleteTarget({
                            kind: 'fd',
                            id: item.id,
                            name: item.name,
                          })
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

        <section className="asset-section">
          <div className="asset-section-heading">
            <div>
              <p className="dashboard-eyebrow">
                Build savings gradually
              </p>
              <h2>Recurring deposits</h2>
            </div>

            <button
              type="button"
              className="asset-add-button"
              onClick={() => openRdForm()}
            >
              + Add RD
            </button>
          </div>

          {rds.length === 0 ? (
            <div className="asset-empty">
              No recurring deposits recorded yet.
            </div>
          ) : (
            <div className="asset-card-grid">
              {rds.map((item) => {
                const paidPrincipal = multiplyChetrum(
                  item.installmentChetrum,
                  item.installmentsPaid,
                )

                const plannedPrincipal = multiplyChetrum(
                  item.installmentChetrum,
                  item.tenureMonths,
                )

                const progress =
                  item.tenureMonths > 0
                    ? (item.installmentsPaid /
                        item.tenureMonths) *
                      100
                    : 0

                const maturityDate =
                  calculateMaturityDate(
                    item.startDate,
                    item.tenureMonths,
                  )

                return (
                  <article className="deposit-card" key={item.id}>
                    <div className="deposit-card-top">
                      <div>
                        <h3>{item.name}</h3>
                        <p>
                          {formatRateBps(item.annualRateBps)}
                          {' · '}
                          {item.tenureMonths} months
                        </p>
                      </div>

                      <strong>{formatNu(paidPrincipal)}</strong>
                    </div>

                    <div className="rd-progress-track">
                      <div
                        className="rd-progress-fill"
                        style={{
                          width: `${Math.min(progress, 100)}%`,
                        }}
                      />
                    </div>

                    <div className="deposit-details">
                      <div>
                        <span>Installment</span>
                        <strong>
                          {formatNu(item.installmentChetrum)}
                        </strong>
                      </div>
                      <div>
                        <span>Progress</span>
                        <strong>
                          {item.installmentsPaid} / {item.tenureMonths}
                        </strong>
                      </div>
                      <div>
                        <span>Planned principal</span>
                        <strong>
                          {formatNu(plannedPrincipal)}
                        </strong>
                      </div>
                      <div>
                        <span>Maturity date</span>
                        <strong>
                          {formatAssetDate(maturityDate)}
                        </strong>
                      </div>
                    </div>

                    <p className="deposit-disclaimer">
                      Asset value shown is principal actually deposited,
                      not projected interest.
                    </p>

                    <div className="asset-row-actions">
                      <button
                        type="button"
                        onClick={() => openRdForm(item)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="danger"
                        onClick={() =>
                          setDeleteTarget({
                            kind: 'rd',
                            id: item.id,
                            name: item.name,
                          })
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
      </div>

      {deleteTarget && (
        <div className="asset-dialog-backdrop">
          <section
            className="asset-dialog"
            role="dialog"
            aria-modal="true"
          >
            <div className="asset-dialog-icon">!</div>
            <h2>Remove this record?</h2>
            <p>
              <strong>{deleteTarget.name}</strong> will be removed from
              My Money. This does not delete transactions.
            </p>

            <div className="asset-dialog-actions">
              <button
                type="button"
                className="asset-secondary-button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
              >
                Keep record
              </button>

              <button
                type="button"
                className="asset-delete-button"
                disabled={deleting}
                onClick={() => void confirmDelete()}
              >
                {deleting ? 'Removing...' : 'Remove record'}
              </button>
            </div>
          </section>
        </div>
      )}
    </AppShell>
  )
}

export default MyMoneyPage




