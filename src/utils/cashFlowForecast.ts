import type {
  RegularMoney,
} from '../types/regularMoney'
import type {
  MoneyTransaction,
} from '../types/transaction'
import {
  buildMoneyTimeline,
  type MoneyTimelineItem,
} from './moneyTimeline'

const MAX_SAFE =
  BigInt(
    Number.MAX_SAFE_INTEGER,
  )

export type ForecastHorizon =
  | 30
  | 60
  | 90

export interface ForecastPoint {
  date: string
  balanceChetrum: number
  item: MoneyTimelineItem
}

export interface CashFlowForecastResult {
  daysAhead: ForecastHorizon
  startDate: string
  endDate: string
  openingRecordedBalanceChetrum: number
  scheduledIncomeChetrum: number
  scheduledExpenseChetrum: number
  projectedEndBalanceChetrum: number
  lowestProjectedBalanceChetrum: number
  lowestProjectedBalanceDate: string | null
  safetyBufferChetrum: number
  projectedEndAfterBufferChetrum: number
  lowestAfterBufferChetrum: number
  scheduledIncomeCount: number
  scheduledExpenseCount: number
  points: ForecastPoint[]
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

function recordedBalance(
  today: string,
  transactions: MoneyTransaction[],
): bigint {
  let income = 0n
  let expense = 0n

  for (
    const transaction of transactions
  ) {
    if (
      transaction.date >
      today
    ) {
      continue
    }

    assertMoney(
      transaction.amountChetrum,
      'Transaction amount',
    )

    if (
      transaction.kind ===
      'income'
    ) {
      income +=
        BigInt(
          transaction.amountChetrum,
        )
    } else {
      expense +=
        BigInt(
          transaction.amountChetrum,
        )
    }

    if (
      income > MAX_SAFE ||
      expense > MAX_SAFE
    ) {
      throw new Error(
        'Recorded balance exceeds the supported money range.',
      )
    }
  }

  return income -
    expense
}

export function buildCashFlowForecast(
  today: string,
  daysAhead: ForecastHorizon,
  regularMoney: RegularMoney[],
  transactions: MoneyTransaction[],
  safetyBufferChetrum: number,
): CashFlowForecastResult {
  assertMoney(
    safetyBufferChetrum,
    'Safety buffer',
  )

  if (
    daysAhead !== 30 &&
    daysAhead !== 60 &&
    daysAhead !== 90
  ) {
    throw new Error(
      'Forecast horizon must be 30, 60 or 90 days.',
    )
  }

  const timeline =
    buildMoneyTimeline(
      today,
      daysAhead,
      regularMoney,
      transactions,
      [],
    )

  const opening =
    recordedBalance(
      today,
      transactions,
    )

  let running =
    opening

  let lowest =
    opening

  let lowestDate:
    string | null =
      null

  let scheduledIncome = 0n
  let scheduledExpense = 0n
  let scheduledIncomeCount = 0
  let scheduledExpenseCount = 0

  const points:
    ForecastPoint[] = []

  for (
    const item of
      timeline.items
  ) {
    const amount =
      BigInt(
        item.amountChetrum,
      )

    if (
      item.kind ===
      'income'
    ) {
      scheduledIncome +=
        amount

      scheduledIncomeCount += 1

      running +=
        amount
    } else {
      scheduledExpense +=
        amount

      scheduledExpenseCount += 1

      running -=
        amount
    }

    if (
      scheduledIncome > MAX_SAFE ||
      scheduledExpense > MAX_SAFE ||
      running > MAX_SAFE ||
      running < -MAX_SAFE
    ) {
      throw new Error(
        'Forecast exceeds the supported money range.',
      )
    }

    if (
      running < lowest
    ) {
      lowest =
        running

      lowestDate =
        item.date
    }

    points.push({
      date:
        item.date,
      balanceChetrum:
        toSafeNumber(
          running,
          'Forecast balance',
        ),
      item,
    })
  }

  const buffer =
    BigInt(
      safetyBufferChetrum,
    )

  return {
    daysAhead,
    startDate:
      today,
    endDate:
      timeline.endDate,
    openingRecordedBalanceChetrum:
      toSafeNumber(
        opening,
        'Opening recorded balance',
      ),
    scheduledIncomeChetrum:
      toSafeNumber(
        scheduledIncome,
        'Scheduled forecast income',
      ),
    scheduledExpenseChetrum:
      toSafeNumber(
        scheduledExpense,
        'Scheduled forecast expenses',
      ),
    projectedEndBalanceChetrum:
      toSafeNumber(
        running,
        'Projected end balance',
      ),
    lowestProjectedBalanceChetrum:
      toSafeNumber(
        lowest,
        'Lowest projected balance',
      ),
    lowestProjectedBalanceDate:
      lowestDate,
    safetyBufferChetrum,
    projectedEndAfterBufferChetrum:
      toSafeNumber(
        running -
        buffer,
        'Projected end after safety buffer',
      ),
    lowestAfterBufferChetrum:
      toSafeNumber(
        lowest -
        buffer,
        'Lowest forecast after safety buffer',
      ),
    scheduledIncomeCount,
    scheduledExpenseCount,
    points,
  }
}

export function buildStandardCashFlowForecasts(
  today: string,
  regularMoney: RegularMoney[],
  transactions: MoneyTransaction[],
  safetyBufferChetrum: number,
): CashFlowForecastResult[] {
  return (
    [
      30,
      60,
      90,
    ] as const
  ).map(
    (daysAhead) =>
      buildCashFlowForecast(
        today,
        daysAhead,
        regularMoney,
        transactions,
        safetyBufferChetrum,
      ),
  )
}