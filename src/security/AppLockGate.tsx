import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useState,
} from 'react'
import { useLocation } from 'react-router-dom'

import {
  clearPinThrottle,
  getPinThrottleState,
  getSecurityEventName,
  isAppLockEnabled,
  isSessionUnlocked,
  recordFailedPinAttempt,
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
  const [, setThrottleRevision] =
    useState(0)

  const pinThrottle =
    getPinThrottleState()

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

  useEffect(() => {
    if (
      !pinThrottle.blocked ||
      !pinThrottle.blockedUntil
    ) {
      return
    }

    const delay =
      Math.max(
        0,
        pinThrottle.blockedUntil -
          Date.now(),
      ) + 50

    const timer =
      window.setTimeout(
        () => {
          setThrottleRevision(
            (current) =>
              current + 1,
          )
        },
        delay,
      )

    return () => {
      window.clearTimeout(
        timer,
      )
    }
  }, [
    pinThrottle.blocked,
    pinThrottle.blockedUntil,
  ])

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

    if (pinThrottle.blocked) {
      setError(
        'Too many incorrect attempts. Wait 30 seconds, then try again.',
      )
      return
    }

    if (!/^\d{6}$/.test(pin)) {
      setError('Enter your six-digit PIN.')
      return
    }

    setChecking(true)

    try {
      const valid = await verifyAppPin(pin)

      if (!valid) {
        const nextThrottle =
          recordFailedPinAttempt()

        setThrottleRevision(
          (current) =>
            current + 1,
        )

        setError(
          nextThrottle.blocked
            ? 'Too many incorrect attempts. Wait 30 seconds, then try again.'
            : `That PIN is not correct. ${nextThrottle.remainingAttempts} attempt${nextThrottle.remainingAttempts === 1 ? '' : 's'} left before a short cooldown.`,
        )
        setPin('')
        return
      }

      clearPinThrottle()
      setThrottleRevision(
        (current) =>
          current + 1,
      )
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
        <div
          className="app-lock-mark"
          aria-hidden="true"
        >
          <img
            src="/money-saathi-icon.svg"
            alt=""
          />
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
            disabled={
              checking ||
              pinThrottle.blocked
            }
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

        <p className="app-lock-footnote">
          Forgot the PIN? There is no email or OTP reset because
          Money Saathi has no account server. Clearing this site's
          browser data removes the local lock, but it also removes
          local financial records unless you have an encrypted
          backup.
        </p>
      </section>
    </main>
  )
}

export default AppLockGate
