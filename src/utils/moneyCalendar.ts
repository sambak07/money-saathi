import type {
  FinancialScheme,
} from '../types/scheme'
import type {
  RegularMoney,
} from '../types/regularMoney'
import type {
  MoneyTransaction,
} from '../types/transaction'
import {
  generateOccurrencesBetween,
} from './recurrence'

const MAX_SAFE =
  BigInt(Number.MAX_SAFE_INTEGER)

export type CalendarMoneyKind =
  | 'income'
  | 'expense'

export interface CalendarMoneyItem {
  id: string
  sourceId: string
  date: string
  name: string
  category: string
  kind: CalendarMoneyKind
  amountChetrum: number
}

export interface CalendarSchemeReference {
  id: string
  date: string
  name: string
  provider: string
  amountChetrum: number
}

export interface MoneyCalendarMonth {
  month: string
  startDate: string
  endDate: string
  items: CalendarMoneyItem[]
  expectedIncomeChetrum: number
  expectedExpenseChetrum: number
  schemeReferences: CalendarSchemeReference[]
}

function assertMoney(
  value: number,
  label: string,
): void {
  if (
    !Number.isSafeInteger(value) ||
    value < 0
  ) {
    throw new Error(
      `${label} must be a non-negative safe integer.`,
    )
  }
}

function addMoney(
  total: bigint,
  value: number,
  label: string,
): bigint {
  assertMoney(value, label)

  const next =
    total + BigInt(value)

  if (next > MAX_SAFE) {
    throw new Error(
      `${label} total exceeds the supported money range.`,
    )
  }

  return next
}

export function getCalendarMonthBounds(
  month: string,
): {
  startDate: string
  endDate: string
} {
  if (
    !/^\d{4}-\d{2}$/.test(month)
  ) {
    throw new Error(
      'Calendar month must use YYYY-MM format.',
    )
  }

  const [
    year,
    monthNumber,
  ] = month.split('-').map(Number)

  if (
    monthNumber < 1 ||
    monthNumber > 12
  ) {
    throw new Error(
      'Calendar month is invalid.',
    )
  }

  const lastDay =
    new Date(
      Date.UTC(
        year,
        monthNumber,
        0,
      ),
    ).getUTCDate()

  return {
    startDate:
      `${month}-01`,
    endDate:
      `${month}-${String(
        lastDay,
      ).padStart(2, '0')}`,
  }
}

export function shiftCalendarMonth(
  month: string,
  offset: number,
): string {
  if (
    !Number.isSafeInteger(offset)
  ) {
    throw new Error(
      'Calendar month offset must be a safe integer.',
    )
  }

  const {
    startDate,
  } = getCalendarMonthBounds(month)

  const [
    year,
    monthNumber,
  ] = startDate
    .slice(0, 7)
    .split('-')
    .map(Number)

  const date =
    new Date(
      Date.UTC(
        year,
        monthNumber - 1 + offset,
        1,
      ),
    )

  return date
    .toISOString()
    .slice(0, 7)
}

function recordedOccurrenceKeys(
  transactions: MoneyTransaction[],
): Set<string> {
  const keys =
    new Set<string>()

  for (const transaction of transactions) {
    if (
      transaction.recurringSourceId &&
      transaction.scheduledFor
    ) {
      keys.add(
        `${transaction.recurringSourceId}|${transaction.scheduledFor}`,
      )
    }
  }

  return keys
}

export function buildMoneyCalendarMonth(
  month: string,
  regularMoney: RegularMoney[],
  transactions: MoneyTransaction[],
  schemes: FinancialScheme[],
): MoneyCalendarMonth {
  const {
    startDate,
    endDate,
  } = getCalendarMonthBounds(month)

  const recordedKeys =
    recordedOccurrenceKeys(
      transactions,
    )

  const items:
    CalendarMoneyItem[] = []

  let expectedIncome = 0n
  let expectedExpense = 0n

  for (const schedule of regularMoney) {
    const dates =
      generateOccurrencesBetween(
        schedule,
        startDate,
        endDate,
      )

    for (const date of dates) {
      const occurrenceKey =
        `${schedule.id}|${date}`

      if (
        recordedKeys.has(
          occurrenceKey,
        )
      ) {
        continue
      }

      const item: CalendarMoneyItem = {
        id: occurrenceKey,
        sourceId: schedule.id,
        date,
        name: schedule.name,
        category: schedule.category,
        kind: schedule.kind,
        amountChetrum:
          schedule.amountChetrum,
      }

      items.push(item)

      if (
        schedule.kind === 'income'
      ) {
        expectedIncome =
          addMoney(
            expectedIncome,
            schedule.amountChetrum,
            'Expected income',
          )
      } else {
        expectedExpense =
          addMoney(
            expectedExpense,
            schedule.amountChetrum,
            'Expected expense',
          )
      }
    }
  }

  items.sort((a, b) => {
    const dateComparison =
      a.date.localeCompare(b.date)

    if (dateComparison !== 0) {
      return dateComparison
    }

    if (a.kind !== b.kind) {
      return a.kind === 'expense'
        ? -1
        : 1
    }

    return a.name.localeCompare(
      b.name,
    )
  })

  const schemeReferences =
    schemes
      .filter(
        (scheme) =>
          scheme.status === 'active' &&
          Boolean(
            scheme.nextContributionDate,
          ) &&
          scheme.nextContributionDate >=
            startDate &&
          scheme.nextContributionDate <=
            endDate &&
          scheme.contributionChetrum > 0,
      )
      .map((scheme) => {
        assertMoney(
          scheme.contributionChetrum,
          'Scheme contribution',
        )

        return {
          id: scheme.id,
          date:
            scheme.nextContributionDate,
          name: scheme.name,
          provider:
            scheme.provider,
          amountChetrum:
            scheme.contributionChetrum,
        }
      })
      .sort((a, b) =>
        a.date.localeCompare(
          b.date,
        ),
      )

  return {
    month,
    startDate,
    endDate,
    items,
    expectedIncomeChetrum:
      Number(expectedIncome),
    expectedExpenseChetrum:
      Number(expectedExpense),
    schemeReferences,
  }
}

export function groupCalendarItemsByDate(
  items: CalendarMoneyItem[],
): Array<[
  string,
  CalendarMoneyItem[],
]> {
  const groups =
    new Map<
      string,
      CalendarMoneyItem[]
    >()

  for (const item of items) {
    const current =
      groups.get(item.date) ?? []

    current.push(item)
    groups.set(
      item.date,
      current,
    )
  }

  return Array.from(
    groups.entries(),
  )
}
