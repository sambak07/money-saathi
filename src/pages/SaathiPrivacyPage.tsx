import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  Link,
} from 'react-router-dom'

import AppShell from '../components/AppShell'
import {
  getProfile,
} from '../profile/userProfile'
import {
  SAATHI_CONTEXT_CATEGORIES,
  SAATHI_CONTEXT_INTENTS,
  buildSaathiContextEnvelope,
  getSaathiContextPermissions,
  recommendedCategoriesForIntent,
  resetSaathiContextPermissions,
  saveSaathiContextPermissions,
  type SaathiContextCategory,
  type SaathiContextIntent,
  type SaathiContextPermissions,
} from '../saathi/contextPermissions'
import {
  getFixedDeposits,
  getGoalContributions,
  getGoals,
  getLoans,
  getRecurringDeposits,
  getRegularMoney,
  getSavingsAccounts,
  getTransactions,
} from '../storage/db'
import {
  getPreferences,
} from '../settings/preferences'
import {
  getLocalToday,
} from '../utils/money'

import '../styles/saathi-privacy.css'

const categoryCopy: Record<
  SaathiContextCategory,
  {
    title: string
    description: string
  }
> = {
  profile: {
    title: 'Your selected money needs',
    description:
      'Only the setup choices you selected, such as student, salary or irregular income.',
  },
  'money-summary': {
    title: 'Money summary',
    description:
      'Recorded balance, this month’s totals, Safe to Spend, commitments and safety buffer.',
  },
  transactions: {
    title: 'Recent transaction activity',
    description:
      'Up to 90 days of date, income/expense, amount and category. Notes and record IDs are excluded.',
  },
  commitments: {
    title: 'Regular money',
    description:
      'Names, amounts, frequency and schedule for regular income and expenses. Notes and IDs are excluded.',
  },
  savings: {
    title: 'Savings and deposits',
    description:
      'Names and financial values for savings, FDs and RDs. Notes and Vault identifiers are excluded.',
  },
  loans: {
    title: 'Loans',
    description:
      'Loan name, lender, outstanding balance, rate, EMI, tenure and start date. Notes and account numbers are excluded.',
  },
  goals: {
    title: 'Goals',
    description:
      'Goal name, target, recorded contributions and target date. Notes and IDs are excluded.',
  },
}

const intentCopy: Record<
  SaathiContextIntent,
  {
    title: string
    example: string
  }
> = {
  overview: {
    title: 'Understand my overall money',
    example:
      'How am I doing financially right now?',
  },
  affordability: {
    title: 'Can I afford something?',
    example:
      'Can I spend Nu. 5,000 this week?',
  },
  spending: {
    title: 'Understand spending',
    example:
      'What changed in my spending recently?',
  },
  debt: {
    title: 'Understand debt',
    example:
      'Help me understand my loans and cash position.',
  },
  savings: {
    title: 'Plan savings',
    example:
      'How are my savings and goals progressing?',
  },
  learn: {
    title: 'Learn a money concept',
    example:
      'Explain EMI in simple language.',
  },
}

interface PrivacyData {
  transactions: Awaited<
    ReturnType<typeof getTransactions>
  >
  regularMoney: Awaited<
    ReturnType<typeof getRegularMoney>
  >
  savingsAccounts: Awaited<
    ReturnType<typeof getSavingsAccounts>
  >
  fixedDeposits: Awaited<
    ReturnType<typeof getFixedDeposits>
  >
  recurringDeposits: Awaited<
    ReturnType<typeof getRecurringDeposits>
  >
  loans: Awaited<
    ReturnType<typeof getLoans>
  >
  goals: Awaited<
    ReturnType<typeof getGoals>
  >
  goalContributions: Awaited<
    ReturnType<typeof getGoalContributions>
  >
}

