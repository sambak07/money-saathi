export type ReportTrendMonths = 3 | 6 | 12
export type DashboardRecentCount = 3 | 5 | 8

export interface MoneySaathiPreferences {
  displayName: string
  reportTrendMonths: ReportTrendMonths
  dashboardRecentCount: DashboardRecentCount
}

const PREFERENCES_KEY = 'money-saathi:preferences:v1'

export const DEFAULT_PREFERENCES: MoneySaathiPreferences = {
  displayName: '',
  reportTrendMonths: 6,
  dashboardRecentCount: 5,
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

function validReportMonths(
  value: unknown,
): value is ReportTrendMonths {
  return value === 3 || value === 6 || value === 12
}

function validRecentCount(
  value: unknown,
): value is DashboardRecentCount {
  return value === 3 || value === 5 || value === 8
}

export function sanitizePreferences(
  value: unknown,
): MoneySaathiPreferences {
  if (!isRecord(value)) {
    return { ...DEFAULT_PREFERENCES }
  }

  const displayName =
    typeof value.displayName === 'string'
      ? value.displayName.trim().slice(0, 50)
      : DEFAULT_PREFERENCES.displayName

  return {
    displayName,
    reportTrendMonths: validReportMonths(
      value.reportTrendMonths,
    )
      ? value.reportTrendMonths
      : DEFAULT_PREFERENCES.reportTrendMonths,
    dashboardRecentCount: validRecentCount(
      value.dashboardRecentCount,
    )
      ? value.dashboardRecentCount
      : DEFAULT_PREFERENCES.dashboardRecentCount,
  }
}

export function getPreferences(): MoneySaathiPreferences {
  const raw = localStorage.getItem(PREFERENCES_KEY)

  if (!raw) {
    return { ...DEFAULT_PREFERENCES }
  }

  try {
    return sanitizePreferences(JSON.parse(raw))
  } catch {
    return { ...DEFAULT_PREFERENCES }
  }
}

export function savePreferences(
  preferences: MoneySaathiPreferences,
): void {
  const sanitized = sanitizePreferences(preferences)

  localStorage.setItem(
    PREFERENCES_KEY,
    JSON.stringify(sanitized),
  )

  window.dispatchEvent(
    new Event('money-saathi-preferences-change'),
  )
}

export function resetPreferences(): void {
  localStorage.removeItem(PREFERENCES_KEY)

  window.dispatchEvent(
    new Event('money-saathi-preferences-change'),
  )
}
