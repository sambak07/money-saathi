export type EmergencyTargetMonths =
  | 1
  | 3
  | 6
  | 9
  | 12

export interface FinancialSafetyPreference {
  targetMonths: EmergencyTargetMonths | null
}

const SAFETY_KEY =
  'money-saathi:financial-safety:v1'

const VALID_TARGETS =
  new Set<EmergencyTargetMonths>([
    1,
    3,
    6,
    9,
    12,
  ])

export const EMERGENCY_TARGET_OPTIONS: Array<{
  months: EmergencyTargetMonths
  label: string
  description: string
}> = [
  {
    months: 1,
    label: '1 month',
    description:
      'A smaller starting target when building a buffer gradually.',
  },
  {
    months: 3,
    label: '3 months',
    description:
      'A medium planning horizon for essential expenses.',
  },
  {
    months: 6,
    label: '6 months',
    description:
      'A longer planning horizon when you want more room for disruption.',
  },
  {
    months: 9,
    label: '9 months',
    description:
      'A larger cushion for highly variable or uncertain income.',
  },
  {
    months: 12,
    label: '12 months',
    description:
      'A full-year planning horizon for users who prefer a very large reserve.',
  },
]

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

export function sanitizeFinancialSafetyPreference(
  value: unknown,
): FinancialSafetyPreference {
  if (!isRecord(value)) {
    return {
      targetMonths: null,
    }
  }

  const targetMonths =
    typeof value.targetMonths === 'number' &&
    VALID_TARGETS.has(
      value.targetMonths as EmergencyTargetMonths,
    )
      ? (
          value.targetMonths as EmergencyTargetMonths
        )
      : null

  return {
    targetMonths,
  }
}

export function getFinancialSafetyPreference():
  FinancialSafetyPreference {
  const raw =
    localStorage.getItem(SAFETY_KEY)

  if (!raw) {
    return {
      targetMonths: null,
    }
  }

  try {
    return sanitizeFinancialSafetyPreference(
      JSON.parse(raw),
    )
  } catch {
    return {
      targetMonths: null,
    }
  }
}

export function saveFinancialSafetyPreference(
  preference: FinancialSafetyPreference,
): void {
  const sanitized =
    sanitizeFinancialSafetyPreference(
      preference,
    )

  localStorage.setItem(
    SAFETY_KEY,
    JSON.stringify(sanitized),
  )

  window.dispatchEvent(
    new Event(
      'money-saathi-financial-safety-change',
    ),
  )
}
