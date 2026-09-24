import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import AppShell from '../components/AppShell'
import type {
  VaultEntry,
  VaultKind,
} from '../types/vault'
import {
  VAULT_KINDS,
} from '../types/vault'
import {
  buildVaultBackup,
  parseVaultBackupText,
  restoreVaultBackup,
  serializeVaultBackup,
} from '../vault/vaultBackup'
import {
  createVaultSecurity,
  decryptVaultRecord,
  encryptVaultEntry,
  maskVaultReference,
  unlockVaultKey,
  VAULT_MIN_PASSPHRASE_LENGTH,
} from '../vault/vaultCrypto'
import {
  changeVaultPassphrase,
  VaultCurrentPassphraseError,
} from '../vault/vaultRekey'
import {
  clearVaultSessionKey,
  getVaultSessionKey,
  setVaultSessionKey,
  VAULT_IDLE_LOCK_MS,
} from '../vault/vaultSession'
import {
  formatVaultUnlockCooldown,
  getVaultUnlockGuard,
  recordVaultUnlockFailure,
  resetVaultUnlockGuard,
} from '../vault/vaultUnlockGuard'
import {
  clearVaultStorage,
  deleteEncryptedVaultRecord,
  getEncryptedVaultRecords,
  getVaultConfig,
  saveVaultConfig,
  upsertEncryptedVaultRecord,
} from '../vault/vaultStore'

import '../styles/vault.css'

const kindLabels: Record<
  VaultKind,
  string
> = {
  account: 'Bank account',
  deposit: 'Deposit',
  loan: 'Loan',
  insurance: 'Insurance',
  investment: 'Investment / shares',
}

const referenceLabels: Record<
  VaultKind,
  string
> = {
  account: 'Account number',
  deposit: 'Deposit / certificate number',
  loan: 'Loan account number',
  insurance: 'Policy number',
  investment: 'Certificate / folio number',
}

interface EntryDraft {
  kind: VaultKind
  title: string
  institution: string
  referenceNumber: string
  importantDate: string
  notes: string
}

const emptyDraft: EntryDraft = {
  kind: 'account',
  title: '',
  institution: '',
  referenceNumber: '',
  importantDate: '',
  notes: '',
}

