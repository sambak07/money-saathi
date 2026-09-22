import {
  useEffect,
  useState,
} from 'react'

import {
  getAlertPreferences,
  getNotifiedAlertIds,
  isWithinQuietHours,
  markAlertIdsNotified,
} from '../alerts/alertPreferences'
import {
  getFinancialSchemes,
  getRegularMoney,
  getTransactions,
} from '../storage/db'
import {
  getPreferences,
} from '../settings/preferences'
import {
  buildMoneyAlerts,
} from '../utils/moneyAlerts'
import {
  getLocalToday,
} from '../utils/money'
import {
  calculateSafeToSpend,
} from '../utils/safeToSpend'
import {
  transactionBalanceChetrum,
} from '../utils/simpleHome'

async function showNotification(
  title: string,
  body: string,
): Promise<void> {
  if (
    !('Notification' in window) ||
    Notification.permission !== 'granted'
  ) {
    return
  }

  if (
    'serviceWorker' in navigator
  ) {
    const registration =
      await navigator.serviceWorker
        .getRegistration()

    if (registration) {
      await registration
        .showNotification(
          title,
          {
            body,
            icon:
              '/money-saathi-icon.svg',
            tag:
              'money-saathi-alerts',
          },
        )

      return
    }
  }

  new Notification(
    title,
    {
      body,
      icon:
        '/money-saathi-icon.svg',
      tag:
        'money-saathi-alerts',
    },
  )
}

function AlertNotifier() {
  const [
    preferenceVersion,
    setPreferenceVersion,
  ] = useState(0)

  useEffect(() => {
    function handlePreferenceChange() {
      setPreferenceVersion(
        (value) => value + 1,
      )
    }

    window.addEventListener(
      'money-saathi-alert-preferences-change',
      handlePreferenceChange,
    )

    return () => {
      window.removeEventListener(
        'money-saathi-alert-preferences-change',
        handlePreferenceChange,
      )
    }
  }, [])

  useEffect(() => {
    let active = true

    async function check() {
      const alertPreferences =
        getAlertPreferences()

      if (
        !alertPreferences.browserNotifications ||
        !('Notification' in window) ||
        Notification.permission !== 'granted'
      ) {
        return
      }

      const now =
        new Date()

      if (
        isWithinQuietHours(
          now.getHours(),
          now.getMinutes(),
          alertPreferences,
        )
      ) {
        return
      }

      try {
        const [
          regularMoney,
          transactions,
          schemes,
        ] = await Promise.all([
          getRegularMoney(),
          getTransactions(),
          getFinancialSchemes(),
        ])

        if (!active) return

        const today =
          getLocalToday()

        const recordedBalanceChetrum =
          transactionBalanceChetrum(
            transactions,
          )

        const preferences =
          getPreferences()

        const safe =
          calculateSafeToSpend(
            today,
            recordedBalanceChetrum,
            regularMoney,
            transactions,
            preferences.safetyBufferChetrum,
          )

        const alerts =
          buildMoneyAlerts({
            today,
            dueSoonDays:
              alertPreferences.dueSoonDays,
            regularMoney,
            transactions,
            schemes,
            recordedBalanceChetrum,
            safeToSpendChetrum:
              safe.safeToSpendChetrum,
            upcomingCommitmentsChetrum:
              safe.upcomingCommitmentsChetrum,
          })

        const notified =
          getNotifiedAlertIds()

        const eligible =
          alerts.filter(
            (alert) =>
              alert.notificationEligible &&
              (
                alert.status ===
                  'today' ||
                alert.status ===
                  'overdue'
              ) &&
              !notified.has(alert.id),
          )

        if (
          eligible.length === 0
        ) {
          return
        }

        const title =
          eligible.length === 1
            ? 'Money Saathi reminder'
            : `${eligible.length} Money Saathi reminders`

        const body =
          eligible.length === 1
            ? eligible[0].title
            : `${eligible[0].title} and ${eligible.length - 1} more need your attention.`

        await showNotification(
          title,
          body,
        )

        markAlertIdsNotified(
          eligible.map(
            (alert) => alert.id,
          ),
        )
      } catch {
        // Notification checks must never interrupt the app.
      }
    }

    void check()

    const interval =
      window.setInterval(
        () => {
          void check()
        },
        60 * 60 * 1000,
      )

    return () => {
      active = false
      window.clearInterval(
        interval,
      )
    }
  }, [preferenceVersion])

  return null
}

export default AlertNotifier
