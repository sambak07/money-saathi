import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useState,
} from 'react'
import { useLocation } from 'react-router-dom'

import {
  getSecurityEventName,
  isAppLockEnabled,
  isSessionUnlocked,
  unlockSession,
  verifyAppPin,
} from './appLock'

import '../styles/security.css'

interface AppLockGateProps {
  children: ReactNode
}

function AppLockGate({
  children,
}: AppLockGateProps) {
  const location = useLocation()
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)
  const [, setRevision] = useState(0)

  useEffect(() => {
    const eventName = getSecurityEventName()

    function refreshSecurityState() {
      setRevision((current) => current + 1)
    }

    window.addEventListener(
      eventName,
      refreshSecurityState,
    )

    return () => {
      window.removeEventListener(
        eventName,
        refreshSecurityState,
      )
    }
  }, [])

  const protectedRoute =
    location.pathname === '/app' ||
    location.pathname.startsWith('/app/')

  const locked =
    protectedRoute &&
    isAppLockEnabled() &&
    !isSessionUnlocked()

  async function handleUnlock(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setError('')

    if (!/^\d{6}$/.test(pin)) {
      setError('Enter your six-digit PIN.')
      return
    }

    setChecking(true)

    try {
      const valid = await verifyAppPin(pin)

      if (!valid) {
        setError('That PIN is not correct.')
        setPin('')
        return
      }

      unlockSession()
      setPin('')
    } catch {
      setError(
        'Money Saathi could not verify the PIN on this device.',
      )
    } finally {
      setChecking(false)
    }
  }

  if (!locked) {
    return children
  }

  return (
    <main className="app-lock-screen">
      <section className="app-lock-card">
        <div className="app-lock-mark">
          MS
        </div>

        <p className="dashboard-eyebrow">
          Money Saathi
        </p>

        <h1>App locked</h1>

        <p className="app-lock-copy">
          Enter your six-digit PIN to open your financial
          information on this device.
        </p>

        <form
          className="app-lock-form"
          onSubmit={(event) =>
            void handleUnlock(event)
          }
        >
          <label htmlFor="app-lock-pin">
            PIN
          </label>

          <input
            id="app-lock-pin"
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            maxLength={6}
            pattern="[0-9]{6}"
            placeholder="••••••"
            value={pin}
            autoFocus
            onChange={(event) =>
              setPin(
                event.target.value
                  .replace(/\D/g, '')
                  .slice(0, 6),
              )
            }
          />

          {error && (
            <div
              className="app-lock-error"
              role="alert"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={checking}
          >
            {checking
              ? 'Checking...'
              : 'Unlock Money Saathi'}
          </button>
        </form>

        <p className="app-lock-footnote">
          Your PIN is not stored directly. Money Saathi stores
          only a one-way verifier on this device.
        </p>
      </section>
    </main>
  )
}

export default AppLockGate
