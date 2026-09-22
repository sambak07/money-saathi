import type {
  MoneyTransaction,
} from '../types/transaction'

const MAX_SAFE =
  BigInt(Number.MAX_SAFE_INTEGER)

export interface IncomeRhythmMonth {
  month: string
  incomeChetrum: number
  expenseChetrum: number
  netChetrum: number
  hasActivity: boolean
}

export interface IrregularIncomeSnapshot {
  months: IncomeRhythmMonth[]
  activeMonths: number
  incomeMonths: number
  zeroIncomeActiveMonths: number
  totalIncomeChetrum: number
  averageIncomeAcrossActiveMonthsChetrum: number
  lowestPositiveIncomeChetrum: number | null
  highestIncomeChetrum: number | null
  currentMonthIncomeChetrum: number
}

function shiftMonth(
  month: string,
  offset: number,
): string {
  const [year, monthNumber] =
    month.split('-').map(Number)

  const date = new Date(
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

function addMoney(
  total: bigint,
  value: number,
): bigint {
  if (
    !Number.isSafeInteger(value) ||
    value < 0
  ) {
    throw new Error(
      'Transaction amount must be a non-negative safe integer.',
    )
  }

  const next =
    total + BigInt(value)

  if (next > MAX_SAFE) {
    throw new Error(
      'Income rhythm total exceeds the supported money range.',
    )
  }

  return next
}

function buildMonth(
  month: string,
  transactions: MoneyTransaction[],
): IncomeRhythmMonth {
  let income = 0n
  let expense = 0n

  for (const transaction of transactions) {
    if (
      transaction.date.slice(0, 7) !== month
    ) {
      continue
    }

    if (transaction.kind === 'income') {
      income = addMoney(
        income,
        transaction.amountChetrum,
      )
    } else {
      expense = addMoney(
        expense,
        transaction.amountChetrum,
      )
    }
  }

  const incomeChetrum = Number(income)
  const expenseChetrum = Number(expense)

  return {
    month,
    incomeChetrum,
    expenseChetrum,
    netChetrum:
      incomeChetrum - expenseChetrum,
    hasActivity:
      incomeChetrum > 0 ||
      expenseChetrum > 0,
  }
}

export function buildIrregularIncomeSnapshot(
  currentMonth: string,
  transactions: MoneyTransaction[],
  monthsToShow = 6,
): IrregularIncomeSnapshot {
  if (
    !Number.isSafeInteger(monthsToShow) ||
    monthsToShow < 1 ||
    monthsToShow > 24
  ) {
    throw new Error(
      'Income history range must be between 1 and 24 months.',
    )
  }

  const months =
    Array.from(
      {
        length: monthsToShow,
      },
      (_, index) =>
        shiftMonth(
          currentMonth,
          index - (monthsToShow - 1),
        ),
    ).map((month) =>
      buildMonth(
        month,
        transactions,
      ),
    )

  const active =
    months.filter(
      (month) => month.hasActivity,
    )

  const incomeMonths =
    months.filter(
      (month) =>
        month.incomeChetrum > 0,
    )

  let totalIncome = 0n

  for (const month of active) {
    totalIncome = addMoney(
      totalIncome,
      month.incomeChetrum,
    )
  }

  const averageIncomeAcrossActiveMonthsChetrum =
    active.length > 0
      ? Number(
          totalIncome /
            BigInt(active.length),
        )
      : 0

  const positiveIncomes =
    incomeMonths.map(
      (month) => month.incomeChetrum,
    )

  return {
    months,
    activeMonths: active.length,
    incomeMonths: incomeMonths.length,
    zeroIncomeActiveMonths:
      active.filter(
        (month) =>
          month.incomeChetrum === 0,
      ).length,
    totalIncomeChetrum:
      Number(totalIncome),
    averageIncomeAcrossActiveMonthsChetrum,
    lowestPositiveIncomeChetrum:
      positiveIncomes.length > 0
        ? Math.min(...positiveIncomes)
        : null,
    highestIncomeChetrum:
      positiveIncomes.length > 0
        ? Math.max(...positiveIncomes)
        : null,
    currentMonthIncomeChetrum:
      months[
        months.length - 1
      ].incomeChetrum,
  }
}

export interface PlanningFloorComparison {
  floorChetrum: number
  currentMonthIncomeChetrum: number
  remainingToFloorChetrum: number
  amountAboveFloorChetrum: number
}

export function comparePlanningFloor(
  floorChetrum: number,
  currentMonthIncomeChetrum: number,
): PlanningFloorComparison {
  for (const [label, value] of [
    ['Planning floor', floorChetrum],
    [
      'Current month income',
      currentMonthIncomeChetrum,
    ],
  ] as const) {
    if (
      !Number.isSafeInteger(value) ||
      value < 0
    ) {
      throw new Error(
        `${label} must be a non-negative safe integer.`,
      )
    }
  }

  return {
    floorChetrum,
    currentMonthIncomeChetrum,
    remainingToFloorChetrum:
      currentMonthIncomeChetrum <
      floorChetrum
        ? floorChetrum -
          currentMonthIncomeChetrum
        : 0,
    amountAboveFloorChetrum:
      currentMonthIncomeChetrum >
      floorChetrum
        ? currentMonthIncomeChetrum -
          floorChetrum
        : 0,
  }
}
