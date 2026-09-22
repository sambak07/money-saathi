import type {
  RegularMoney,
} from '../types/regularMoney'
import type {
  MoneyTransaction,
} from '../types/transaction'
import {
  generateOccurrencesBetween,
} from './recurrence'

const SEARCH_DAYS = 370
const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER)

export interface SafeToSpendResult {
  recordedBalanceChetrum: number
  upcomingCommitmentsChetrum: number
  safetyBufferChetrum: number
  safeToSpendChetrum: number
  horizonDate: string
  nextExpectedIncomeDate: string | null
  nextExpectedIncomeChetrum: number | null
}

function assertSafeInteger(
  value: number,
  label: string,
): void {
  if (!Number.isSafeInteger(value)) {
    throw new Error(`${label} must be a safe integer.`)
  }
}

function assertNonNegativeChetrum(
  value: number,
  label: string,
): void {
  assertSafeInteger(value, label)

  if (value < 0) {
    throw new Error(`${label} cannot be negative.`)
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

function monthEndIso(
  dateText: string,
): string {
  const [year, month] =
    dateText.split('-').map(Number)

  const date = new Date(
    Date.UTC(year, month, 0),
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

function addChetrum(
  left: bigint,
  right: number,
  label: string,
): bigint {
  assertNonNegativeChetrum(right, label)

  const total = left + BigInt(right)

  if (total > MAX_SAFE) {
    throw new Error(
      `${label} total exceeds the supported money range.`,
    )
  }

  return total
}

export function parseNuInputToChetrum(
  rawValue: string,
): number | null {
  const value = rawValue.trim()

  if (!/^\d+(?:\.\d{0,2})?$/.test(value)) {
    return null
  }

  const [wholePart, fractionPart = ''] =
    value.split('.')

  const whole = BigInt(wholePart)
  const fraction = BigInt(
    fractionPart.padEnd(2, '0'),
  )

  const total =
    whole * 100n +
    fraction

  if (total > MAX_SAFE) {
    return null
  }

  return Number(total)
}

export function formatChetrumForSafetyInput(
  chetrum: number,
): string {
  assertNonNegativeChetrum(
    chetrum,
    'Safety buffer',
  )

  const value = BigInt(chetrum)
  const whole = value / 100n
  const fraction = value % 100n

  return `${whole}.${fraction
    .toString()
    .padStart(2, '0')}`
}

export function calculateSafeToSpend(
  today: string,
  recordedBalanceChetrum: number,
  regularMoney: RegularMoney[],
  transactions: MoneyTransaction[],
  safetyBufferChetrum: number,
): SafeToSpendResult {
  assertSafeInteger(
    recordedBalanceChetrum,
    'Recorded balance',
  )

  assertNonNegativeChetrum(
    safetyBufferChetrum,
    'Safety buffer',
  )

  const recordedKeys =
    recordedOccurrenceKeys(transactions)

  const searchEnd =
    addDaysIso(today, SEARCH_DAYS)

  let nextIncome:
    | {
        date: string
        amountChetrum: number
      }
    | null = null

  for (const item of regularMoney) {
    assertNonNegativeChetrum(
      item.amountChetrum,
      'Regular Money amount',
    )

    if (item.kind !== 'income') {
      continue
    }

    const occurrences =
      generateOccurrencesBetween(
        item,
        today,
        searchEnd,
      )

    for (const date of occurrences) {
      if (
        recordedKeys.has(
          `${item.id}|${date}`,
        )
      ) {
        continue
      }

      if (
        !nextIncome ||
        date < nextIncome.date
      ) {
        nextIncome = {
          date,
          amountChetrum:
            item.amountChetrum,
        }
      }

      break
    }
  }

  const horizonDate =
    nextIncome?.date ??
    monthEndIso(today)

  let commitments = 0n

  for (const item of regularMoney) {
    if (item.kind !== 'expense') {
      continue
    }

    const occurrences =
      generateOccurrencesBetween(
        item,
        today,
        horizonDate,
      )

    for (const date of occurrences) {
      if (
        recordedKeys.has(
          `${item.id}|${date}`,
        )
      ) {
        continue
      }

      commitments = addChetrum(
        commitments,
        item.amountChetrum,
        'Upcoming commitments',
      )
    }
  }

  const balance =
    BigInt(recordedBalanceChetrum)

  const buffer =
    BigInt(safetyBufferChetrum)

  const available =
    balance -
    commitments -
    buffer

  const safe =
    available > 0n
      ? available
      : 0n

  if (safe > MAX_SAFE) {
    throw new Error(
      'Safe to Spend exceeds the supported money range.',
    )
  }

  return {
    recordedBalanceChetrum,
    upcomingCommitmentsChetrum:
      Number(commitments),
    safetyBufferChetrum,
    safeToSpendChetrum:
      Number(safe),
    horizonDate,
    nextExpectedIncomeDate:
      nextIncome?.date ?? null,
    nextExpectedIncomeChetrum:
      nextIncome?.amountChetrum ?? null,
  }
}
