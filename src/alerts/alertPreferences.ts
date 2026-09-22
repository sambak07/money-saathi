export type AlertDueSoonDays =
  | 3
  | 7
  | 14

export interface AlertPreferences {
  dueSoonDays: AlertDueSoonDays
  browserNotifications: boolean
  quietHoursEnabled: boolean
  quietStart: string
  quietEnd: string
}

const PREFERENCE_KEY =
  'money-saathi:alert-preferences:v1'

const ACKNOWLEDGED_KEY =
  'money-saathi:alert-acknowledged:v1'

const NOTIFIED_KEY =
  'money-saathi:alert-notified:v1'

export const DEFAULT_ALERT_PREFERENCES:
  AlertPreferences = {
    dueSoonDays: 7,
    browserNotifications: false,
    quietHoursEnabled: true,
    quietStart: '21:00',
    quietEnd: '07:00',
  }

const VALID_DUE_SOON =
  new Set<AlertDueSoonDays>([
    3,
    7,
    14,
  ])

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

function validTime(
  value: unknown,
): value is string {
  return (
    typeof value === 'string' &&
    /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(
      value,
    )
  )
}

export function sanitizeAlertPreferences(
  value: unknown,
): AlertPreferences {
  if (!isRecord(value)) {
    return {
      ...DEFAULT_ALERT_PREFERENCES,
    }
  }

  const dueSoonDays =
    typeof value.dueSoonDays === 'number' &&
    VALID_DUE_SOON.has(
      value.dueSoonDays as AlertDueSoonDays,
    )
      ? (
          value.dueSoonDays as AlertDueSoonDays
        )
      : DEFAULT_ALERT_PREFERENCES.dueSoonDays

  return {
    dueSoonDays,
    browserNotifications:
      value.browserNotifications === true,
    quietHoursEnabled:
      value.quietHoursEnabled !== false,
    quietStart:
      validTime(value.quietStart)
        ? value.quietStart
        : DEFAULT_ALERT_PREFERENCES.quietStart,
    quietEnd:
      validTime(value.quietEnd)
        ? value.quietEnd
        : DEFAULT_ALERT_PREFERENCES.quietEnd,
  }
}

export function getAlertPreferences():
  AlertPreferences {
  const raw =
    localStorage.getItem(PREFERENCE_KEY)

  if (!raw) {
    return {
      ...DEFAULT_ALERT_PREFERENCES,
    }
  }

  try {
    return sanitizeAlertPreferences(
      JSON.parse(raw),
    )
  } catch {
    return {
      ...DEFAULT_ALERT_PREFERENCES,
    }
  }
}

export function saveAlertPreferences(
  preferences: AlertPreferences,
): void {
  const sanitized =
    sanitizeAlertPreferences(
      preferences,
    )

  localStorage.setItem(
    PREFERENCE_KEY,
    JSON.stringify(sanitized),
  )

  window.dispatchEvent(
    new Event(
      'money-saathi-alert-preferences-change',
    ),
  )
}

interface AcknowledgedState {
  date: string
  ids: string[]
}

export function getAcknowledgedAlertIds(
  today: string,
): Set<string> {
  const raw =
    localStorage.getItem(
      ACKNOWLEDGED_KEY,
    )

  if (!raw) {
    return new Set()
  }

  try {
    const parsed: unknown =
      JSON.parse(raw)

    if (
      !isRecord(parsed) ||
      parsed.date !== today ||
      !Array.isArray(parsed.ids)
    ) {
      return new Set()
    }

    return new Set(
      parsed.ids.filter(
        (id): id is string =>
          typeof id === 'string',
      ),
    )
  } catch {
    return new Set()
  }
}

export function acknowledgeAlertForToday(
  alertId: string,
  today: string,
): void {
  const ids =
    getAcknowledgedAlertIds(today)

  ids.add(alertId)

  const state: AcknowledgedState = {
    date: today,
    ids: Array.from(ids).slice(-200),
  }

  localStorage.setItem(
    ACKNOWLEDGED_KEY,
    JSON.stringify(state),
  )

  window.dispatchEvent(
    new Event(
      'money-saathi-alerts-change',
    ),
  )
}

export function getNotifiedAlertIds():
  Set<string> {
  const raw =
    localStorage.getItem(NOTIFIED_KEY)

  if (!raw) {
    return new Set()
  }

  try {
    const parsed: unknown =
      JSON.parse(raw)

    if (!Array.isArray(parsed)) {
      return new Set()
    }

    return new Set(
      parsed.filter(
        (id): id is string =>
          typeof id === 'string',
      ),
    )
  } catch {
    return new Set()
  }
}

export function markAlertIdsNotified(
  alertIds: string[],
): void {
  const ids =
    getNotifiedAlertIds()

  for (const id of alertIds) {
    ids.add(id)
  }

  localStorage.setItem(
    NOTIFIED_KEY,
    JSON.stringify(
      Array.from(ids).slice(-500),
    ),
  )
}

function timeToMinutes(
  value: string,
): number {
  const [
    hour,
    minute,
  ] = value.split(':').map(Number)

  return hour * 60 + minute
}

export function isWithinQuietHours(
  hour: number,
  minute: number,
  preferences: AlertPreferences,
): boolean {
  if (!preferences.quietHoursEnabled) {
    return false
  }

  const now =
    hour * 60 + minute

  const start =
    timeToMinutes(
      preferences.quietStart,
    )

  const end =
    timeToMinutes(
      preferences.quietEnd,
    )

  if (start === end) {
    return false
  }

  if (start < end) {
    return (
      now >= start &&
      now < end
    )
  }

  return (
    now >= start ||
    now < end
  )
}

