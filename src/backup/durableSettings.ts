import {
  getAlertPreferences,
  saveAlertPreferences,
  sanitizeAlertPreferences,
  type AlertPreferences,
} from '../alerts/alertPreferences'
import {
  getLoanDueReminders,
  removeLoanDueReminder,
  saveLoanDueReminder,
  sanitizeLoanDueReminder,
  type LoanDueReminder,
} from '../alerts/loanDueReminders'
import {
  getIrregularIncomePreference,
  saveIrregularIncomePreference,
  sanitizeIrregularIncomePreference,
  type IrregularIncomePreference,
} from '../irregularIncome/irregularIncomePreference'
import {
  getProfile,
  saveProfile,
  sanitizeProfile,
  type MoneySaathiProfile,
} from '../profile/userProfile'
import {
  getFinancialSafetyPreference,
  saveFinancialSafetyPreference,
  sanitizeFinancialSafetyPreference,
  type FinancialSafetyPreference,
} from '../safety/financialSafetyPreference'
import {
  getPreferences,
  savePreferences,
  sanitizePreferences,
  type MoneySaathiPreferences,
} from '../settings/preferences'

export interface DurableSettingsBackup {
  preferences: MoneySaathiPreferences
  profile: MoneySaathiProfile
  financialSafety: FinancialSafetyPreference
  irregularIncome: IrregularIncomePreference
  alertPreferences: AlertPreferences
  loanDueReminders: LoanDueReminder[]
}

const EXPECTED_KEYS = [
  'preferences',
  'profile',
  'financialSafety',
  'irregularIncome',
  'alertPreferences',
  'loanDueReminders',
] as const

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

function sameJson(
  left: unknown,
  right: unknown,
): boolean {
  return (
    JSON.stringify(left) ===
    JSON.stringify(right)
  )
}

function hasExactKeys(
  value: Record<string, unknown>,
): boolean {
  const keys =
    Object.keys(value).sort()

  const expected =
    [...EXPECTED_KEYS].sort()

  return (
    keys.length ===
      expected.length &&
    keys.every(
      (key, index) =>
        key === expected[index],
    )
  )
}

export function captureDurableSettingsBackup():
  DurableSettingsBackup {
  return {
    preferences:
      getPreferences(),
    profile:
      getProfile(),
    financialSafety:
      getFinancialSafetyPreference(),
    irregularIncome:
      getIrregularIncomePreference(),
    alertPreferences:
      getAlertPreferences(),
    loanDueReminders:
      getLoanDueReminders(),
  }
}

export function isValidDurableSettingsBackup(
  value: unknown,
): value is DurableSettingsBackup {
  if (
    !isRecord(value) ||
    !hasExactKeys(value)
  ) {
    return false
  }

  if (
    !sameJson(
      sanitizePreferences(
        value.preferences,
      ),
      value.preferences,
    )
  ) {
    return false
  }

  if (
    !sameJson(
      sanitizeProfile(
        value.profile,
      ),
      value.profile,
    )
  ) {
    return false
  }

  if (
    !sameJson(
      sanitizeFinancialSafetyPreference(
        value.financialSafety,
      ),
      value.financialSafety,
    )
  ) {
    return false
  }

  if (
    !sameJson(
      sanitizeIrregularIncomePreference(
        value.irregularIncome,
      ),
      value.irregularIncome,
    )
  ) {
    return false
  }

  if (
    !sameJson(
      sanitizeAlertPreferences(
        value.alertPreferences,
      ),
      value.alertPreferences,
    )
  ) {
    return false
  }

  if (
    !Array.isArray(
      value.loanDueReminders,
    )
  ) {
    return false
  }

  const loanIds =
    new Set<string>()

  for (
    const item of
      value.loanDueReminders
  ) {
    const sanitized =
      sanitizeLoanDueReminder(
        item,
      )

    if (
      !sanitized ||
      !sameJson(
        sanitized,
        item,
      ) ||
      loanIds.has(
        sanitized.loanId,
      )
    ) {
      return false
    }

    loanIds.add(
      sanitized.loanId,
    )
  }

  return true
}

export interface RestoreDurableSettingsOptions {
  requireFreshNotificationPermission?: boolean
}

export function restoreDurableSettingsBackup(
  snapshot: DurableSettingsBackup,
  options: RestoreDurableSettingsOptions = {},
): void {
  if (
    !isValidDurableSettingsBackup(
      snapshot,
    )
  ) {
    throw new Error(
      'Durable settings backup is invalid.',
    )
  }

  savePreferences(
    snapshot.preferences,
  )

  saveProfile(
    snapshot.profile,
  )

  saveFinancialSafetyPreference(
    snapshot.financialSafety,
  )

  saveIrregularIncomePreference(
    snapshot.irregularIncome,
  )

  // Browser notification permission is controlled by the device/browser.
  // Restore the reminder policy but require a fresh notification opt-in.
  saveAlertPreferences({
    ...snapshot.alertPreferences,
    browserNotifications:
      options.requireFreshNotificationPermission === false
        ? snapshot.alertPreferences.browserNotifications
        : false,
  })

  const currentLoanReminders =
    getLoanDueReminders()

  for (
    const reminder of
      currentLoanReminders
  ) {
    removeLoanDueReminder(
      reminder.loanId,
    )
  }

  for (
    const reminder of
      snapshot.loanDueReminders
  ) {
    saveLoanDueReminder({
      loanId:
        reminder.loanId,
      amountChetrum:
        reminder.amountChetrum,
      nextDueDate:
        reminder.nextDueDate,
      frequency:
        reminder.frequency,
      enabled:
        reminder.enabled,
    })
  }

  window.dispatchEvent(
    new Event(
      'money-saathi-alerts-change',
    ),
  )
}
