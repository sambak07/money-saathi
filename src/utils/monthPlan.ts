import type {
  RegularMoney,
} from '../types/regularMoney'
import type {
  MoneyTransaction,
} from '../types/transaction'
import {
  generateOccurrencesBetween,
  getMonthBounds,
} from './recurrence'
import {
  calculateSafeToSpend,
  type SafeToSpendResult,
} from './safeToSpend'

const MAX_SAFE =
  BigInt(
    Number.MAX_SAFE_INTEGER,
  )

export interface MonthPlanResult {
  month: string
  monthStart: string
  monthEnd: string
  recordedIncomeChetrum: number
  recordedExpenseChetrum: number
  recordedMonthNetChetrum: number
  recordedBalanceChetrum: number
  scheduledIncomeRemainingChetrum: number
  scheduledExpenseRemainingChetrum: number
  scheduledIncomeCount: number
  scheduledExpenseCount: number
  overdueExpenseChetrum: number
  overdueExpenseCount: number
  projectedMonthNetChetrum: number
  conservativeMonthRoomChetrum: number
  safeToSpend: SafeToSpendResult
  transactionCount: number
}

function assertMoney(
  value: number,
  label: string,
): void {
  if (
    !Number.isSafeInteger(
      value,
    ) ||
    value < 0
  ) {
    throw new Error(
      `${label} must be a non-negative safe integer.`,
    )
  }
}

function toSafeNumber(
  value: bigint,
  label: string,
): number {
  if (
    value > MAX_SAFE ||
    value < -MAX_SAFE
  ) {
    throw new Error(
      `${label} exceeds the supported money range.`,
    )
  }

  return Number(value)
}

function addMoney(
  total: bigint,
  value: number,
  label: string,
): bigint {
  assertMoney(
    value,
    label,
  )

  const next =
    total +
    BigInt(value)

  if (
    next > MAX_SAFE
  ) {
    throw new Error(
      `${label} total exceeds the supported money range.`,
    )
  }

  return next
}

function recordedOccurrenceKeys(
  transactions: MoneyTransaction[],
): Set<string> {
  const keys =
    new Set<string>()

  for (
    const transaction of transactions
  ) {
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

export function buildMonthPlan(
  today: string,
  transactions: MoneyTransaction[],
  regularMoney: RegularMoney[],
  safetyBufferChetrum: number,
): MonthPlanResult {
  assertMoney(
    safetyBufferChetrum,
    'Safety buffer',
  )

  const month =
    today.slice(
      0,
      7,
    )

  const bounds =
    getMonthBounds(
      month,
    )

  const recordedTransactions =
    transactions.filter(
      (transaction) =>
        transaction.date <= today,
    )

  let recordedIncome = 0n
  let recordedExpense = 0n
  let allIncome = 0n
  let allExpense = 0n

  for (
    const transaction of
      recordedTransactions
  ) {
    assertMoney(
      transaction.amountChetrum,
      'Transaction amount',
    )

    if (
      transaction.kind ===
      'income'
    ) {
      allIncome =
        addMoney(
          allIncome,
          transaction.amountChetrum,
          'Recorded income',
        )

      if (
        transaction.date.slice(
          0,
          7,
        ) === month
      ) {
        recordedIncome =
          addMoney(
            recordedIncome,
            transaction.amountChetrum,
            'Monthly recorded income',
          )
      }
    } else {
      allExpense =
        addMoney(
          allExpense,
          transaction.amountChetrum,
          'Recorded expenses',
        )

      if (
        transaction.date.slice(
          0,
          7,
        ) === month
      ) {
        recordedExpense =
          addMoney(
            recordedExpense,
            transaction.amountChetrum,
            'Monthly recorded expenses',
          )
      }
    }
  }

  const recordedKeys =
    recordedOccurrenceKeys(
      recordedTransactions,
    )

  let scheduledIncome = 0n
  let scheduledExpense = 0n
  let overdueExpense = 0n
  let scheduledIncomeCount = 0
  let scheduledExpenseCount = 0
  let overdueExpenseCount = 0

  for (
    const item of regularMoney
  ) {
    assertMoney(
      item.amountChetrum,
      'Regular Money amount',
    )

    const occurrences =
      generateOccurrencesBetween(
        item,
        bounds.start,
        bounds.end,
      )

    for (
      const date of
        occurrences
    ) {
      if (
        recordedKeys.has(
          `${item.id}|${date}`,
        )
      ) {
        continue
      }

      if (
        item.kind ===
        'income'
      ) {
        // Past scheduled income that was never recorded is not
        // treated as money that will still arrive.
        if (
          date >= today
        ) {
          scheduledIncome =
            addMoney(
              scheduledIncome,
              item.amountChetrum,
              'Remaining scheduled income',
            )

          scheduledIncomeCount += 1
        }

        continue
      }

      scheduledExpense =
        addMoney(
          scheduledExpense,
          item.amountChetrum,
          'Remaining scheduled expenses',
        )

      scheduledExpenseCount += 1

      if (
        date < today
      ) {
        overdueExpense =
          addMoney(
            overdueExpense,
            item.amountChetrum,
            'Overdue scheduled expenses',
          )

        overdueExpenseCount += 1
      }
    }
  }

  const recordedBalance =
    allIncome -
    allExpense

  const recordedMonthNet =
    recordedIncome -
    recordedExpense

  const projectedMonthNet =
    recordedMonthNet +
    scheduledIncome -
    scheduledExpense

  const conservativeRoom =
    recordedBalance -
    scheduledExpense -
    BigInt(
      safetyBufferChetrum,
    )

  const safeToSpend =
    calculateSafeToSpend(
      today,
      toSafeNumber(
        recordedBalance,
        'Recorded balance',
      ),
      regularMoney,
      recordedTransactions,
      safetyBufferChetrum,
    )

  return {
    month,
    monthStart:
      bounds.start,
    monthEnd:
      bounds.end,
    recordedIncomeChetrum:
      toSafeNumber(
        recordedIncome,
        'Monthly recorded income',
      ),
    recordedExpenseChetrum:
      toSafeNumber(
        recordedExpense,
        'Monthly recorded expenses',
      ),
    recordedMonthNetChetrum:
      toSafeNumber(
        recordedMonthNet,
        'Monthly recorded net',
      ),
    recordedBalanceChetrum:
      toSafeNumber(
        recordedBalance,
        'Recorded balance',
      ),
    scheduledIncomeRemainingChetrum:
      toSafeNumber(
        scheduledIncome,
        'Remaining scheduled income',
      ),
    scheduledExpenseRemainingChetrum:
      toSafeNumber(
        scheduledExpense,
        'Remaining scheduled expenses',
      ),
    scheduledIncomeCount,
    scheduledExpenseCount,
    overdueExpenseChetrum:
      toSafeNumber(
        overdueExpense,
        'Overdue scheduled expenses',
      ),
    overdueExpenseCount,
    projectedMonthNetChetrum:
      toSafeNumber(
        projectedMonthNet,
        'Projected monthly net',
      ),
    conservativeMonthRoomChetrum:
      toSafeNumber(
        conservativeRoom > 0n
          ? conservativeRoom
          : 0n,
        'Conservative month room',
      ),
    safeToSpend,
    transactionCount:
      recordedTransactions.length,
  }
}