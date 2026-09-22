import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  Link,
} from 'react-router-dom'

import {
  acknowledgeAlertForToday,
  getAcknowledgedAlertIds,
  getAlertPreferences,
  saveAlertPreferences,
  type AlertDueSoonDays,
  type AlertPreferences,
} from '../alerts/alertPreferences'
import {
  buildLoanReminderReferences,
  getLoanDueReminders,
} from '../alerts/loanDueReminders'
import AppShell from '../components/AppShell'
import {
  getFinancialSchemes,
  getLoans,
  getRegularMoney,
  getTransactions,
} from '../storage/db'
import {
  getPreferences,
} from '../settings/preferences'
import {
  buildMoneyAlerts,
  countAlertLevels,
} from '../utils/moneyAlerts'
import {
  formatNu,
  getLocalToday,
} from '../utils/money'
import {
  formatScheduleDate,
} from '../utils/recurrence'
import {
  calculateSafeToSpend,
} from '../utils/safeToSpend'
import {
  transactionBalanceChetrum,
} from '../utils/simpleHome'

import '../styles/alert-centre.css'

interface AlertData {
  regularMoney: Awaited<
    ReturnType<typeof getRegularMoney>
  >
  transactions: Awaited<
    ReturnType<typeof getTransactions>
  >
  schemes: Awaited<
    ReturnType<typeof getFinancialSchemes>
  >
  loans: Awaited<
    ReturnType<typeof getLoans>
  >
}

const DUE_SOON_OPTIONS:
  AlertDueSoonDays[] = [
    3,
    7,
    14,
  ]

