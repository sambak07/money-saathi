import {
  type FormEvent,
  useState,
} from 'react'
import { Link } from 'react-router-dom'

import {
  clearLoanDueReminders,
} from '../alerts/loanDueReminders'
import AppShell from '../components/AppShell'
import {
  clearAllFinancialData,
} from '../storage/db'
import {
  clearVaultSessionKey,
} from '../vault/vaultSession'
import {
  clearVaultStorage,
} from '../vault/vaultStore'
import {
  type DashboardRecentCount,
  type MoneySaathiPreferences,
  type ReportTrendMonths,
  getPreferences,
  resetDisplayPreferences,
  savePreferences,
} from '../settings/preferences'

import '../styles/settings.css'

function SettingsPage() {
  const [preferences, setPreferences] =
    useState<MoneySaathiPreferences>(
      () => getPreferences(),
    )

  const [erasePhrase, setErasePhrase] = useState('')
  const [saving, setSaving] = useState(false)
  const [erasing, setErasing] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function updatePreference<
    Key extends keyof MoneySaathiPreferences,
  >(
    key: Key,
    value: MoneySaathiPreferences[Key],
  ) {
    setPreferences((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function save(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setMessage('')
    setError('')
    setSaving(true)

    try {
      savePreferences(preferences)
      setPreferences(getPreferences())
      setMessage('Settings saved on this device.')
    } catch {
      setError('Money Saathi could not save these settings.')
    } finally {
      setSaving(false)
    }
  }

  function restoreDefaults() {
    setMessage('')
    setError('')

    resetDisplayPreferences()
    setPreferences(getPreferences())
    setMessage(
      'Display preferences reset. Your safety buffer was kept.',
    )
  }

  async function eraseFinancialData() {
    setMessage('')
    setError('')

    if (erasePhrase !== 'DELETE ALL') {
      setError(
        'Type DELETE ALL exactly before erasing financial records.',
      )
      return
    }

    setErasing(true)

    try {
      // Money Vault is intentionally stored in a separate IndexedDB.
      // Erase it first so the most sensitive local records are not
      // accidentally left behind by the app-wide erase control.
      await clearVaultStorage()
      clearVaultSessionKey()

      await clearAllFinancialData()
      clearLoanDueReminders()

      setErasePhrase('')
      setMessage(
        'All personal and business financial records, Money Vault records and verified loan reminders were erased from this browser. App Lock and device preferences were kept. Exported backup files are not deleted.',
      )
    } catch {
      clearVaultSessionKey()

      setError(
        'Money Saathi could not complete the full local data erase. Some records may already have been erased; retry DELETE ALL before leaving this device.',
      )
    } finally {
      setErasing(false)
    }
  }

  return (
    <AppShell>
      <div className="dashboard-container settings-page">
        <header className="settings-header">
          <p className="dashboard-eyebrow">
            Your Money Saathi
          </p>

          <h1>Settings</h1>

          <p>
            Adjust the few preferences that change how Money
            Saathi works, and manage privacy or local data
            without adding unnecessary complexity.
          </p>
        </header>

        {message && (
          <div className="settings-message" role="status">
            {message}
          </div>
        )}

        {error && (
          <div className="settings-error" role="alert">
            {error}
          </div>
        )}

        <section className="settings-panel">
          <div className="settings-panel-heading">
            <p className="dashboard-eyebrow">
              Preferences
            </p>

            <h2>Personalize the app</h2>

            <p>
              These settings stay on this browser and are included
              in encrypted backups. App Lock remains device-specific.
            </p>
          </div>

          <form
            className="settings-form"
            onSubmit={save}
          >
            <div className="settings-field">
              <label htmlFor="settings-name">
                Preferred name
                <span>Optional</span>
              </label>

              <input
                id="settings-name"
                type="text"
                maxLength={50}
                placeholder="How Money Saathi should greet you"
                value={preferences.displayName}
                onChange={(event) =>
                  updatePreference(
                    'displayName',
                    event.target.value,
                  )
                }
              />
            </div>

            <div className="settings-field">
              <label htmlFor="settings-report-range">
                Default Reports trend
              </label>

              <select
                id="settings-report-range"
                value={preferences.reportTrendMonths}
                onChange={(event) =>
                  updatePreference(
                    'reportTrendMonths',
                    Number(
                      event.target.value,
                    ) as ReportTrendMonths,
                  )
                }
              >
                <option value={3}>3 months</option>
                <option value={6}>6 months</option>
                <option value={12}>12 months</option>
              </select>
            </div>

            <div className="settings-field">
              <label htmlFor="settings-recent-count">
                Recent transactions on Home
              </label>

              <select
                id="settings-recent-count"
                value={preferences.dashboardRecentCount}
                onChange={(event) =>
                  updatePreference(
                    'dashboardRecentCount',
                    Number(
                      event.target.value,
                    ) as DashboardRecentCount,
                  )
                }
              >
                <option value={3}>3 transactions</option>
                <option value={5}>5 transactions</option>
                <option value={8}>8 transactions</option>
              </select>
            </div>

            <div className="settings-actions">
              <button
                type="button"
                className="settings-secondary-button"
                onClick={restoreDefaults}
              >
                Reset display defaults
              </button>

              <button
                type="submit"
                className="settings-primary-button"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save settings'}
              </button>
            </div>
          </form>
        </section>

        <section className="settings-fixed-grid">
          <article>
            <span>Currency</span>
            <strong>Bhutanese Ngultrum (Nu.)</strong>
            <p>
              Financial amounts are stored as integer chetrum,
              with two decimal places.
            </p>
          </article>

          <article>
            <span>Monthly reporting</span>
            <strong>Calendar month</strong>
            <p>
              Budgets and transaction reports use the first
              through the last day of each month.
            </p>
          </article>

          <article>
            <span>Data location</span>
            <strong>This browser</strong>
            <p>
              Financial records remain in local IndexedDB unless
              you export an encrypted backup.
            </p>
          </article>
        </section>

                <section className="settings-two-column">
          <article className="settings-link-card">
            <p className="dashboard-eyebrow">
              Experience
            </p>

            <h2>What Money Saathi should help with</h2>

            <p>
              Select one or more financial needs so future Home
              screens can adapt without labeling you permanently.
            </p>

            <Link to="/app/setup">
              Personalize Money Saathi
            </Link>
          </article>

          <article className="settings-link-card">
            <p className="dashboard-eyebrow">
              Privacy
            </p>

            <h2>App Lock</h2>

            <p>
              Set, change or disable the local six-digit privacy
              PIN.
            </p>

            <Link to="/app/security">
              Open App Lock
            </Link>
          </article>

          <article className="settings-link-card">
            <p className="dashboard-eyebrow">
              Portability
            </p>

            <h2>Backup & Restore</h2>

            <p>
              Create or verify an encrypted copy of your
              financial database.
            </p>

            <Link to="/app/backup">
              Open Backup & Restore
            </Link>
          </article>
        </section>

        <section className="settings-panel settings-danger-panel">
          <div className="settings-panel-heading">
            <p className="dashboard-eyebrow">
              Destructive data control
            </p>

            <h2>Erase all financial records</h2>

            <p>
              This clears personal and business money records,
              Money Vault records, loan reminders, transactions,
              budgets, Regular Money, goals, savings, deposits,
              loans and schemes from this browser. App Lock and
              device preferences are preserved. Exported backup
              files are not deleted.
            </p>
          </div>

          <div className="settings-danger-body">
            <div className="settings-field">
              <label htmlFor="erase-confirmation">
                Type <strong>DELETE ALL</strong> to confirm
              </label>

              <input
                id="erase-confirmation"
                type="text"
                autoComplete="off"
                value={erasePhrase}
                onChange={(event) =>
                  setErasePhrase(event.target.value)
                }
              />
            </div>

            <button
              type="button"
              className="settings-danger-button"
              disabled={erasing}
              onClick={() =>
                void eraseFinancialData()
              }
            >
              {erasing
                ? 'Erasing...'
                : 'Erase financial data'}
            </button>
          </div>
        </section>
      </div>
    </AppShell>
  )
}

export default SettingsPage