function SaathiPrivacyPage() {
  const [
    permissions,
    setPermissions,
  ] =
    useState<SaathiContextPermissions>(
      () =>
        getSaathiContextPermissions(),
    )

  const [
    intent,
    setIntent,
  ] =
    useState<SaathiContextIntent>(
      'overview',
    )

  const [
    data,
    setData,
  ] =
    useState<PrivacyData | null>(
      null,
    )

  const [
    message,
    setMessage,
  ] =
    useState('')

  const [
    error,
    setError,
  ] =
    useState('')

  const [
    showPreview,
    setShowPreview,
  ] =
    useState(false)

  const [today] =
    useState(() => getLocalToday())

  const [profile] =
    useState(() => getProfile())

  const [preferences] =
    useState(() => getPreferences())

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const [
          transactions,
          regularMoney,
          savingsAccounts,
          fixedDeposits,
          recurringDeposits,
          loans,
          goals,
          goalContributions,
        ] =
          await Promise.all([
            getTransactions(),
            getRegularMoney(),
            getSavingsAccounts(),
            getFixedDeposits(),
            getRecurringDeposits(),
            getLoans(),
            getGoals(),
            getGoalContributions(),
          ])

        if (!active) {
          return
        }

        setData({
          transactions,
          regularMoney,
          savingsAccounts,
          fixedDeposits,
          recurringDeposits,
          loans,
          goals,
          goalContributions,
        })
      } catch {
        if (active) {
          setError(
            'Saathi could not prepare a local privacy preview.',
          )
        }
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [])

  const recommended =
    useMemo(
      () =>
        recommendedCategoriesForIntent(
          intent,
        ),
      [intent],
    )

  const preview =
    useMemo(() => {
      if (!data) {
        return null
      }

      return buildSaathiContextEnvelope(
        {
          today,
          safetyBufferChetrum:
            preferences.safetyBufferChetrum,
          needs:
            profile.needs,
          transactions:
            data.transactions,
          regularMoney:
            data.regularMoney,
          savingsAccounts:
            data.savingsAccounts,
          fixedDeposits:
            data.fixedDeposits,
          recurringDeposits:
            data.recurringDeposits,
          loans:
            data.loans,
          goals:
            data.goals,
          goalContributions:
            data.goalContributions,
        },
        permissions,
        intent,
      )
    }, [
      data,
      intent,
      permissions,
      preferences.safetyBufferChetrum,
      profile.needs,
      today,
    ])

  function setEnabled(
    enabled: boolean,
  ) {
    setMessage('')
    setShowPreview(false)

    setPermissions(
      (current) => ({
        ...current,
        enabled,
      }),
    )
  }

  function toggleCategory(
    category: SaathiContextCategory,
  ) {
    setMessage('')
    setShowPreview(false)

    setPermissions(
      (current) => ({
        ...current,
        categories: {
          ...current.categories,
          [category]:
            !current.categories[
              category
            ],
        },
      }),
    )
  }

  function save() {
    saveSaathiContextPermissions(
      permissions,
    )

    setMessage(
      permissions.enabled
        ? 'Saathi data permissions are saved locally on this device. Nothing was sent anywhere.'
        : 'Saathi AI data access remains off.',
    )
  }

  function reset() {
    const next =
      resetSaathiContextPermissions()

    setPermissions(
      next,
    )

    setShowPreview(false)

    setMessage(
      'Saathi AI data permissions were reset to off.',
    )
  }

  return (
    <AppShell>
      <div className="dashboard-container saathi-privacy-page">
        <header className="saathi-privacy-header">
          <p className="dashboard-eyebrow">
            Privacy before intelligence
          </p>

          <h1>
            Saathi data permissions
          </h1>

          <p>
            Decide what a future Saathi AI request may use.
            Nothing on this page calls an AI model, sends data to a
            server or changes your financial records.
          </p>

          <Link to="/app/saathi">
            Back to Saathi
          </Link>
        </header>

        <section className="saathi-privacy-boundary">
          <strong>
            Money Vault is outside this permission system.
          </strong>

          <span>
            Vault records, PINs, CVVs, OTPs, passwords, seed phrases,
            recovery codes, App Lock secrets and backup passwords are
            not available as Saathi context categories.
          </span>
        </section>

        {error && (
          <div
            className="saathi-privacy-error"
            role="alert"
          >
            {error}
          </div>
        )}

        <section className="saathi-permission-card">
          <div className="saathi-permission-master">
            <div>
              <p className="dashboard-eyebrow">
                Master permission
              </p>

              <h2>
                Future AI data access
              </h2>

              <p>
                Off means no personal financial context may be
                prepared for an external AI request.
              </p>
            </div>

            <label className="saathi-switch-row">
              <input
                type="checkbox"
                checked={
                  permissions.enabled
                }
                onChange={(event) =>
                  setEnabled(
                    event.target.checked,
                  )
                }
              />

              <span>
                {permissions.enabled
                  ? 'Allowed for selected categories'
                  : 'Off'}
              </span>
            </label>
          </div>

          <div className="saathi-category-list">
            {SAATHI_CONTEXT_CATEGORIES.map(
              (category) => {
                const copy =
                  categoryCopy[
                    category
                  ]

                return (
                  <label
                    key={category}
                    className={
                      permissions.categories[
                        category
                      ]
                        ? 'saathi-category-row selected'
                        : 'saathi-category-row'
                    }
                  >
                    <input
                      type="checkbox"
                      disabled={
                        !permissions.enabled
                      }
                      checked={
                        permissions.categories[
                          category
                        ]
                      }
                      onChange={() =>
                        toggleCategory(
                          category,
                        )
                      }
                    />

                    <span>
                      <strong>
                        {copy.title}
                      </strong>

                      <small>
                        {copy.description}
                      </small>
                    </span>
                  </label>
                )
              },
            )}
          </div>

          <div className="saathi-permission-actions">
            <button
              type="button"
              className="saathi-permission-primary"
              onClick={save}
            >
              Save permissions
            </button>

            <button
              type="button"
              className="saathi-permission-secondary"
              onClick={reset}
            >
              Reset all to off
            </button>
          </div>

          {message && (
            <div
              className="saathi-privacy-success"
              role="status"
            >
              {message}
            </div>
          )}
        </section>

        <section className="saathi-preview-card">
          <div className="saathi-preview-heading">
            <div>
              <p className="dashboard-eyebrow">
                Minimum necessary context
              </p>

              <h2>
                Preview what a question would use
              </h2>
            </div>
          </div>

          <label className="saathi-intent-field">
            Example question type

            <select
              value={intent}
              onChange={(event) => {
                setIntent(
                  event.target.value as
                    SaathiContextIntent,
                )
                setShowPreview(false)
              }}
            >
              {SAATHI_CONTEXT_INTENTS.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {
                      intentCopy[
                        item
                      ].title
                    }
                  </option>
                ),
              )}
            </select>
          </label>

          <div className="saathi-example-question">
            <span>
              Example
            </span>

            <strong>
              “{intentCopy[intent].example}”
            </strong>
          </div>

          <div className="saathi-recommended-context">
            <strong>
              This question type can use:
            </strong>

            {recommended.length === 0 ? (
              <span>
                No personal financial data. Learning questions can
                be answered without your records.
              </span>
            ) : (
              <div>
                {recommended.map(
                  (category) => (
                    <span
                      key={category}
                      className={
                        permissions.enabled &&
                        permissions.categories[
                          category
                        ]
                          ? 'allowed'
                          : 'blocked'
                      }
                    >
                      {
                        categoryCopy[
                          category
                        ].title
                      }
                      {' · '}
                      {permissions.enabled &&
                      permissions.categories[
                        category
                      ]
                        ? 'allowed'
                        : 'blocked'}
                    </span>
                  ),
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            className="saathi-permission-secondary"
            disabled={!preview}
            onClick={() =>
              setShowPreview(
                (current) =>
                  !current,
              )
            }
          >
            {showPreview
              ? 'Hide exact context'
              : 'Preview exact context'}
          </button>

          {showPreview && preview && (
            <div className="saathi-context-preview">
              <div>
                <strong>
                  Exact local context envelope
                </strong>

                <span>
                  This is a preview only. It has not been sent anywhere.
                </span>
              </div>

              <pre>
                {JSON.stringify(
                  preview,
                  null,
                  2,
                )}
              </pre>
            </div>
          )}
        </section>

        <section className="saathi-context-rules">
          <article>
            <strong>
              Question-specific
            </strong>

            <p>
              Permission to one category does not mean every question
              gets that category. Saathi first limits context to what
              the question type actually needs.
            </p>
          </article>

          <article>
            <strong>
              Summary before detail
            </strong>

            <p>
              Overview and affordability questions use calculated
              summaries first. Recent transaction detail is reserved
              for spending questions and is limited to 90 days.
            </p>
          </article>

          <article>
            <strong>
              Notes and internal IDs stay out
            </strong>

            <p>
              Transaction notes, loan notes, account identifiers and
              internal record IDs are deliberately removed from the
              context envelope.
            </p>
          </article>
        </section>
      </div>
    </AppShell>
  )
}

export default SaathiPrivacyPage