function AlertCentrePage() {
  const [today] =
    useState(() => getLocalToday())

  const [preferences, setPreferences] =
    useState<AlertPreferences>(
      () => getAlertPreferences(),
    )

  const [
    acknowledgedIds,
    setAcknowledgedIds,
  ] = useState<Set<string>>(
    () =>
      getAcknowledgedAlertIds(
        getLocalToday(),
      ),
  )

  const [data, setData] =
    useState<AlertData | null>(null)

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
        const [
          regularMoney,
          transactions,
          schemes,
          loans,
        ] = await Promise.all([
          getRegularMoney(),
          getTransactions(),
          getFinancialSchemes(),
          getLoans(),
        ])

        if (!active) return

        setData({
          regularMoney,
          transactions,
          schemes,
          loans,
        })
      } catch {
        if (active) {
          setError(
            'Money Saathi could not prepare your reminders.',
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

  const view = useMemo(() => {
    if (!data) return null

    const recordedBalanceChetrum =
      transactionBalanceChetrum(
        data.transactions,
      )

    const appPreferences =
      getPreferences()

    const safe =
      calculateSafeToSpend(
        today,
        recordedBalanceChetrum,
        data.regularMoney,
        data.transactions,
        appPreferences.safetyBufferChetrum,
      )

    const alerts =
      buildMoneyAlerts({
        today,
        dueSoonDays:
          preferences.dueSoonDays,
        regularMoney:
          data.regularMoney,
        transactions:
          data.transactions,
        schemes:
          data.schemes,
        recordedBalanceChetrum,
        safeToSpendChetrum:
          safe.safeToSpendChetrum,
        upcomingCommitmentsChetrum:
          safe.upcomingCommitmentsChetrum,
        loanReminders:
          buildLoanReminderReferences(
            data.loans,
            getLoanDueReminders(),
          ),
      })

    const visibleAlerts =
      alerts.filter(
        (alert) =>
          !acknowledgedIds.has(
            alert.id,
          ),
      )

    return {
      alerts,
      visibleAlerts,
      counts:
        countAlertLevels(
          visibleAlerts,
        ),
    }
  }, [
    acknowledgedIds,
    data,
    preferences.dueSoonDays,
    today,
  ])

  function updatePreferences(
    next: AlertPreferences,
  ) {
    setPreferences(next)
    saveAlertPreferences(next)
  }

  function acknowledge(
    alertId: string,
  ) {
    acknowledgeAlertForToday(
      alertId,
      today,
    )

    setAcknowledgedIds(
      (current) => {
        const next =
          new Set(current)

        next.add(alertId)

        return next
      },
    )
  }

  async function enableNotifications() {
    setError('')
    setMessage('')

    if (
      !('Notification' in window)
    ) {
      setError(
        'This browser does not expose notification permission to Money Saathi.',
      )
      return
    }

    const permission =
      await Notification
        .requestPermission()

    if (
      permission !== 'granted'
    ) {
      updatePreferences({
        ...preferences,
        browserNotifications:
          false,
      })

      setError(
        'Browser notification permission was not granted. In-app reminders still work normally.',
      )
      return
    }

    updatePreferences({
      ...preferences,
      browserNotifications: true,
    })

    setMessage(
      'Browser reminders enabled while Money Saathi is open.',
    )
  }

  if (loading) {
    return (
      <AppShell>
        <div className="dashboard-container">
          <div className="dashboard2-loading">
            Preparing reminders...
          </div>
        </div>
      </AppShell>
    )
  }

  if (error && !view) {
    return (
      <AppShell>
        <div className="dashboard-container">
          <div
            className="dashboard2-error"
            role="alert"
          >
            {error}
          </div>
        </div>
      </AppShell>
    )
  }

  if (!view) {
    return null
  }

  return (
    <AppShell>
      <div className="dashboard-container alert-centre-page">
        <header className="alert-centre-header">
          <div>
            <p className="dashboard-eyebrow">
              Remember what matters
            </p>

            <h1>Alerts & reminders</h1>

            <p>
              Money Saathi watches the financial dates you
              actually record. It does not invent bill dates,
              payment failures or future income.
            </p>
          </div>

          <Link to="/app/calendar">
            Money calendar
          </Link>
        </header>

        {message && (
          <div
            className="alert-centre-message"
            role="status"
          >
            {message}
          </div>
        )}

        {error && (
          <div
            className="alert-centre-error"
            role="alert"
          >
            {error}
          </div>
        )}

        <section className="alert-centre-summary">
          <article>
            <span>Urgent</span>
            <strong>
              {view.counts.urgent}
            </strong>
            <small>
              Due today or overdue recorded expenses and verified
              loan payments.
            </small>
          </article>

          <article>
            <span>Needs attention</span>
            <strong>
              {view.counts.attention}
            </strong>
            <small>
              Upcoming commitments, passed income dates or safety
              status.
            </small>
          </article>

          <article>
            <span>Information</span>
            <strong>
              {view.counts.info}
            </strong>
            <small>
              Useful upcoming references.
            </small>
          </article>
        </section>

        <section className="alert-settings">
          <div className="alert-settings-heading">
            <div>
              <p className="dashboard-eyebrow">
                Your reminder settings
              </p>

              <h2>
                Stay useful, not noisy
              </h2>
            </div>
          </div>

          <div className="alert-settings-grid">
            <label>
              Remind me about dates within
              <select
                value={
                  preferences.dueSoonDays
                }
                onChange={(event) =>
                  updatePreferences({
                    ...preferences,
                    dueSoonDays:
                      Number(
                        event.target.value,
                      ) as AlertDueSoonDays,
                  })
                }
              >
                {DUE_SOON_OPTIONS.map(
                  (days) => (
                    <option
                      key={days}
                      value={days}
                    >
                      {days} days
                    </option>
                  ),
                )}
              </select>
            </label>

            <label>
              Quiet hours start
              <input
                type="time"
                value={
                  preferences.quietStart
                }
                onChange={(event) =>
                  updatePreferences({
                    ...preferences,
                    quietStart:
                      event.target.value,
                  })
                }
              />
            </label>

            <label>
              Quiet hours end
              <input
                type="time"
                value={
                  preferences.quietEnd
                }
                onChange={(event) =>
                  updatePreferences({
                    ...preferences,
                    quietEnd:
                      event.target.value,
                  })
                }
              />
            </label>

            <label className="alert-checkbox">
              <input
                type="checkbox"
                checked={
                  preferences
                    .quietHoursEnabled
                }
                onChange={(event) =>
                  updatePreferences({
                    ...preferences,
                    quietHoursEnabled:
                      event.target.checked,
                  })
                }
              />

              <span>
                Respect quiet hours for browser reminders
              </span>
            </label>
          </div>

          <div className="alert-browser-notifications">
            <div>
              <strong>
                Browser / PWA reminders
              </strong>

              <p>
                Optional. These reminders can fire while Money
                Saathi is open and the browser allows
                notifications. Because Money Saathi has no server,
                it does not promise scheduled notifications while
                the app and browser are completely closed.
              </p>
            </div>

            {preferences.browserNotifications ? (
              <button
                type="button"
                className="secondary"
                onClick={() =>
                  updatePreferences({
                    ...preferences,
                    browserNotifications:
                      false,
                  })
                }
              >
                Turn browser reminders off
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  void enableNotifications()
                }
              >
                Enable browser reminders
              </button>
            )}
          </div>
        </section>

        <section className="alert-centre-list-section">
          <div className="alert-centre-list-heading">
            <div>
              <p className="dashboard-eyebrow">
                Current reminders
              </p>

              <h2>
                {view.visibleAlerts.length === 0
                  ? 'Nothing needs your attention'
                  : `${view.visibleAlerts.length} active ${
                      view.visibleAlerts.length === 1
                        ? 'reminder'
                        : 'reminders'
                    }`}
              </h2>
            </div>

            {view.alerts.length >
              view.visibleAlerts.length && (
              <span>
                {
                  view.alerts.length -
                  view.visibleAlerts.length
                } hidden for today
              </span>
            )}
          </div>

          {view.visibleAlerts.length === 0 ? (
            <div className="alert-centre-empty">
              <strong>
                You are clear for now.
              </strong>

              <p>
                New reminders appear from Regular Money, active
                scheme contribution dates, verified loan due dates
                and important Safe to Spend status.
              </p>
            </div>
          ) : (
            <div className="alert-centre-list">
              {view.visibleAlerts.map(
                (alert) => (
                  <article
                    key={alert.id}
                    className={`alert-card ${alert.level}`}
                  >
                    <div className="alert-card-copy">
                      <div className="alert-card-meta">
                        <span>
                          {alert.level}
                        </span>

                        <span>
                          {alert.status}
                        </span>

                        {alert.dueDate && (
                          <span>
                            {formatScheduleDate(
                              alert.dueDate,
                            )}
                          </span>
                        )}
                      </div>

                      <strong>
                        {alert.title}
                      </strong>

                      <p>
                        {alert.detail}
                      </p>

                      {alert.amountChetrum !==
                        null && (
                        <small>
                          Recorded amount:{' '}
                          <strong>
                            {formatNu(
                              alert.amountChetrum,
                            )}
                          </strong>
                        </small>
                      )}
                    </div>

                    <div className="alert-card-actions">
                      <Link
                        to={alert.href}
                      >
                        {alert.actionLabel}
                      </Link>

                      <button
                        type="button"
                        onClick={() =>
                          acknowledge(
                            alert.id,
                          )
                        }
                      >
                        Hide for today
                      </button>
                    </div>
                  </article>
                ),
              )}
            </div>
          )}
        </section>

        <section className="alert-centre-guardrails">
          <div>
            <strong>
              Loan dates are user-verified
            </strong>

            <p>
              Loan alerts only appear when you enter the payment
              amount and next due date yourself. Money Saathi does
              not infer due dates from EMI calculations.
            </p>

            <Link to="/app/loan-reminders">
              Manage loan reminders
            </Link>
          </div>

          <div>
            <strong>
              Income reminders are not income guarantees
            </strong>

            <p>
              A scheduled income date is a planning reminder only.
              Future income still stays outside Safe to Spend
              until it is recorded as received.
            </p>
          </div>

          <div>
            <strong>
              In-app reminders are the reliable source
            </strong>

            <p>
              The Alert Centre is available whenever you open
              Money Saathi. Browser notification behavior depends
              on the device, browser and permission settings.
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  )
}

export default AlertCentrePage
