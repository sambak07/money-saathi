import {
  useCallback,
  useEffect,
  useState,
} from 'react'
import {
  Link,
  useLocation,
} from 'react-router-dom'

import {
  getAcknowledgedAlertIds,
  getAlertPreferences,
} from '../alerts/alertPreferences'
import {
  buildAlertUniverseView,
  loadAlertUniverseData,
} from '../alerts/alertUniverse'
import {
  getLocalToday,
} from '../utils/money'

import '../styles/alert-badge.css'

interface AlertBadgeState {
  count: number
  urgent: number
}

const EMPTY_STATE:
  AlertBadgeState = {
    count: 0,
    urgent: 0,
  }

function AlertBadge() {
  const location =
    useLocation()

  const [state, setState] =
    useState<AlertBadgeState>(
      EMPTY_STATE,
    )

  const refresh =
    useCallback(
      async () => {
        try {
          const data =
            await loadAlertUniverseData()

          const today =
            getLocalToday()

          const alertPreferences =
            getAlertPreferences()

          const acknowledged =
            getAcknowledgedAlertIds(
              today,
            )

          const view =
            buildAlertUniverseView({
              today,
              dueSoonDays:
                alertPreferences.dueSoonDays,
              data,
              acknowledgedIds:
                acknowledged,
            })

          setState({
            count:
              view.visibleAlerts.length,
            urgent:
              view.counts.urgent,
          })
        } catch {
          setState(
            EMPTY_STATE,
          )
        }
      },
      [],
    )

  useEffect(() => {
    const timer =
      window.setTimeout(
        () => {
          void refresh()
        },
        0,
      )

    return () => {
      window.clearTimeout(
        timer,
      )
    }
  }, [
    location.pathname,
    refresh,
  ])

  useEffect(() => {
    function handleChange() {
      void refresh()
    }

    window.addEventListener(
      'focus',
      handleChange,
    )

    window.addEventListener(
      'money-saathi-alert-preferences-change',
      handleChange,
    )

    window.addEventListener(
      'money-saathi-loan-reminders-change',
      handleChange,
    )

    window.addEventListener(
      'money-saathi-alerts-change',
      handleChange,
    )

    window.addEventListener(
      'money-saathi-data-change',
      handleChange,
    )

    const interval =
      window.setInterval(
        handleChange,
        60 * 60 * 1000,
      )

    return () => {
      window.removeEventListener(
        'focus',
        handleChange,
      )

      window.removeEventListener(
        'money-saathi-alert-preferences-change',
        handleChange,
      )

      window.removeEventListener(
        'money-saathi-loan-reminders-change',
        handleChange,
      )

      window.removeEventListener(
        'money-saathi-alerts-change',
        handleChange,
      )

      window.removeEventListener(
        'money-saathi-data-change',
        handleChange,
      )

      window.clearInterval(
        interval,
      )
    }
  }, [refresh])

  const countLabel =
    state.count > 99
      ? '99+'
      : String(state.count)

  const ariaLabel =
    state.count === 0
      ? 'Alerts. No active reminders.'
      : state.urgent > 0
        ? `Alerts. ${state.count} active reminders, ${state.urgent} urgent.`
        : `Alerts. ${state.count} active reminders.`

  return (
    <Link
      to="/app/alerts"
      className={
        state.urgent > 0
          ? 'money-saathi-alert-badge urgent'
          : 'money-saathi-alert-badge'
      }
      aria-label={ariaLabel}
    >
      <span>Alerts</span>

      {state.count > 0 && (
        <strong
          aria-hidden="true"
        >
          {countLabel}
        </strong>
      )}
    </Link>
  )
}

export default AlertBadge

