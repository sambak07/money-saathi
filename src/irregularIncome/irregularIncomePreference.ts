export interface IrregularIncomePreference {
  planningFloorChetrum: number
}

const PREFERENCE_KEY =
  'money-saathi:irregular-income:v1'

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

export function sanitizeIrregularIncomePreference(
  value: unknown,
): IrregularIncomePreference {
  if (!isRecord(value)) {
    return {
      planningFloorChetrum: 0,
    }
  }

  const planningFloorChetrum =
    Number.isSafeInteger(
      value.planningFloorChetrum,
    ) &&
    typeof value.planningFloorChetrum ===
      'number' &&
    value.planningFloorChetrum >= 0
      ? value.planningFloorChetrum
      : 0

  return {
    planningFloorChetrum,
  }
}

export function getIrregularIncomePreference():
  IrregularIncomePreference {
  const raw =
    localStorage.getItem(PREFERENCE_KEY)

  if (!raw) {
    return {
      planningFloorChetrum: 0,
    }
  }

  try {
    return sanitizeIrregularIncomePreference(
      JSON.parse(raw),
    )
  } catch {
    return {
      planningFloorChetrum: 0,
    }
  }
}

export function saveIrregularIncomePreference(
  preference: IrregularIncomePreference,
): void {
  const sanitized =
    sanitizeIrregularIncomePreference(
      preference,
    )

  localStorage.setItem(
    PREFERENCE_KEY,
    JSON.stringify(sanitized),
  )

  window.dispatchEvent(
    new Event(
      'money-saathi-irregular-income-change',
    ),
  )
}