function VaultPage() {
  const [
    status,
    setStatus,
  ] = useState<
    'loading' |
    'setup' |
    'locked' |
    'unlocked'
  >('loading')

  const [
    entries,
    setEntries,
  ] = useState<VaultEntry[]>([])

  const [
    passphrase,
    setPassphrase,
  ] = useState('')

  const [
    confirmPassphrase,
    setConfirmPassphrase,
  ] = useState('')

  const [
    draft,
    setDraft,
  ] = useState<EntryDraft>(
    emptyDraft,
  )

  const [
    editingId,
    setEditingId,
  ] = useState<string | null>(
    null,
  )

  const [
    revealed,
    setRevealed,
  ] = useState<Set<string>>(
    new Set(),
  )

  const [
    pendingDeleteId,
    setPendingDeleteId,
  ] = useState<string | null>(
    null,
  )

  const [
    confirmErase,
    setConfirmErase,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState('')

  const [
    working,
    setWorking,
  ] = useState(false)

  const [
    currentVaultPassphrase,
    setCurrentVaultPassphrase,
  ] = useState('')

  const [
    newVaultPassphrase,
    setNewVaultPassphrase,
  ] = useState('')

  const [
    confirmNewVaultPassphrase,
    setConfirmNewVaultPassphrase,
  ] = useState('')

  const [
    passphraseChangeMessage,
    setPassphraseChangeMessage,
  ] = useState('')

  const [
    backupMessage,
    setBackupMessage,
  ] = useState('')

  const [
    restoreFile,
    setRestoreFile,
  ] = useState<File | null>(
    null,
  )

  const [
    restorePassphrase,
    setRestorePassphrase,
  ] = useState('')

  const [
    confirmRestore,
    setConfirmRestore,
  ] = useState(false)

  const groupedCount =
    useMemo(
      () =>
        VAULT_KINDS.reduce(
          (
            result,
            kind,
          ) => ({
            ...result,
            [kind]:
              entries.filter(
                (entry) =>
                  entry.kind ===
                  kind,
              ).length,
          }),
          {} as Record<
            VaultKind,
            number
          >,
        ),
      [entries],
    )

  async function loadEntries(
    key: CryptoKey,
  ) {
    const encrypted =
      await getEncryptedVaultRecords()

    const decrypted =
      await Promise.all(
        encrypted.map(
          (record) =>
            decryptVaultRecord(
              record,
              key,
            ),
        ),
      )

    setEntries(
      decrypted.sort(
        (a, b) =>
          b.updatedAt -
          a.updatedAt,
      ),
    )
  }

  useEffect(() => {
    let active = true

    async function initialise() {
      try {
        const config =
          await getVaultConfig()

        if (!active) {
          return
        }

        if (!config) {
          setStatus('setup')
          return
        }

        const sessionKey =
          getVaultSessionKey()

        if (!sessionKey) {
          setStatus('locked')
          return
        }

        await loadEntries(
          sessionKey,
        )

        if (active) {
          setStatus('unlocked')
        }
      } catch {
        if (active) {
          clearVaultSessionKey()
          setStatus('locked')
          setError(
            'Money Vault could not be opened safely. Your encrypted records were not changed.',
          )
        }
      }
    }

    void initialise()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (
      status !==
      'unlocked'
    ) {
      return
    }

    function lockForSecurity(
      reason: string,
    ) {
      clearVaultSessionKey()
      setEntries([])
      setRevealed(
        new Set(),
      )
      setDraft(
        emptyDraft,
      )
      setEditingId(null)
      setPendingDeleteId(null)
      setCurrentVaultPassphrase('')
      setNewVaultPassphrase('')
      setConfirmNewVaultPassphrase('')
      setPassphraseChangeMessage('')
      setStatus('locked')
      setError(reason)
    }

    let timer =
      window.setTimeout(
        () => {
          lockForSecurity(
            'Money Vault locked after 10 minutes of inactivity.',
          )
        },
        VAULT_IDLE_LOCK_MS,
      )

    function resetIdleTimer() {
      window.clearTimeout(
        timer,
      )

      timer =
        window.setTimeout(
          () => {
            lockForSecurity(
              'Money Vault locked after 10 minutes of inactivity.',
            )
          },
          VAULT_IDLE_LOCK_MS,
        )
    }

    function handleVisibilityChange() {
      if (
        document.visibilityState ===
        'hidden'
      ) {
        window.clearTimeout(
          timer,
        )

        lockForSecurity(
          'Money Vault locked because Money Saathi moved to the background.',
        )
      }
    }

    function handlePageHide() {
      clearVaultSessionKey()
    }

    window.addEventListener(
      'pointerdown',
      resetIdleTimer,
    )

    window.addEventListener(
      'keydown',
      resetIdleTimer,
    )

    window.addEventListener(
      'touchstart',
      resetIdleTimer,
    )

    document.addEventListener(
      'visibilitychange',
      handleVisibilityChange,
    )

    window.addEventListener(
      'pagehide',
      handlePageHide,
    )

    return () => {
      window.clearTimeout(
        timer,
      )

      window.removeEventListener(
        'pointerdown',
        resetIdleTimer,
      )

      window.removeEventListener(
        'keydown',
        resetIdleTimer,
      )

      window.removeEventListener(
        'touchstart',
        resetIdleTimer,
      )

      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange,
      )

      window.removeEventListener(
        'pagehide',
        handlePageHide,
      )
    }
  }, [status])

  function updateDraft(
    field: keyof EntryDraft,
    value: string,
  ) {
    setDraft(
      (current) => ({
        ...current,
        [field]: value,
      }),
    )
  }

  async function handleSetup() {
    setError('')

    if (
      passphrase.length <
      VAULT_MIN_PASSPHRASE_LENGTH
    ) {
      setError(
        `Use at least ${VAULT_MIN_PASSPHRASE_LENGTH} characters for your Vault passphrase.`,
      )
      return
    }

    if (
      passphrase !==
      confirmPassphrase
    ) {
      setError(
        'The two Vault passphrases do not match.',
      )
      return
    }

    setWorking(true)

    try {
      const {
        config,
        key,
      } =
        await createVaultSecurity(
          passphrase,
        )

      await saveVaultConfig(
        config,
      )

      setVaultSessionKey(
        key,
      )

      setPassphrase('')
      setConfirmPassphrase('')
      setStatus('unlocked')
      setEntries([])
    } catch {
      setError(
        'Money Vault could not be created on this device.',
      )
    } finally {
      setWorking(false)
    }
  }

  async function handleUnlock() {
    setError('')

    const guard =
      getVaultUnlockGuard()

    if (
      guard.blocked
    ) {
      setError(
        `Too many incorrect Vault passphrases. Try again in ${formatVaultUnlockCooldown(guard.remainingMs)}.`,
      )
      return
    }

    setWorking(true)

    try {
      const config =
        await getVaultConfig()

      if (!config) {
        setStatus('setup')
        return
      }

      let key: CryptoKey

      try {
        key =
          await unlockVaultKey(
            passphrase,
            config,
          )
      } catch {
        clearVaultSessionKey()

        const afterFailure =
          recordVaultUnlockFailure()

        if (
          afterFailure.blocked
        ) {
          setError(
            `Too many incorrect Vault passphrases. A temporary cooldown is active for ${formatVaultUnlockCooldown(afterFailure.remainingMs)}.`,
          )
        } else {
          setError(
            `That Vault passphrase is incorrect. ${afterFailure.failuresRemaining} attempt${afterFailure.failuresRemaining === 1 ? '' : 's'} remain before a temporary cooldown.`,
          )
        }

        return
      }

      resetVaultUnlockGuard()

      try {
        await loadEntries(
          key,
        )
      } catch {
        clearVaultSessionKey()
        setError(
          'The Vault passphrase was accepted, but one or more encrypted records could not be opened safely.',
        )
        return
      }

      setVaultSessionKey(
        key,
      )

      setPassphrase('')
      setStatus('unlocked')
    } finally {
      setWorking(false)
    }
  }

  function lockVault() {
    clearVaultSessionKey()
    setEntries([])
    setRevealed(
      new Set(),
    )
    setDraft(
      emptyDraft,
    )
    setEditingId(null)
    setPendingDeleteId(null)
    setCurrentVaultPassphrase('')
    setNewVaultPassphrase('')
    setConfirmNewVaultPassphrase('')
    setPassphraseChangeMessage('')
    setStatus('locked')
  }

  function startEdit(
    entry: VaultEntry,
  ) {
    setDraft({
      kind: entry.kind,
      title: entry.title,
      institution:
        entry.institution,
      referenceNumber:
        entry.referenceNumber,
      importantDate:
        entry.importantDate,
      notes: entry.notes,
    })

    setEditingId(
      entry.id,
    )

    setError('')

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setDraft(
      emptyDraft,
    )
    setError('')
  }

  async function saveEntry() {
    setError('')

    if (
      draft.title.trim().length === 0
    ) {
      setError(
        'Give this Vault record a clear name.',
      )
      return
    }

    const key =
      getVaultSessionKey()

    if (!key) {
      lockVault()
      setError(
        'Money Vault locked before this record could be saved.',
      )
      return
    }

    setWorking(true)

    try {
      const existing =
        editingId
          ? entries.find(
              (entry) =>
                entry.id ===
                editingId,
            )
          : undefined

      const now =
        Date.now()

      const entry: VaultEntry = {
        id:
          existing?.id ??
          crypto.randomUUID(),
        kind: draft.kind,
        title:
          draft.title.trim(),
        institution:
          draft.institution.trim(),
        referenceNumber:
          draft.referenceNumber.trim(),
        importantDate:
          draft.importantDate,
        notes:
          draft.notes.trim(),
        createdAt:
          existing?.createdAt ??
          now,
        updatedAt: now,
      }

      const encrypted =
        await encryptVaultEntry(
          entry,
          key,
        )

      await upsertEncryptedVaultRecord(
        encrypted,
      )

      await loadEntries(
        key,
      )

      setDraft(
        emptyDraft,
      )
      setEditingId(null)
    } catch {
      setError(
        'This Vault record could not be saved safely.',
      )
    } finally {
      setWorking(false)
    }
  }

  async function confirmDelete(
    id: string,
  ) {
    const key =
      getVaultSessionKey()

    if (!key) {
      lockVault()
      return
    }

    setWorking(true)

    try {
      await deleteEncryptedVaultRecord(
        id,
      )

      await loadEntries(
        key,
      )

      setPendingDeleteId(
        null,
      )
    } catch {
      setError(
        'The Vault record could not be deleted.',
      )
    } finally {
      setWorking(false)
    }
  }

  async function eraseVault() {
    setWorking(true)
    setError('')

    try {
      await clearVaultStorage()
      clearVaultSessionKey()
      setEntries([])
      setPassphrase('')
      setConfirmPassphrase('')
      setConfirmErase(false)
      setStatus('setup')
    } catch {
      setError(
        'Money Vault could not be erased.',
      )
    } finally {
      setWorking(false)
    }
  }

  async function handleChangeVaultPassphrase() {
    setError('')
    setPassphraseChangeMessage('')

    if (
      !currentVaultPassphrase
    ) {
      setError(
        'Enter your current Vault passphrase.',
      )
      return
    }

    if (
      newVaultPassphrase.length <
      VAULT_MIN_PASSPHRASE_LENGTH
    ) {
      setError(
        `Use at least ${VAULT_MIN_PASSPHRASE_LENGTH} characters for the new Vault passphrase.`,
      )
      return
    }

    if (
      newVaultPassphrase !==
      confirmNewVaultPassphrase
    ) {
      setError(
        'The two new Vault passphrases do not match.',
      )
      return
    }

    if (
      currentVaultPassphrase ===
      newVaultPassphrase
    ) {
      setError(
        'Choose a new Vault passphrase that is different from the current one.',
      )
      return
    }

    const guard =
      getVaultUnlockGuard()

    if (
      guard.blocked
    ) {
      setError(
        `Vault passphrase verification is temporarily locked. Try again in ${formatVaultUnlockCooldown(guard.remainingMs)}.`,
      )
      return
    }

    setWorking(true)

    try {
      let nextKey: CryptoKey

      try {
        nextKey =
          await changeVaultPassphrase(
            currentVaultPassphrase,
            newVaultPassphrase,
          )
      } catch (changeError) {
        if (
          changeError instanceof
          VaultCurrentPassphraseError
        ) {
          const afterFailure =
            recordVaultUnlockFailure()

          if (
            afterFailure.blocked
          ) {
            setError(
              `The current Vault passphrase is incorrect. A temporary cooldown is active for ${formatVaultUnlockCooldown(afterFailure.remainingMs)}.`,
            )
          } else {
            setError(
              `The current Vault passphrase is incorrect. ${afterFailure.failuresRemaining} attempt${afterFailure.failuresRemaining === 1 ? '' : 's'} remain before a temporary cooldown.`,
            )
          }

          return
        }

        throw changeError
      }

      resetVaultUnlockGuard()
      setVaultSessionKey(
        nextKey,
      )

      setCurrentVaultPassphrase('')
      setNewVaultPassphrase('')
      setConfirmNewVaultPassphrase('')

      setPassphraseChangeMessage(
        'Vault passphrase changed. Existing Vault records were re-encrypted with the new passphrase. Older exported Vault backups still require the passphrase that protected them, so create a fresh backup when convenient.',
      )
    } catch {
      setError(
        'Money Vault could not change the passphrase safely. The existing stored Vault was kept unless the atomic replacement completed successfully.',
      )
    } finally {
      setWorking(false)
    }
  }

  async function exportVaultBackup() {
    setBackupMessage('')
    setError('')

    try {
      const envelope =
        await buildVaultBackup()

      const text =
        serializeVaultBackup(
          envelope,
        )

      const blob =
        new Blob(
          [text],
          {
            type: 'application/json',
          },
        )

      const url =
        URL.createObjectURL(
          blob,
        )

      const anchor =
        document.createElement(
          'a',
        )

      const date =
        envelope.exportedAt
          .slice(0, 10)

      anchor.href = url
      anchor.download =
        `money-saathi-vault-${date}.json`

      document.body.appendChild(
        anchor,
      )

      anchor.click()
      anchor.remove()

      URL.revokeObjectURL(
        url,
      )

      setBackupMessage(
        'Encrypted Vault backup created. Keep the file and your Vault passphrase separately.',
      )
    } catch {
      setError(
        'Money Vault backup could not be created.',
      )
    }
  }

  async function importVaultBackup() {
    setBackupMessage('')
    setError('')

    if (
      !restoreFile
    ) {
      setError(
        'Choose a Money Vault backup file first.',
      )
      return
    }

    if (
      !restorePassphrase
    ) {
      setError(
        'Enter the passphrase that protects this Vault backup.',
      )
      return
    }

    if (
      !confirmRestore
    ) {
      setError(
        'Confirm that restoring will replace the Vault currently stored in this browser.',
      )
      return
    }

    setWorking(true)

    try {
      const text =
        await restoreFile.text()

      const envelope =
        parseVaultBackupText(
          text,
        )

      const key =
        await restoreVaultBackup(
          envelope,
          restorePassphrase,
        )

      setVaultSessionKey(
        key,
      )

      await loadEntries(
        key,
      )

      setRestoreFile(null)
      setRestorePassphrase('')
      setConfirmRestore(false)
      setPassphrase('')
      setStatus('unlocked')
      setBackupMessage(
        'Encrypted Vault backup restored and verified.',
      )
    } catch {
      clearVaultSessionKey()
      setError(
        'That backup could not be restored. Check the file and its Vault passphrase.',
      )
    } finally {
      setWorking(false)
    }
  }

  function toggleReveal(
    id: string,
  ) {
    setRevealed(
      (current) => {
        const next =
          new Set(current)

        if (
          next.has(id)
        ) {
          next.delete(id)
        } else {
          next.add(id)
        }

        return next
      },
    )
  }

  return (
    <AppShell>
      <div className="dashboard-container vault-page">
        <header className="vault-header">
          <div>
            <p className="dashboard-eyebrow">
              Private financial memory
            </p>

            <h1>Money Vault</h1>

            <p>
              Keep important financial reference details encrypted
              on this device. Money Vault is separate from your
              everyday transaction records, locks after 10 minutes
              without activity and locks when Money Saathi moves
              to the background.
            </p>
          </div>

          {status === 'unlocked' && (
            <button
              type="button"
              className="vault-lock-button"
              onClick={lockVault}
            >
              Lock Vault
            </button>
          )}
        </header>

        <section
          className="vault-boundary"
          aria-label="Money Vault safety boundary"
        >
          <strong>
            Never store passwords or authentication secrets here.
          </strong>

          <span>
            Do not enter ATM or card PINs, CVVs, OTPs, internet-banking
            passwords, seed phrases, security answers or recovery codes.
          </span>
        </section>

        {status === 'loading' && (
          <div
            className="vault-state-card"
            role="status"
          >
            Opening Money Vault…
          </div>
        )}

        {status === 'setup' && (
          <section className="vault-state-card">
            <p className="dashboard-eyebrow">
              First-time setup
            </p>

            <h2>
              Create a separate Vault passphrase
            </h2>

            <p>
              This is not your 6-digit App Lock PIN. Your passphrase
              derives a non-extractable AES-256 encryption key and is
              not stored by Money Saathi.
            </p>

            <div className="vault-passphrase-grid">
              <label>
                Vault passphrase
                <input
                  type="password"
                  autoComplete="new-password"
                  value={passphrase}
                  onChange={(event) =>
                    setPassphrase(
                      event.target.value,
                    )
                  }
                />
              </label>

              <label>
                Confirm passphrase
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassphrase}
                  onChange={(event) =>
                    setConfirmPassphrase(
                      event.target.value,
                    )
                  }
                />
              </label>
            </div>

            <p className="vault-help">
              Minimum {VAULT_MIN_PASSPHRASE_LENGTH} characters.
              There is no email, OTP or cloud recovery if you forget it.
            </p>

            {error && (
              <div
                className="vault-error"
                role="alert"
              >
                {error}
              </div>
            )}

            <button
              type="button"
              className="vault-primary-button"
              disabled={working}
              onClick={() => {
                void handleSetup()
              }}
            >
              {working
                ? 'Creating Vault…'
                : 'Create encrypted Vault'}
            </button>
          </section>
        )}

        {status === 'locked' && (
          <section className="vault-state-card">
            <p className="dashboard-eyebrow">
              Locked
            </p>

            <h2>
              Unlock Money Vault
            </h2>

            <p>
              Enter your Vault passphrase. The encryption key exists
              only in memory while this Money Saathi session is open.
            </p>

            <label className="vault-single-field">
              Vault passphrase
              <input
                type="password"
                autoComplete="current-password"
                autoFocus
                value={passphrase}
                onChange={(event) => {
                  setPassphrase(
                    event.target.value,
                  )
                  setError('')
                }}
                onKeyDown={(event) => {
                  if (
                    event.key === 'Enter' &&
                    !working
                  ) {
                    void handleUnlock()
                  }
                }}
              />
            </label>

            {error && (
              <div
                className="vault-error"
                role="alert"
              >
                {error}
              </div>
            )}

            <div className="vault-state-actions">
              <button
                type="button"
                className="vault-primary-button"
                disabled={working}
                onClick={() => {
                  void handleUnlock()
                }}
              >
                {working
                  ? 'Unlocking…'
                  : 'Unlock Vault'}
              </button>

              {!confirmErase ? (
                <button
                  type="button"
                  className="vault-text-button danger"
                  onClick={() =>
                    setConfirmErase(
                      true,
                    )
                  }
                >
                  Forgot passphrase?
                </button>
              ) : (
                <div className="vault-erase-confirm">
                  <p>
                    There is no recovery. Erasing removes the encrypted
                    Vault records from this browser so you can create a
                    new Vault.
                  </p>

                  <button
                    type="button"
                    className="vault-danger-button"
                    disabled={working}
                    onClick={() => {
                      void eraseVault()
                    }}
                  >
                    Yes, erase encrypted Vault
                  </button>

                  <button
                    type="button"
                    className="vault-text-button"
                    disabled={working}
                    onClick={() =>
                      setConfirmErase(
                        false,
                      )
                    }
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {(status === 'setup' || status === 'locked') && (
          <section className="vault-backup-card vault-recovery-card">
            <p className="dashboard-eyebrow">
              Recovery
            </p>

            <h2>
              Restore encrypted Vault backup
            </h2>

            <p className="vault-backup-intro">
              If you previously exported Money Vault, choose that
              encrypted file and enter the passphrase that protected it.
            </p>

            <div className="vault-restore-box">
              <label>
                Vault backup file
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={(event) => {
                    setRestoreFile(
                      event.target.files?.[0] ??
                      null,
                    )
                    setConfirmRestore(false)
                    setBackupMessage('')
                    setError('')
                  }}
                />
              </label>

              <label>
                Backup Vault passphrase
                <input
                  type="password"
                  autoComplete="current-password"
                  value={restorePassphrase}
                  onChange={(event) => {
                    setRestorePassphrase(
                      event.target.value,
                    )
                    setError('')
                  }}
                />
              </label>

              <label className="vault-restore-confirm">
                <input
                  type="checkbox"
                  checked={confirmRestore}
                  onChange={(event) =>
                    setConfirmRestore(
                      event.target.checked,
                    )
                  }
                />

                <span>
                  I understand this replaces the Vault currently
                  stored in this browser.
                </span>
              </label>

              <button
                type="button"
                className="vault-danger-button"
                disabled={working}
                onClick={() => {
                  void importVaultBackup()
                }}
              >
                {working
                  ? 'Restoring…'
                  : 'Restore and replace Vault'}
              </button>
            </div>

            {backupMessage && (
              <div
                className="vault-success"
                role="status"
              >
                {backupMessage}
              </div>
            )}
          </section>
        )}

        {status === 'unlocked' && (
          <>
            <section className="vault-summary">
              {VAULT_KINDS.map(
                (kind) => (
                  <div
                    key={kind}
                    className="vault-summary-item"
                  >
                    <span>
                      {kindLabels[kind]}
                    </span>
                    <strong>
                      {groupedCount[kind]}
                    </strong>
                  </div>
                ),
              )}
            </section>

            <section className="vault-form-card">
              <div className="vault-section-heading">
                <div>
                  <p className="dashboard-eyebrow">
                    {editingId
                      ? 'Edit record'
                      : 'Add record'}
                  </p>

                  <h2>
                    {editingId
                      ? 'Update Vault record'
                      : 'Remember something important'}
                  </h2>
                </div>

                {editingId && (
                  <button
                    type="button"
                    className="vault-text-button"
                    onClick={cancelEdit}
                  >
                    Cancel edit
                  </button>
                )}
              </div>

              <div className="vault-form-grid">
                <label>
                  Type
                  <select
                    value={draft.kind}
                    onChange={(event) =>
                      updateDraft(
                        'kind',
                        event.target.value as
                          VaultKind,
                      )
                    }
                  >
                    {VAULT_KINDS.map(
                      (kind) => (
                        <option
                          key={kind}
                          value={kind}
                        >
                          {kindLabels[kind]}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label>
                  Name
                  <input
                    type="text"
                    maxLength={120}
                    placeholder="Example: Salary account"
                    value={draft.title}
                    onChange={(event) =>
                      updateDraft(
                        'title',
                        event.target.value,
                      )
                    }
                  />
                </label>

                <label>
                  Institution
                  <input
                    type="text"
                    maxLength={120}
                    placeholder="Bank, insurer or company"
                    value={draft.institution}
                    onChange={(event) =>
                      updateDraft(
                        'institution',
                        event.target.value,
                      )
                    }
                  />
                </label>

                <label>
                  {referenceLabels[
                    draft.kind
                  ]}
                  <input
                    type="text"
                    maxLength={180}
                    autoComplete="off"
                    value={draft.referenceNumber}
                    onChange={(event) =>
                      updateDraft(
                        'referenceNumber',
                        event.target.value,
                      )
                    }
                  />
                </label>

                <label>
                  Important date
                  <input
                    type="date"
                    value={draft.importantDate}
                    onChange={(event) =>
                      updateDraft(
                        'importantDate',
                        event.target.value,
                      )
                    }
                  />
                </label>

                <label className="vault-notes-field">
                  Notes
                  <textarea
                    maxLength={1500}
                    rows={4}
                    placeholder="Useful non-secret information"
                    value={draft.notes}
                    onChange={(event) =>
                      updateDraft(
                        'notes',
                        event.target.value,
                      )
                    }
                  />
                </label>
              </div>

              {error && (
                <div
                  className="vault-error"
                  role="alert"
                >
                  {error}
                </div>
              )}

              <div className="vault-form-actions">
                <button
                  type="button"
                  className="vault-primary-button"
                  disabled={working}
                  onClick={() => {
                    void saveEntry()
                  }}
                >
                  {working
                    ? 'Saving…'
                    : editingId
                      ? 'Save changes'
                      : 'Save to Vault'}
                </button>
              </div>
            </section>

            <section className="vault-records-card">
              <div className="vault-section-heading">
                <div>
                  <p className="dashboard-eyebrow">
                    Encrypted records
                  </p>

                  <h2>
                    Your Vault
                  </h2>
                </div>

                <span className="vault-record-count">
                  {entries.length}
                  {' '}
                  {entries.length === 1
                    ? 'record'
                    : 'records'}
                </span>
              </div>

              {entries.length === 0 ? (
                <div className="vault-empty">
                  <strong>
                    Your Vault is empty.
                  </strong>

                  <p>
                    Add only financial reference information you would
                    reasonably keep in a personal financial file.
                  </p>
                </div>
              ) : (
                <div className="vault-record-list">
                  {entries.map(
                    (entry) => {
                      const isRevealed =
                        revealed.has(
                          entry.id,
                        )

                      const deleting =
                        pendingDeleteId ===
                        entry.id

                      return (
                        <article
                          key={entry.id}
                          className="vault-record"
                        >
                          <div className="vault-record-top">
                            <div>
                              <span className="vault-kind-chip">
                                {kindLabels[
                                  entry.kind
                                ]}
                              </span>

                              <h3>
                                {entry.title}
                              </h3>

                              {entry.institution && (
                                <p>
                                  {entry.institution}
                                </p>
                              )}
                            </div>

                            <button
                              type="button"
                              className="vault-text-button"
                              onClick={() =>
                                startEdit(
                                  entry,
                                )
                              }
                            >
                              Edit
                            </button>
                          </div>

                          <dl className="vault-record-details">
                            <div>
                              <dt>
                                {referenceLabels[
                                  entry.kind
                                ]}
                              </dt>
                              <dd>
                                <span>
                                  {isRevealed
                                    ? (
                                      entry.referenceNumber ||
                                      'Not recorded'
                                    )
                                    : maskVaultReference(
                                        entry.referenceNumber,
                                      )}
                                </span>

                                {entry.referenceNumber && (
                                  <button
                                    type="button"
                                    className="vault-reveal-button"
                                    onClick={() =>
                                      toggleReveal(
                                        entry.id,
                                      )
                                    }
                                  >
                                    {isRevealed
                                      ? 'Hide'
                                      : 'Reveal'}
                                  </button>
                                )}
                              </dd>
                            </div>

                            <div>
                              <dt>
                                Important date
                              </dt>
                              <dd>
                                {entry.importantDate ||
                                  'Not recorded'}
                              </dd>
                            </div>
                          </dl>

                          {entry.notes && (
                            <p className="vault-record-notes">
                              {entry.notes}
                            </p>
                          )}

                          <div className="vault-record-footer">
                            {!deleting ? (
                              <button
                                type="button"
                                className="vault-text-button danger"
                                onClick={() =>
                                  setPendingDeleteId(
                                    entry.id,
                                  )
                                }
                              >
                                Delete
                              </button>
                            ) : (
                              <div className="vault-delete-confirm">
                                <span>
                                  Delete this encrypted record?
                                </span>

                                <button
                                  type="button"
                                  className="vault-danger-button compact"
                                  disabled={working}
                                  onClick={() => {
                                    void confirmDelete(
                                      entry.id,
                                    )
                                  }}
                                >
                                  Delete
                                </button>

                                <button
                                  type="button"
                                  className="vault-text-button"
                                  disabled={working}
                                  onClick={() =>
                                    setPendingDeleteId(
                                      null,
                                    )
                                  }
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                          </div>
                        </article>
                      )
                    },
                  )}
                </div>
              )}
            </section>

            <section className="vault-backup-card">
              <div className="vault-section-heading">
                <div>
                  <p className="dashboard-eyebrow">
                    Security
                  </p>

                  <h2>
                    Change Vault passphrase
                  </h2>
                </div>
              </div>

              <p className="vault-backup-intro">
                Changing the passphrase verifies your current
                passphrase, decrypts every Vault record in memory,
                creates a fresh encryption key and replaces the
                encrypted Vault atomically. Existing exported Vault
                backups keep their original passphrases.
              </p>

              <div className="vault-restore-box">
                <label>
                  Current Vault passphrase
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={currentVaultPassphrase}
                    onChange={(event) => {
                      setCurrentVaultPassphrase(
                        event.target.value,
                      )
                      setPassphraseChangeMessage('')
                      setError('')
                    }}
                  />
                </label>

                <label>
                  New Vault passphrase
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={newVaultPassphrase}
                    onChange={(event) => {
                      setNewVaultPassphrase(
                        event.target.value,
                      )
                      setPassphraseChangeMessage('')
                      setError('')
                    }}
                  />
                </label>

                <label>
                  Confirm new Vault passphrase
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={confirmNewVaultPassphrase}
                    onChange={(event) => {
                      setConfirmNewVaultPassphrase(
                        event.target.value,
                      )
                      setPassphraseChangeMessage('')
                      setError('')
                    }}
                  />
                </label>

                <button
                  type="button"
                  className="vault-primary-button"
                  disabled={working}
                  onClick={() => {
                    void handleChangeVaultPassphrase()
                  }}
                >
                  {working
                    ? 'Changing…'
                    : 'Change Vault passphrase'}
                </button>
              </div>

              {passphraseChangeMessage && (
                <div
                  className="vault-success"
                  role="status"
                >
                  {passphraseChangeMessage}
                </div>
              )}
            </section>

            <section className="vault-backup-card">
              <div className="vault-section-heading">
                <div>
                  <p className="dashboard-eyebrow">
                    Resilience
                  </p>

                  <h2>
                    Encrypted Vault backup
                  </h2>
                </div>
              </div>

              <p className="vault-backup-intro">
                Money Saathi's normal backup does not include Money
                Vault in this stage. Use this separate encrypted Vault
                backup and keep the file away from the passphrase.
              </p>

              <div className="vault-backup-actions">
                <button
                  type="button"
                  className="vault-primary-button"
                  onClick={() => {
                    void exportVaultBackup()
                  }}
                >
                  Export encrypted Vault
                </button>
              </div>

              <div className="vault-restore-box">
                <h3>
                  Restore encrypted Vault
                </h3>

                <p>
                  Restoring verifies every encrypted record before
                  replacing the Vault currently stored in this browser.
                </p>

                <label>
                  Vault backup file
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={(event) => {
                      setRestoreFile(
                        event.target.files?.[0] ??
                        null,
                      )
                      setConfirmRestore(false)
                      setBackupMessage('')
                      setError('')
                    }}
                  />
                </label>

                <label>
                  Backup Vault passphrase
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={restorePassphrase}
                    onChange={(event) => {
                      setRestorePassphrase(
                        event.target.value,
                      )
                      setError('')
                    }}
                  />
                </label>

                <label className="vault-restore-confirm">
                  <input
                    type="checkbox"
                    checked={confirmRestore}
                    onChange={(event) =>
                      setConfirmRestore(
                        event.target.checked,
                      )
                    }
                  />

                  <span>
                    I understand this replaces the Vault currently
                    stored in this browser.
                  </span>
                </label>

                <button
                  type="button"
                  className="vault-danger-button"
                  disabled={working}
                  onClick={() => {
                    void importVaultBackup()
                  }}
                >
                  {working
                    ? 'Restoring…'
                    : 'Restore and replace Vault'}
                </button>
              </div>

              {backupMessage && (
                <div
                  className="vault-success"
                  role="status"
                >
                  {backupMessage}
                </div>
              )}
            </section>

            <section className="vault-ai-boundary">
              <strong>
                Saathi cannot read Money Vault
              </strong>

              <p>
                Money Vault stays outside Saathi's local question
                tools. Saathi does not decrypt, inspect or use Vault
                records.
              </p>
            </section>
          </>
        )}
      </div>
    </AppShell>
  )
}

export default VaultPage