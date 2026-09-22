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

const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER)

export type TimelineKind =
  | 'income'
  | 'expense'

export interface MoneyTimelineItem {
  id: string
  sourceId: string
  kind: TimelineKind
  name: string
  category: string
  amountChetrum: number
  date: string
}

export interface SchemeTimelineReference {
  id: string
  name: string
  provider: string
  amountChetrum: number
  date: string
}

export interface MoneyTimelineResult {
  startDate: string
  endDate: string
  items: MoneyTimelineItem[]
  expectedIncomeChetrum: number
  expectedExpenseChetrum: number
  schemeReferences: SchemeTimelineReference[]
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

function addDaysIso(
  dateText: string,
  days: number,
): string {
  const [year, month, day] =
    dateText.split('-').map(Number)

  const date = new Date(
    Date.UTC(year, month - 1, day),
  )

  date.setUTCDate(
    date.getUTCDate() + days,
  )

  return date.toISOString().slice(0, 10)
}

function recordedOccurrenceKeys(
  transactions: MoneyTransaction[],
): Set<string> {
  const keys = new Set<string>()

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

function addTotal(
  total: bigint,
  amountChetrum: number,
  label: string,
): bigint {
  assertMoney(amountChetrum, label)

  const next =
    total + BigInt(amountChetrum)

  if (next > MAX_SAFE) {
    throw new Error(
      `${label} total exceeds the supported money range.`,
    )
  }

  return next
}

export function buildMoneyTimeline(
  today: string,
  daysAhead: number,
  regularMoney: RegularMoney[],
  transactions: MoneyTransaction[],
  schemes: FinancialScheme[],
): MoneyTimelineResult {
  if (
    !Number.isSafeInteger(daysAhead) ||
    daysAhead < 0 ||
    daysAhead > 366
  ) {
    throw new Error(
      'Timeline range must be between 0 and 366 days.',
    )
  }

  const endDate =
    addDaysIso(today, daysAhead)

  const recordedKeys =
    recordedOccurrenceKeys(transactions)

  const items: MoneyTimelineItem[] = []

  let expectedIncome = 0n
  let expectedExpense = 0n

  for (const schedule of regularMoney) {
    assertMoney(
      schedule.amountChetrum,
      'Regular Money amount',
    )

    const dates =
      generateOccurrencesBetween(
        schedule,
        today,
        endDate,
      )

    for (const date of dates) {
      if (
        recordedKeys.has(
          `${schedule.id}|${date}`,
        )
      ) {
        continue
      }

      items.push({
        id: `${schedule.id}|${date}`,
        sourceId: schedule.id,
        kind: schedule.kind,
        name: schedule.name,
        category: schedule.category,
        amountChetrum:
          schedule.amountChetrum,
        date,
      })

      if (schedule.kind === 'income') {
        expectedIncome = addTotal(
          expectedIncome,
          schedule.amountChetrum,
          'Expected income',
        )
      } else {
        expectedExpense = addTotal(
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

    return a.name.localeCompare(b.name)
  })

  const schemeReferences =
    schemes
      .filter(
        (scheme) =>
          scheme.status === 'active' &&
          scheme.nextContributionDate &&
          scheme.nextContributionDate >= today &&
          scheme.nextContributionDate <= endDate &&
          scheme.contributionChetrum > 0,
      )
      .map((scheme) => {
        assertMoney(
          scheme.contributionChetrum,
          'Scheme contribution',
        )

        return {
          id: scheme.id,
          name: scheme.name,
          provider: scheme.provider,
          amountChetrum:
            scheme.contributionChetrum,
          date:
            scheme.nextContributionDate,
        }
      })
      .sort((a, b) =>
        a.date.localeCompare(b.date),
      )

  return {
    startDate: today,
    endDate,
    items,
    expectedIncomeChetrum:
      Number(expectedIncome),
    expectedExpenseChetrum:
      Number(expectedExpense),
    schemeReferences,
  }
}

export function timelineDateLabel(
  today: string,
  date: string,
): string {
  if (date === today) {
    return 'Today'
  }

  if (date === addDaysIso(today, 1)) {
    return 'Tomorrow'
  }

  return date
}
