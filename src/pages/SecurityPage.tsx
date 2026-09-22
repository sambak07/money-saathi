import {
  type FormEvent,
  useState,
} from 'react'

import AppShell from '../components/AppShell'
import {
  changeAppPin,
  disableAppLock,
  enableAppLock,
  isAppLockEnabled,
  isValidAppPin,
  lockSession,
} from '../security/appLock'

import '../styles/security.css'

function SecurityPage() {
  const [enabled, setEnabled] =
    useState(() => isAppLockEnabled())

  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')

  const [currentPin, setCurrentPin] = useState('')
  const [replacementPin, setReplacementPin] = useState('')
  const [replacementConfirm, setReplacementConfirm] =
    useState('')

  const [disablePin, setDisablePin] = useState('')

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [working, setWorking] = useState(false)

  function cleanPin(value: string): string {
    return value
      .replace(/\D/g, '')
      .slice(0, 6)
  }

  async function handleEnable(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setMessage('')
    setError('')

    if (!isValidAppPin(newPin)) {
      setError(
        'Choose a six-digit numeric PIN.',
      )
      return
    }

    if (newPin !== confirmPin) {
      setError('The two PIN entries do not match.')
      return
    }

    setWorking(true)

    try {
      await enableAppLock(newPin)

      setEnabled(true)
      setNewPin('')
      setConfirmPin('')
      setMessage(
        'App Lock is enabled. This tab remains unlocked until you lock it or close the tab.',
      )
    } catch {
      setError(
        'Money Saathi could not enable App Lock.',
      )
    } finally {
      setWorking(false)
    }
  }

  async function handleChangePin(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setMessage('')
    setError('')

    if (!isValidAppPin(currentPin)) {
      setError('Enter your current six-digit PIN.')
      return
    }

    if (!isValidAppPin(replacementPin)) {
      setError(
        'Choose a new six-digit numeric PIN.',
      )
      return
    }

    if (replacementPin !== replacementConfirm) {
      setError('The new PIN entries do not match.')
      return
    }

    if (currentPin === replacementPin) {
      setError(
        'Choose a new PIN that is different from the current PIN.',
      )
      return
    }

    setWorking(true)

    try {
      const changed = await changeAppPin(
        currentPin,
        replacementPin,
      )

      if (!changed) {
        setError('The current PIN is not correct.')
        return
      }

      setCurrentPin('')
      setReplacementPin('')
      setReplacementConfirm('')
      setMessage('Your App Lock PIN has been changed.')
    } catch {
      setError(
        'Money Saathi could not change the PIN.',
      )
    } finally {
      setWorking(false)
    }
  }

  async function handleDisable(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setMessage('')
    setError('')

    if (!isValidAppPin(disablePin)) {
      setError('Enter your current six-digit PIN.')
      return
    }

    setWorking(true)

    try {
      const disabled =
        await disableAppLock(disablePin)

      if (!disabled) {
        setError('The current PIN is not correct.')
        return
      }

      setEnabled(false)
      setDisablePin('')
      setMessage('App Lock has been disabled.')
    } catch {
      setError(
        'Money Saathi could not disable App Lock.',
      )
    } finally {
      setWorking(false)
    }
  }

  return (
    <AppShell>
      <div className="dashboard-container security-page">
        <header className="security-header">
          <p className="dashboard-eyebrow">
            Privacy on this device
          </p>

          <h1>App Lock</h1>

          <p>
            Protect casual access to Money Saathi with a
            six-digit PIN. The PIN itself is never stored.
          </p>
        </header>

        <div className="security-warning">
          <strong>Important:</strong> App Lock is a local privacy
          barrier, not full database encryption. A person with
          advanced access to your browser profile could still
          manipulate local site data. Encrypted backup protection
          is a separate stage.
        </div>

        {message && (
          <div
            className="security-message"
            role="status"
          >
            {message}
          </div>
        )}

        {error && (
          <div
            className="security-error"
            role="alert"
          >
            {error}
          </div>
        )}

        <section className="security-status-card">
          <div>
            <span>Status</span>

            <strong>
              {enabled
                ? 'App Lock is on'
                : 'App Lock is off'}
            </strong>

            <p>
              {enabled
                ? 'A new browser tab or session will require your PIN before opening app pages.'
                : 'Anyone who can open this browser profile can currently open Money Saathi.'}
            </p>
          </div>

          <div
            className={
              enabled
                ? 'security-status-dot enabled'
                : 'security-status-dot'
            }
          >
            {enabled ? 'ON' : 'OFF'}
          </div>
        </section>

        {!enabled ? (
          <section className="security-panel">
            <div className="security-panel-heading">
              <p className="dashboard-eyebrow">
                Set up protection
              </p>
              <h2>Create your App Lock PIN</h2>
              <p>
                Use six digits that are not easy for another
                person to guess.
              </p>
            </div>

            <form
              className="security-form"
              onSubmit={(event) =>
                void handleEnable(event)
              }
            >
              <div className="security-field">
                <label htmlFor="new-app-pin">
                  New PIN
                </label>

                <input
                  id="new-app-pin"
                  type="password"
                  inputMode="numeric"
                  autoComplete="new-password"
                  maxLength={6}
                  pattern="[0-9]{6}"
                  placeholder="Six digits"
                  value={newPin}
                  onChange={(event) =>
                    setNewPin(
                      cleanPin(event.target.value),
                    )
                  }
                />
              </div>

              <div className="security-field">
                <label htmlFor="confirm-app-pin">
                  Confirm PIN
                </label>

                <input
                  id="confirm-app-pin"
                  type="password"
                  inputMode="numeric"
                  autoComplete="new-password"
                  maxLength={6}
                  pattern="[0-9]{6}"
                  placeholder="Repeat six digits"
                  value={confirmPin}
                  onChange={(event) =>
                    setConfirmPin(
                      cleanPin(event.target.value),
                    )
                  }
                />
              </div>

              <button
                type="submit"
                className="security-primary-button"
                disabled={working}
              >
                {working
                  ? 'Enabling...'
                  : 'Enable App Lock'}
              </button>
            </form>
          </section>
        ) : (
          <>
            <section className="security-panel">
              <div className="security-panel-heading">
                <p className="dashboard-eyebrow">
                  Quick privacy
                </p>
                <h2>Lock this session</h2>
                <p>
                  Lock Money Saathi now without closing the
                  browser tab.
                </p>
              </div>

              <div className="security-single-action">
                <button
                  type="button"
                  className="security-primary-button"
                  onClick={() => lockSession()}
                >
                  Lock Money Saathi now
                </button>
              </div>
            </section>

            <section className="security-panel">
              <div className="security-panel-heading">
                <p className="dashboard-eyebrow">
                  Change protection
                </p>
                <h2>Change PIN</h2>
              </div>

              <form
                className="security-form three"
                onSubmit={(event) =>
                  void handleChangePin(event)
                }
              >
                <div className="security-field">
                  <label htmlFor="current-app-pin">
                    Current PIN
                  </label>

                  <input
                    id="current-app-pin"
                    type="password"
                    inputMode="numeric"
                    autoComplete="current-password"
                    maxLength={6}
                    value={currentPin}
                    onChange={(event) =>
                      setCurrentPin(
                        cleanPin(event.target.value),
                      )
                    }
                  />
                </div>

                <div className="security-field">
                  <label htmlFor="replacement-app-pin">
                    New PIN
                  </label>

                  <input
                    id="replacement-app-pin"
                    type="password"
                    inputMode="numeric"
                    autoComplete="new-password"
                    maxLength={6}
                    value={replacementPin}
                    onChange={(event) =>
                      setReplacementPin(
                        cleanPin(event.target.value),
                      )
                    }
                  />
                </div>

                <div className="security-field">
                  <label htmlFor="replacement-confirm-pin">
                    Confirm new PIN
                  </label>

                  <input
                    id="replacement-confirm-pin"
                    type="password"
                    inputMode="numeric"
                    autoComplete="new-password"
                    maxLength={6}
                    value={replacementConfirm}
                    onChange={(event) =>
                      setReplacementConfirm(
                        cleanPin(event.target.value),
                      )
                    }
                  />
                </div>

                <button
                  type="submit"
                  className="security-primary-button"
                  disabled={working}
                >
                  {working
                    ? 'Saving...'
                    : 'Change PIN'}
                </button>
              </form>
            </section>

            <section className="security-panel danger-panel">
              <div className="security-panel-heading">
                <p className="dashboard-eyebrow">
                  Remove protection
                </p>
                <h2>Disable App Lock</h2>
                <p>
                  Your financial records remain on the device,
                  but Money Saathi will stop asking for a PIN.
                </p>
              </div>

              <form
                className="security-form disable"
                onSubmit={(event) =>
                  void handleDisable(event)
                }
              >
                <div className="security-field">
                  <label htmlFor="disable-app-pin">
                    Current PIN
                  </label>

                  <input
                    id="disable-app-pin"
                    type="password"
                    inputMode="numeric"
                    autoComplete="current-password"
                    maxLength={6}
                    value={disablePin}
                    onChange={(event) =>
                      setDisablePin(
                        cleanPin(event.target.value),
                      )
                    }
                  />
                </div>

                <button
                  type="submit"
                  className="security-danger-button"
                  disabled={working}
                >
                  {working
                    ? 'Disabling...'
                    : 'Disable App Lock'}
                </button>
              </form>
            </section>
          </>
        )}

        <section className="security-facts">
          <article>
            <span>PIN storage</span>
            <strong>One-way verifier</strong>
            <p>
              Money Saathi derives a verifier using PBKDF2 with
              SHA-256 and a random salt.
            </p>
          </article>

          <article>
            <span>Iterations</span>
            <strong>600,000</strong>
            <p>
              The PIN derivation deliberately requires repeated
              cryptographic work.
            </p>
          </article>

          <article>
            <span>Recovery</span>
            <strong>No PIN recovery</strong>
            <p>
              Money Saathi does not know your PIN and cannot send
              it to a server because no server account exists.
            </p>
          </article>
        </section>
      </div>
    </AppShell>
  )
}

export default SecurityPage
