import {
  type ChangeEvent,
  type FormEvent,
  useMemo,
  useState,
} from 'react'

import {
  captureDurableSettingsBackup,
  restoreDurableSettingsBackup,
} from '../backup/durableSettings'
import AppShell from '../components/AppShell'
import {
  exportDatabaseSnapshot,
  replaceDatabaseSnapshot,
} from '../storage/db'
import {
  BACKUP_FORMAT,
  BACKUP_MAX_BYTES,
  BACKUP_MAX_MEGABYTES,
  BACKUP_VERSION,
  type BackupSummary,
  type MoneySaathiBackupPayload,
  buildBackupSummary,
  decryptBackupEnvelope,
  encryptBackupPayload,
  parseEncryptedBackupText,
} from '../backup/backup'

import '../styles/backup.css'

function formatExportedAt(value: string): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function BackupPage() {
  const [backupPassword, setBackupPassword] = useState('')
  const [backupConfirm, setBackupConfirm] = useState('')
  const [creating, setCreating] = useState(false)

  const [restoreFile, setRestoreFile] =
    useState<File | null>(null)
  const [restorePassword, setRestorePassword] = useState('')
  const [verifiedPayload, setVerifiedPayload] =
    useState<MoneySaathiBackupPayload | null>(null)
  const [restorePhrase, setRestorePhrase] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [restoring, setRestoring] = useState(false)

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const verifiedSummary = useMemo<BackupSummary | null>(
    () =>
      verifiedPayload
        ? buildBackupSummary(verifiedPayload)
        : null,
    [verifiedPayload],
  )

  async function createBackup(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setMessage('')
    setError('')

    if (backupPassword.length < 8) {
      setError(
        'Use a backup password with at least eight characters.',
      )
      return
    }

    if (backupPassword !== backupConfirm) {
      setError('The backup passwords do not match.')
      return
    }

    setCreating(true)

    try {
      const snapshot = await exportDatabaseSnapshot()

      const payload: MoneySaathiBackupPayload = {
        format: BACKUP_FORMAT,
        version: BACKUP_VERSION,
        exportedAt: new Date().toISOString(),
        data: snapshot,
        settings:
          captureDurableSettingsBackup(),
      }

      const envelope = await encryptBackupPayload(
        payload,
        backupPassword,
      )

      const verification = await decryptBackupEnvelope(
        envelope,
        backupPassword,
      )

      if (
        buildBackupSummary(verification).totalRecords !==
          buildBackupSummary(payload).totalRecords ||
        JSON.stringify(verification.settings) !==
          JSON.stringify(payload.settings)
      ) {
        throw new Error(
          'Backup self-verification failed.',
        )
      }

      const blob = new Blob(
        [JSON.stringify(envelope)],
        {
          type: 'application/json',
        },
      )

      if (
        blob.size >
        BACKUP_MAX_BYTES
      ) {
        setError(
          `This backup would be larger than the ${BACKUP_MAX_MEGABYTES} MB safety limit and was not downloaded. Export or remove older records before trying again.`,
        )
        return
      }

      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      const date = new Date().toISOString().slice(0, 10)

      anchor.href = url
      anchor.download = `money-saathi-backup-${date}.msaathi`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)

      setBackupPassword('')
      setBackupConfirm('')
      setMessage(
        'Encrypted backup created and verified before download.',
      )
    } catch {
      setError(
        'Money Saathi could not create a verified encrypted backup.',
      )
    } finally {
      setCreating(false)
    }
  }

  function handleRestoreFile(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0] ?? null

    setRestoreFile(file)
    setVerifiedPayload(null)
    setRestorePhrase('')
    setMessage('')
    setError('')

    if (file && file.size > BACKUP_MAX_BYTES) {
      setRestoreFile(null)
      setError(
        `Backup file is larger than the ${BACKUP_MAX_MEGABYTES} MB safety limit.`,
      )
      event.target.value = ''
    }
  }

  async function verifyRestore(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setMessage('')
    setError('')
    setVerifiedPayload(null)
    setRestorePhrase('')

    if (!restoreFile) {
      setError('Choose a Money Saathi backup file.')
      return
    }

    if (restorePassword.length < 8) {
      setError(
        'Enter the password used when this backup was created.',
      )
      return
    }

    setVerifying(true)

    try {
      const text = await restoreFile.text()
      const envelope = parseEncryptedBackupText(text)
      const payload = await decryptBackupEnvelope(
        envelope,
        restorePassword,
      )

      setVerifiedPayload(payload)
      setMessage(
        'Backup decrypted and verified. Review the summary before restoring.',
      )
    } catch {
      setError(
        'Backup verification failed. Check the file and password.',
      )
    } finally {
      setVerifying(false)
    }
  }

  async function restoreVerifiedBackup() {
    if (!verifiedPayload) return

    setMessage('')
    setError('')

    if (restorePhrase !== 'RESTORE') {
      setError(
        'Type RESTORE exactly before replacing your current financial data.',
      )
      return
    }

    setRestoring(true)

    const previousSettings =
      captureDurableSettingsBackup()

    let settingsRestoreAttempted =
      false

    try {
      if (verifiedPayload.settings) {
        settingsRestoreAttempted =
          true

        restoreDurableSettingsBackup(
          verifiedPayload.settings,
        )
      }

      // IndexedDB replacement is one transaction. It runs only after
      // durable settings have restored successfully.
      await replaceDatabaseSnapshot(
        verifiedPayload.data,
      )

      setMessage(
        verifiedPayload.settings
          ? 'Restore completed. Financial data and durable preferences were restored. Browser notification permission must be enabled again on this device.'
          : 'Financial data restored from a legacy backup. This older backup did not contain durable preferences, so current device preferences were left unchanged.',
      )

      window.setTimeout(() => {
        window.location.assign('/app')
      }, 700)
    } catch {
      let settingsRollbackFailed =
        false

      if (settingsRestoreAttempted) {
        try {
          restoreDurableSettingsBackup(
            previousSettings,
            {
              requireFreshNotificationPermission:
                false,
            },
          )
        } catch {
          settingsRollbackFailed =
            true
        }
      }

      setError(
        settingsRollbackFailed
          ? 'Restore stopped before Money Saathi could safely complete it. The financial database was not intentionally replaced, but some device preferences may need review before retrying.'
          : 'Restore failed safely. The financial database was not replaced, and prior durable preferences were restored.',
      )
    } finally {
      setRestoring(false)
    }
  }

  return (
    <AppShell>
      <div className="dashboard-container backup-page">
        <header className="backup-header">
          <p className="dashboard-eyebrow">
            Keep your local data portable
          </p>

          <h1>Backup & Restore</h1>

          <p>
            Create an encrypted copy of your Money Saathi
            financial records and durable preferences, or restore
            a previously verified backup.
          </p>
        </header>

        <div className="backup-security-note">
          Backups use AES-GCM-256 encryption with a key derived
          from your password using PBKDF2-SHA-256 and 600,000
          iterations. App Lock PIN/verifier/session data, alerts
          hidden for today, notification history and browser
          notification permission are deliberately not restored
          from backup files.
        </div>

        {message && (
          <div className="backup-message" role="status">
            {message}
          </div>
        )}

        {error && (
          <div className="backup-error" role="alert">
            {error}
          </div>
        )}

        <section className="backup-two-column">
          <article className="backup-panel">
            <div className="backup-panel-heading">
              <p className="dashboard-eyebrow">
                Export
              </p>
              <h2>Create encrypted backup</h2>
              <p>
                Use a password you can remember. Money Saathi
                cannot recover a forgotten backup password.
              </p>
            </div>

            <form
              className="backup-form"
              onSubmit={(event) =>
                void createBackup(event)
              }
            >
              <div className="backup-field">
                <label htmlFor="backup-password">
                  Backup password
                </label>

                <input
                  id="backup-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={backupPassword}
                  onChange={(event) =>
                    setBackupPassword(event.target.value)
                  }
                />
              </div>

              <div className="backup-field">
                <label htmlFor="backup-confirm">
                  Confirm password
                </label>

                <input
                  id="backup-confirm"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={backupConfirm}
                  onChange={(event) =>
                    setBackupConfirm(event.target.value)
                  }
                />
              </div>

              <button
                type="submit"
                className="backup-primary-button"
                disabled={creating}
              >
                {creating
                  ? 'Encrypting & verifying...'
                  : 'Create encrypted backup'}
              </button>
            </form>

            <div className="backup-facts">
              <span>Included</span>
              <p>
                Transactions, budgets, Regular Money, goals,
                savings, FDs, RDs, loans, financial schemes,
                business workspaces and business transactions,
                plus durable planning/preferences.
              </p>

              <span>Excluded</span>
              <p>
                App Lock PIN/verifier and browser session state.
              </p>
            </div>
          </article>

          <article className="backup-panel">
            <div className="backup-panel-heading">
              <p className="dashboard-eyebrow">
                Import
              </p>
              <h2>Verify a backup</h2>
              <p>
                Verification decrypts and validates the file
                without changing your current Money Saathi data.
              </p>
            </div>

            <form
              className="backup-form"
              onSubmit={(event) =>
                void verifyRestore(event)
              }
            >
              <div className="backup-field">
                <label htmlFor="restore-file">
                  Encrypted backup file
                </label>

                <input
                  id="restore-file"
                  type="file"
                  accept=".msaathi,application/json"
                  onChange={handleRestoreFile}
                />

                {restoreFile && (
                  <small>
                    {restoreFile.name}
                  </small>
                )}
              </div>

              <div className="backup-field">
                <label htmlFor="restore-password">
                  Backup password
                </label>

                <input
                  id="restore-password"
                  type="password"
                  autoComplete="current-password"
                  minLength={8}
                  value={restorePassword}
                  onChange={(event) =>
                    setRestorePassword(event.target.value)
                  }
                />
              </div>

              <button
                type="submit"
                className="backup-secondary-button"
                disabled={verifying}
              >
                {verifying
                  ? 'Verifying...'
                  : 'Verify backup'}
              </button>
            </form>
          </article>
        </section>

        {verifiedSummary && (
          <section className="backup-verified-panel">
            <div className="backup-verified-heading">
              <div>
                <p className="dashboard-eyebrow">
                  Verified backup
                </p>

                <h2>Review before restore</h2>
              </div>

              <span>
                Exported{' '}
                {formatExportedAt(
                  verifiedSummary.exportedAt,
                )}
              </span>
            </div>

            <div className="backup-summary-grid">
              <div>
                <span>Total records</span>
                <strong>
                  {verifiedSummary.totalRecords}
                </strong>
              </div>

              <div>
                <span>Transactions</span>
                <strong>
                  {verifiedSummary.transactions}
                </strong>
              </div>

              <div>
                <span>Budgets</span>
                <strong>
                  {verifiedSummary.budgets}
                </strong>
              </div>

              <div>
                <span>Regular Money</span>
                <strong>
                  {verifiedSummary.regularMoney}
                </strong>
              </div>

              <div>
                <span>Goals</span>
                <strong>
                  {verifiedSummary.goals}
                </strong>
              </div>

              <div>
                <span>Assets</span>
                <strong>
                  {verifiedSummary.savingsAccounts +
                    verifiedSummary.fixedDeposits +
                    verifiedSummary.recurringDeposits}
                </strong>
              </div>

              <div>
                <span>Loans</span>
                <strong>
                  {verifiedSummary.loans}
                </strong>
              </div>

              <div>
                <span>Schemes</span>
                <strong>
                  {verifiedSummary.financialSchemes}
                </strong>
              </div>

              <div>
                <span>Businesses</span>
                <strong>
                  {verifiedSummary.businessProfiles}
                </strong>
              </div>

              <div>
                <span>Business transactions</span>
                <strong>
                  {verifiedSummary.businessTransactions}
                </strong>
              </div>
            </div>

            <div className="backup-danger-zone">
              <h3>Replace current financial data</h3>

              <p>
                Restoring replaces all current financial records
                listed above.
                {verifiedPayload?.settings
                  ? ' Durable preferences, planning settings and verified loan reminders will also be restored. Browser notification permission must be enabled again on this device.'
                  : ' This is a legacy backup without durable settings, so current device preferences will remain unchanged.'}
                {' '}App Lock remains configured on this device.
              </p>

              <label htmlFor="restore-confirmation">
                Type <strong>RESTORE</strong> to continue
              </label>

              <input
                id="restore-confirmation"
                type="text"
                autoComplete="off"
                value={restorePhrase}
                onChange={(event) =>
                  setRestorePhrase(event.target.value)
                }
              />

              <button
                type="button"
                className="backup-danger-button"
                disabled={restoring}
                onClick={() =>
                  void restoreVerifiedBackup()
                }
              >
                {restoring
                  ? 'Restoring...'
                  : 'Restore verified backup'}
              </button>
            </div>
          </section>
        )}
      </div>
    </AppShell>
  )
}

export default BackupPage


