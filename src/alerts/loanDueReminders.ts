export type LoanReminderFrequency =
  | 'one-time'
  | 'monthly'

export interface LoanDueReminder {
  loanId: string
  amountChetrum: number
  nextDueDate: string
  frequency: LoanReminderFrequency
  enabled: boolean
  monthlyAnchorDay?: number
  updatedAt: number
}

export interface LoanReminderReference {
  loanId: string
  loanName: string
  amountChetrum: number
  nextDueDate: string
  frequency: LoanReminderFrequency
}

const STORAGE_KEY =
  'money-saathi:loan-due-reminders:v1'

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

function isIsoDate(
  value: unknown,
): value is string {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false
  }

  const [
    year,
    month,
    day,
  ] = value.split('-').map(Number)

  const date =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day,
      ),
    )

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() ===
      month - 1 &&
    date.getUTCDate() === day
  )
}

export function sanitizeLoanDueReminder(
  value: unknown,
): LoanDueReminder | null {
  if (!isRecord(value)) {
    return null
  }

  if (
    typeof value.loanId !== 'string' ||
    value.loanId.length === 0 ||
    !Number.isSafeInteger(
      value.amountChetrum,
    ) ||
    typeof value.amountChetrum !==
      'number' ||
    value.amountChetrum < 0 ||
    !isIsoDate(
      value.nextDueDate,
    ) ||
    (
      value.frequency !== 'one-time' &&
      value.frequency !== 'monthly'
    ) ||
    typeof value.enabled !== 'boolean' ||
    (
      value.monthlyAnchorDay !== undefined &&
      (
        typeof value.monthlyAnchorDay !== 'number' ||
        !Number.isInteger(
          value.monthlyAnchorDay,
        ) ||
        value.monthlyAnchorDay < 1 ||
        value.monthlyAnchorDay > 31
      )
    ) ||
    !Number.isSafeInteger(
      value.updatedAt,
    ) ||
    typeof value.updatedAt !== 'number' ||
    value.updatedAt < 0
  ) {
    return null
  }

  return {
    loanId: value.loanId,
    amountChetrum:
      value.amountChetrum,
    nextDueDate:
      value.nextDueDate,
    frequency:
      value.frequency,
    enabled: value.enabled,
    ...(
      value.monthlyAnchorDay === undefined
        ? {}
        : {
            monthlyAnchorDay:
              value.monthlyAnchorDay,
          }
    ),
    updatedAt: value.updatedAt,
  }
}

export function getLoanDueReminders():
  LoanDueReminder[] {
  const raw =
    localStorage.getItem(
      STORAGE_KEY,
    )

  if (!raw) {
    return []
  }

  try {
    const parsed: unknown =
      JSON.parse(raw)

    if (!Array.isArray(parsed)) {
      return []
    }

    const byLoan =
      new Map<
        string,
        LoanDueReminder
      >()

    for (const item of parsed) {
      const reminder =
        sanitizeLoanDueReminder(
          item,
        )

      if (!reminder) {
        continue
      }

      const current =
        byLoan.get(
          reminder.loanId,
        )

      if (
        !current ||
        reminder.updatedAt >=
          current.updatedAt
      ) {
        byLoan.set(
          reminder.loanId,
          reminder,
        )
      }
    }

    return Array.from(
      byLoan.values(),
    )
  } catch {
    return []
  }
}

export function saveLoanDueReminder(
  reminder: Omit<
    LoanDueReminder,
    'updatedAt'
  >,
): void {
  const existing =
    getLoanDueReminders()

  const monthlyAnchorDay =
    reminder.frequency === 'monthly'
      ? (
          reminder.monthlyAnchorDay ??
          Number(
            reminder.nextDueDate.slice(
              8,
              10,
            ),
          )
        )
      : undefined

  const next: LoanDueReminder = {
    ...reminder,
    ...(
      monthlyAnchorDay === undefined
        ? {}
        : {
            monthlyAnchorDay,
          }
    ),
    updatedAt: Date.now(),
  }

  const updated =
    existing.filter(
      (item) =>
        item.loanId !==
        reminder.loanId,
    )

  updated.push(next)

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(updated),
  )

  window.dispatchEvent(
    new Event(
      'money-saathi-loan-reminders-change',
    ),
  )
}

export function removeLoanDueReminder(
  loanId: string,
): void {
  const next =
    getLoanDueReminders()
      .filter(
        (item) =>
          item.loanId !== loanId,
      )

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(next),
  )

  window.dispatchEvent(
    new Event(
      'money-saathi-loan-reminders-change',
    ),
  )
}

export function clearLoanDueReminders(): void {
  localStorage.removeItem(
    STORAGE_KEY,
  )

  window.dispatchEvent(
    new Event(
      'money-saathi-loan-reminders-change',
    ),
  )

  window.dispatchEvent(
    new Event(
      'money-saathi-alerts-change',
    ),
  )
}

export function nextMonthlyDueDate(
  currentDueDate: string,
  anchorDay?: number,
): string {
  if (!isIsoDate(currentDueDate)) {
    throw new Error(
      'A valid due date is required.',
    )
  }

  const [
    year,
    month,
    day,
  ] = currentDueDate
    .split('-')
    .map(Number)

  const intendedDay =
    anchorDay ?? day

  if (
    !Number.isInteger(
      intendedDay,
    ) ||
    intendedDay < 1 ||
    intendedDay > 31
  ) {
    throw new Error(
      'Monthly reminder anchor day must be between 1 and 31.',
    )
  }

  const nextMonthStart =
    new Date(
      Date.UTC(
        year,
        month,
        1,
      ),
    )

  const nextYear =
    nextMonthStart
      .getUTCFullYear()

  const nextMonth =
    nextMonthStart
      .getUTCMonth()

  const lastDay =
    new Date(
      Date.UTC(
        nextYear,
        nextMonth + 1,
        0,
      ),
    ).getUTCDate()

  const safeDay =
    Math.min(
      intendedDay,
      lastDay,
    )

  return new Date(
    Date.UTC(
      nextYear,
      nextMonth,
      safeDay,
    ),
  )
    .toISOString()
    .slice(0, 10)
}

export function markLoanReminderPaid(
  reminder: LoanDueReminder,
): LoanDueReminder {
  if (
    reminder.frequency ===
    'monthly'
  ) {
    const monthlyAnchorDay =
      reminder.monthlyAnchorDay ??
      Number(
        reminder.nextDueDate.slice(
          8,
          10,
        ),
      )

    return {
      ...reminder,
      nextDueDate:
        nextMonthlyDueDate(
          reminder.nextDueDate,
          monthlyAnchorDay,
        ),
      monthlyAnchorDay,
      updatedAt: Date.now(),
    }
  }

  return {
    ...reminder,
    enabled: false,
    updatedAt: Date.now(),
  }
}

export function buildLoanReminderReferences(
  loans: Array<{
    id: string
    name: string
  }>,
  reminders: LoanDueReminder[],
): LoanReminderReference[] {
  const loanNames =
    new Map(
      loans.map(
        (loan) => [
          loan.id,
          loan.name,
        ],
      ),
    )

  return reminders
    .filter(
      (reminder) =>
        reminder.enabled &&
        loanNames.has(
          reminder.loanId,
        ),
    )
    .map(
      (reminder) => ({
        loanId:
          reminder.loanId,
        loanName:
          loanNames.get(
            reminder.loanId,
          ) ??
          'Loan',
        amountChetrum:
          reminder.amountChetrum,
        nextDueDate:
          reminder.nextDueDate,
        frequency:
          reminder.frequency,
      }),
    )
}
