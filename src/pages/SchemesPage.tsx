import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { Link } from 'react-router-dom'

import AppShell from '../components/AppShell'
import {
  deleteFinancialScheme,
  getFinancialSchemes,
  upsertFinancialScheme,
} from '../storage/db'
import type {
  FinancialScheme,
  SchemeCategory,
  SchemeFrequency,
  SchemeStatus,
} from '../types/scheme'
import {
  annualContributionChetrum,
  formatSchemeDate,
  getSchemeCategoryLabel,
  getSchemeFrequencyLabel,
  getSchemeStatusLabel,
} from '../utils/schemes'
import {
  formatChetrumForInput,
  formatNu,
  getLocalToday,
  parseNuToChetrumAllowZero,
} from '../utils/money'

import '../styles/schemes.css'

const categories: SchemeCategory[] = [
  'provident-fund',
  'annuity',
  'endowment',
  'education',
  'hybrid-insurance',
  'other',
]

const frequencies: SchemeFrequency[] = [
  'monthly',
  'quarterly',
  'half-yearly',
  'yearly',
  'irregular',
  'none',
]

const statuses: SchemeStatus[] = [
  'active',
  'paused',
  'matured',
  'closed',
]

function SchemesPage() {
  const [schemes, setSchemes] =
    useState<FinancialScheme[]>([])
  const [loading, setLoading] = useState(true)

  const [name, setName] = useState('')
  const [provider, setProvider] = useState('')
  const [category, setCategory] =
    useState<SchemeCategory>('provident-fund')
  const [status, setStatus] =
    useState<SchemeStatus>('active')
  const [contribution, setContribution] = useState('')
  const [frequency, setFrequency] =
    useState<SchemeFrequency>('monthly')
  const [currentValue, setCurrentValue] = useState('0')
  const [protectionCover, setProtectionCover] =
    useState('0')
  const [futureBenefit, setFutureBenefit] = useState('0')
  const [startDate, setStartDate] =
    useState(getLocalToday())
  const [nextContributionDate, setNextContributionDate] =
    useState('')
  const [maturityDate, setMaturityDate] = useState('')
  const [note, setNote] = useState('')

  const [editingScheme, setEditingScheme] =
    useState<FinancialScheme | null>(null)
  const [deleteTarget, setDeleteTarget] =
    useState<FinancialScheme | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function loadSchemes() {
    setSchemes(await getFinancialSchemes())
  }

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const records = await getFinancialSchemes()

        if (active) {
          setSchemes(records)
        }
      } catch {
        if (active) {
          setError(
            'Money Saathi could not load your financial schemes.',
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

  const summary = useMemo(() => {
    let current = 0
    let protection = 0
    let future = 0
    let annualCommitment = 0
    let active = 0

    for (const scheme of schemes) {
      current += scheme.currentValueChetrum
      protection += scheme.protectionCoverChetrum
      future += scheme.futureBenefitChetrum
      annualCommitment += annualContributionChetrum(scheme)

      if (scheme.status === 'active') {
        active += 1
      }
    }

    return {
      current,
      protection,
      future,
      annualCommitment,
      active,
    }
  }, [schemes])

  function resetForm() {
    setName('')
    setProvider('')
    setCategory('provident-fund')
    setStatus('active')
    setContribution('')
    setFrequency('monthly')
    setCurrentValue('0')
    setProtectionCover('0')
    setFutureBenefit('0')
    setStartDate(getLocalToday())
    setNextContributionDate('')
    setMaturityDate('')
    setNote('')
    setEditingScheme(null)
    setError('')
  }

  function startEdit(
    scheme: FinancialScheme,
  ) {
    setEditingScheme(scheme)
    setName(scheme.name)
    setProvider(scheme.provider)
    setCategory(scheme.category)
    setStatus(scheme.status)
    setContribution(
      formatChetrumForInput(scheme.contributionChetrum),
    )
    setFrequency(scheme.contributionFrequency)
    setCurrentValue(
      formatChetrumForInput(scheme.currentValueChetrum),
    )
    setProtectionCover(
      formatChetrumForInput(scheme.protectionCoverChetrum),
    )
    setFutureBenefit(
      formatChetrumForInput(scheme.futureBenefitChetrum),
    )
    setStartDate(scheme.startDate)
    setNextContributionDate(scheme.nextContributionDate)
    setMaturityDate(scheme.maturityDate)
    setNote(scheme.note)
    setError('')

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  async function saveScheme(
    event: FormEvent<HTMLFormElement>,
    savedAt: number,
  ) {
    event.preventDefault()
    setError('')

    const contributionChetrum =
      contribution.trim() === ''
        ? 0
        : parseNuToChetrumAllowZero(contribution)

    const currentValueChetrum =
      currentValue.trim() === ''
        ? 0
        : parseNuToChetrumAllowZero(currentValue)

    const protectionCoverChetrum =
      protectionCover.trim() === ''
        ? 0
        : parseNuToChetrumAllowZero(protectionCover)

    const futureBenefitChetrum =
      futureBenefit.trim() === ''
        ? 0
        : parseNuToChetrumAllowZero(futureBenefit)

    if (name.trim().length < 2) {
      setError('Give this scheme a clear name.')
      return
    }

    if (
      contributionChetrum === null ||
      currentValueChetrum === null ||
      protectionCoverChetrum === null ||
      futureBenefitChetrum === null
    ) {
      setError(
        'Enter valid monetary amounts. Use 0 where a component does not apply.',
      )
      return
    }

    if (!startDate) {
      setError('Choose the scheme start date.')
      return
    }

    if (
      maturityDate &&
      maturityDate < startDate
    ) {
      setError(
        'Maturity or vesting date cannot be before the start date.',
      )
      return
    }

    if (
      nextContributionDate &&
      status !== 'active'
    ) {
      setError(
        'Only an active scheme should have a next contribution date.',
      )
      return
    }

    setSaving(true)

    try {
      const record: FinancialScheme = {
        id:
          editingScheme?.id ??
          crypto.randomUUID(),
        name: name.trim(),
        provider: provider.trim(),
        category,
        status,
        contributionChetrum,
        contributionFrequency: frequency,
        currentValueChetrum,
        protectionCoverChetrum,
        futureBenefitChetrum,
        startDate,
        nextContributionDate,
        maturityDate,
        note: note.trim(),
        createdAt:
          editingScheme?.createdAt ??
          savedAt,
        updatedAt: savedAt,
      }

      await upsertFinancialScheme(record)
      await loadSchemes()
      resetForm()
    } catch {
      setError(
        'Money Saathi could not save this financial scheme.',
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
      await deleteFinancialScheme(deleteTarget.id)
      await loadSchemes()

      if (editingScheme?.id === deleteTarget.id) {
        resetForm()
      }

      setDeleteTarget(null)
    } catch {
      setError(
        'Money Saathi could not remove this scheme.',
      )
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AppShell>
      <div className="dashboard-container">
        <header className="schemes-header">
          <Link
            to="/app/my-money"
            className="schemes-back-link"
          >
            ← My Money
          </Link>

          <p className="dashboard-eyebrow">
            Long-term money commitments
          </p>

          <h1>Schemes & Commitments</h1>

          <p>
            Track provident funds, annuities, endowment plans,
            education schemes and products that combine savings
            with insurance protection.
          </p>
        </header>

        <section className="scheme-summary-grid">
          <article className="scheme-summary-card">
            <span>Current recorded value</span>
            <strong>
              {formatNu(summary.current)}
            </strong>
            <small>
              Accumulated, surrender or other verified current value.
            </small>
          </article>

          <article className="scheme-summary-card">
            <span>Annual scheduled contributions</span>
            <strong>
              {formatNu(summary.annualCommitment)}
            </strong>
            <small>
              Excludes irregular and non-recurring contributions.
            </small>
          </article>

          <article className="scheme-summary-card">
            <span>Protection cover</span>
            <strong>
              {formatNu(summary.protection)}
            </strong>
            <small>
              Protection only — not counted as wealth.
            </small>
          </article>

          <article className="scheme-summary-card emphasized">
            <span>Active schemes</span>
            <strong>{summary.active}</strong>
            <small>
              Future benefits recorded: {formatNu(summary.future)}
            </small>
          </article>
        </section>

        <div className="scheme-accounting-note">
          <strong>Financial rule:</strong> current value, future benefit
          and insurance cover are different things. Money Saathi keeps
          them separate so cover or maturity benefits are never
          mistaken for money you own today.
        </div>

        {error && (
          <div className="scheme-error" role="alert">
            {error}
          </div>
        )}

        <div className="scheme-layout">
          <section className="scheme-list-card">
            <div className="scheme-section-heading">
              <div>
                <p className="dashboard-eyebrow">
                  Your long-term schemes
                </p>
                <h2>Financial schemes</h2>
              </div>

              <span>
                {schemes.length}{' '}
                {schemes.length === 1
                  ? 'scheme'
                  : 'schemes'}
              </span>
            </div>

            {loading ? (
              <div className="scheme-empty">
                Loading schemes...
              </div>
            ) : schemes.length === 0 ? (
              <div className="scheme-empty">
                <div className="scheme-empty-icon">
                  ◇
                </div>
                <h3>No schemes recorded yet</h3>
                <p>
                  Add a provident fund, endowment, education,
                  annuity or savings-plus-protection scheme.
                </p>
              </div>
            ) : (
              <div className="scheme-list">
                {schemes.map((scheme) => (
                  <article
                    className="scheme-card"
                    key={scheme.id}
                  >
                    <div className="scheme-card-top">
                      <div>
                        <h3>{scheme.name}</h3>

                        <p>
                          {scheme.provider ||
                            'Provider not specified'}
                          {' · '}
                          {getSchemeCategoryLabel(
                            scheme.category,
                          )}
                        </p>
                      </div>

                      <span
                        className={`scheme-status ${scheme.status}`}
                      >
                        {getSchemeStatusLabel(
                          scheme.status,
                        )}
                      </span>
                    </div>

                    <div className="scheme-money-grid">
                      <div>
                        <span>Contribution</span>
                        <strong>
                          {scheme.contributionChetrum > 0
                            ? formatNu(
                                scheme.contributionChetrum,
                              )
                            : 'None'}
                        </strong>
                        <small>
                          {getSchemeFrequencyLabel(
                            scheme.contributionFrequency,
                          )}
                        </small>
                      </div>

                      <div>
                        <span>Current value</span>
                        <strong>
                          {formatNu(
                            scheme.currentValueChetrum,
                          )}
                        </strong>
                        <small>
                          Today's recorded value
                        </small>
                      </div>

                      <div>
                        <span>Protection cover</span>
                        <strong>
                          {formatNu(
                            scheme.protectionCoverChetrum,
                          )}
                        </strong>
                        <small>
                          Not an asset
                        </small>
                      </div>

                      <div>
                        <span>Future benefit</span>
                        <strong>
                          {formatNu(
                            scheme.futureBenefitChetrum,
                          )}
                        </strong>
                        <small>
                          Not today's value
                        </small>
                      </div>
                    </div>

                    <div className="scheme-date-grid">
                      <div>
                        <span>Started</span>
                        <strong>
                          {formatSchemeDate(
                            scheme.startDate,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>Next contribution</span>
                        <strong>
                          {formatSchemeDate(
                            scheme.nextContributionDate,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>Maturity / vesting</span>
                        <strong>
                          {formatSchemeDate(
                            scheme.maturityDate,
                          )}
                        </strong>
                      </div>
                    </div>

                    {scheme.note && (
                      <p className="scheme-note">
                        {scheme.note}
                      </p>
                    )}

                    <div className="scheme-actions">
                      <button
                        type="button"
                        onClick={() =>
                          startEdit(scheme)
                        }
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="danger"
                        onClick={() =>
                          setDeleteTarget(scheme)
                        }
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <aside className="scheme-form-card">
            <p className="dashboard-eyebrow">
              {editingScheme
                ? 'Update scheme'
                : 'New scheme'}
            </p>

            <h2>
              {editingScheme
                ? `Edit ${editingScheme.name}`
                : 'Add financial scheme'}
            </h2>

            <p className="scheme-form-description">
              Enter only values you know. Use current accumulated
              or surrender value for today's value — never the
              sum assured or future maturity amount.
            </p>

            <form
              onSubmit={(event) =>
                void saveScheme(
                  event,
                  Date.now(),
                )
              }
            >
              <div className="scheme-field">
                <label htmlFor="scheme-name">
                  Scheme name
                </label>

                <input
                  id="scheme-name"
                  type="text"
                  maxLength={80}
                  placeholder="Example: Group Insurance Scheme"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                />
              </div>

              <div className="scheme-field">
                <label htmlFor="scheme-provider">
                  Provider <span>Optional</span>
                </label>

                <input
                  id="scheme-provider"
                  type="text"
                  maxLength={80}
                  placeholder="Example: RICB"
                  value={provider}
                  onChange={(event) =>
                    setProvider(event.target.value)
                  }
                />
              </div>

              <div className="scheme-field">
                <label htmlFor="scheme-category">
                  Scheme type
                </label>

                <select
                  id="scheme-category"
                  value={category}
                  onChange={(event) =>
                    setCategory(
                      event.target.value as SchemeCategory,
                    )
                  }
                >
                  {categories.map((item) => (
                    <option
                      value={item}
                      key={item}
                    >
                      {getSchemeCategoryLabel(item)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="scheme-field">
                <label htmlFor="scheme-status">
                  Status
                </label>

                <select
                  id="scheme-status"
                  value={status}
                  onChange={(event) =>
                    setStatus(
                      event.target.value as SchemeStatus,
                    )
                  }
                >
                  {statuses.map((item) => (
                    <option
                      value={item}
                      key={item}
                    >
                      {getSchemeStatusLabel(item)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="scheme-field">
                <label htmlFor="scheme-contribution">
                  Contribution / premium
                </label>

                <div className="scheme-money-input">
                  <span>Nu.</span>

                  <input
                    id="scheme-contribution"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={contribution}
                    onChange={(event) =>
                      setContribution(
                        event.target.value,
                      )
                    }
                  />
                </div>
              </div>

              <div className="scheme-field">
                <label htmlFor="scheme-frequency">
                  Contribution frequency
                </label>

                <select
                  id="scheme-frequency"
                  value={frequency}
                  onChange={(event) =>
                    setFrequency(
                      event.target.value as SchemeFrequency,
                    )
                  }
                >
                  {frequencies.map((item) => (
                    <option
                      value={item}
                      key={item}
                    >
                      {getSchemeFrequencyLabel(item)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="scheme-field">
                <label htmlFor="scheme-current-value">
                  Current verified value
                </label>

                <div className="scheme-money-input">
                  <span>Nu.</span>

                  <input
                    id="scheme-current-value"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={currentValue}
                    onChange={(event) =>
                      setCurrentValue(
                        event.target.value,
                      )
                    }
                  />
                </div>

                <small>
                  Accumulated balance, surrender value or other
                  amount actually attributable today.
                </small>
              </div>

              <div className="scheme-field">
                <label htmlFor="scheme-cover">
                  Protection cover
                </label>

                <div className="scheme-money-input">
                  <span>Nu.</span>

                  <input
                    id="scheme-cover"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={protectionCover}
                    onChange={(event) =>
                      setProtectionCover(
                        event.target.value,
                      )
                    }
                  />
                </div>

                <small>
                  Sum assured or insured amount. This is not an
                  asset.
                </small>
              </div>

              <div className="scheme-field">
                <label htmlFor="scheme-benefit">
                  Future / maturity benefit
                </label>

                <div className="scheme-money-input">
                  <span>Nu.</span>

                  <input
                    id="scheme-benefit"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={futureBenefit}
                    onChange={(event) =>
                      setFutureBenefit(
                        event.target.value,
                      )
                    }
                  />
                </div>

                <small>
                  Use only a documented expected benefit. It is
                  not included in today's money.
                </small>
              </div>

              <div className="scheme-field">
                <label htmlFor="scheme-start">
                  Start date
                </label>

                <input
                  id="scheme-start"
                  type="date"
                  value={startDate}
                  onChange={(event) =>
                    setStartDate(
                      event.target.value,
                    )
                  }
                />
              </div>

              <div className="scheme-field">
                <label htmlFor="scheme-next">
                  Next contribution
                  <span>Optional</span>
                </label>

                <input
                  id="scheme-next"
                  type="date"
                  value={nextContributionDate}
                  onChange={(event) =>
                    setNextContributionDate(
                      event.target.value,
                    )
                  }
                />
              </div>

              <div className="scheme-field">
                <label htmlFor="scheme-maturity">
                  Maturity / vesting date
                  <span>Optional</span>
                </label>

                <input
                  id="scheme-maturity"
                  type="date"
                  min={startDate || undefined}
                  value={maturityDate}
                  onChange={(event) =>
                    setMaturityDate(
                      event.target.value,
                    )
                  }
                />
              </div>

              <div className="scheme-field">
                <label htmlFor="scheme-note">
                  Note <span>Optional</span>
                </label>

                <input
                  id="scheme-note"
                  type="text"
                  maxLength={160}
                  placeholder="Example: Salary deduction"
                  value={note}
                  onChange={(event) =>
                    setNote(event.target.value)
                  }
                />
              </div>

              <div className="scheme-form-actions">
                {editingScheme && (
                  <button
                    type="button"
                    className="scheme-secondary-button"
                    onClick={resetForm}
                  >
                    Cancel
                  </button>
                )}

                <button
                  type="submit"
                  className="scheme-primary-button"
                  disabled={saving}
                >
                  {saving
                    ? 'Saving...'
                    : editingScheme
                      ? 'Save changes'
                      : 'Add scheme'}
                </button>
              </div>
            </form>
          </aside>
        </div>
      </div>

      {deleteTarget && (
        <div className="scheme-dialog-backdrop">
          <section
            className="scheme-dialog"
            role="dialog"
            aria-modal="true"
          >
            <div className="scheme-dialog-icon">
              !
            </div>

            <h2>Delete scheme?</h2>

            <p>
              <strong>{deleteTarget.name}</strong> will be removed
              from Schemes & Commitments. Transactions, assets,
              loans and Regular Money are not changed.
            </p>

            <div className="scheme-dialog-actions">
              <button
                type="button"
                className="scheme-secondary-button"
                disabled={deleting}
                onClick={() =>
                  setDeleteTarget(null)
                }
              >
                Keep scheme
              </button>

              <button
                type="button"
                className="scheme-delete-button"
                disabled={deleting}
                onClick={() =>
                  void confirmDelete()
                }
              >
                {deleting
                  ? 'Deleting...'
                  : 'Delete scheme'}
              </button>
            </div>
          </section>
        </div>
      )}
    </AppShell>
  )
}

export default SchemesPage


