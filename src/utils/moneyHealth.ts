import type {
  MoneyTransaction,
} from '../types/transaction'

const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER)

export interface MonthlyCashFlow {
  month: string
  incomeChetrum: number
  expenseChetrum: number
  netChetrum: number
}

export interface MoneyHealthSnapshot {
  currentMonth: MonthlyCashFlow
  recentMonths: MonthlyCashFlow[]
  positiveNetMonths: number
  averageMonthlyExpenseChetrum: number
  liquidSavingsChetrum: number
  emergencyCoverageMonthsTenths: number | null
}

function monthKey(
  dateText: string,
): string {
  return dateText.slice(0, 7)
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
  current: bigint,
  amountChetrum: number,
): bigint {
  if (
    !Number.isSafeInteger(amountChetrum) ||
    amountChetrum < 0
  ) {
    throw new Error(
      'Transaction money must be a non-negative safe integer.',
    )
  }

  const next =
    current + BigInt(amountChetrum)

  if (next > MAX_SAFE) {
    throw new Error(
      'Money total exceeds the supported range.',
    )
  }

  return next
}

function flowForMonth(
  transactions: MoneyTransaction[],
  month: string,
): MonthlyCashFlow {
  let income = 0n
  let expense = 0n

  for (const transaction of transactions) {
    if (
      monthKey(transaction.date) !== month
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

  return {
    month,
    incomeChetrum: Number(income),
    expenseChetrum: Number(expense),
    netChetrum:
      Number(income - expense),
  }
}

function averageChetrum(
  values: number[],
): number {
  if (values.length === 0) {
    return 0
  }

  let total = 0n

  for (const value of values) {
    if (
      !Number.isSafeInteger(value) ||
      value < 0
    ) {
      throw new Error(
        'Average input must be a non-negative safe integer.',
      )
    }

    total += BigInt(value)

    if (total > MAX_SAFE) {
      throw new Error(
        'Average total exceeds the supported range.',
      )
    }
  }

  return Number(
    total / BigInt(values.length),
  )
}

export function calculateEmergencyCoverageTenths(
  liquidSavingsChetrum: number,
  averageMonthlyExpenseChetrum: number,
): number | null {
  if (
    !Number.isSafeInteger(liquidSavingsChetrum) ||
    liquidSavingsChetrum < 0 ||
    !Number.isSafeInteger(
      averageMonthlyExpenseChetrum,
    ) ||
    averageMonthlyExpenseChetrum < 0
  ) {
    throw new Error(
      'Emergency coverage inputs must be non-negative safe integers.',
    )
  }

  if (averageMonthlyExpenseChetrum === 0) {
    return null
  }

  const tenths =
    (
      BigInt(liquidSavingsChetrum) *
      10n
    ) /
    BigInt(
      averageMonthlyExpenseChetrum,
    )

  if (tenths > MAX_SAFE) {
    throw new Error(
      'Emergency coverage exceeds the supported range.',
    )
  }

  return Number(tenths)
}

export function buildMoneyHealthSnapshot(
  currentMonth: string,
  transactions: MoneyTransaction[],
  liquidSavingsChetrum: number,
): MoneyHealthSnapshot {
  if (
    !Number.isSafeInteger(
      liquidSavingsChetrum,
    ) ||
    liquidSavingsChetrum < 0
  ) {
    throw new Error(
      'Liquid savings must be a non-negative safe integer.',
    )
  }

  const months = [
    shiftMonth(currentMonth, -2),
    shiftMonth(currentMonth, -1),
    currentMonth,
  ]

  const recentMonths =
    months.map((month) =>
      flowForMonth(
        transactions,
        month,
      ),
    )

  const positiveNetMonths =
    recentMonths.filter(
      (month) =>
        month.netChetrum > 0,
    ).length

  const expenseMonths =
    recentMonths.filter(
      (month) =>
        month.expenseChetrum > 0,
    )

  const averageMonthlyExpenseChetrum =
    averageChetrum(
      expenseMonths.map(
        (month) =>
          month.expenseChetrum,
      ),
    )

  return {
    currentMonth:
      recentMonths[
        recentMonths.length - 1
      ],
    recentMonths,
    positiveNetMonths,
    averageMonthlyExpenseChetrum,
    liquidSavingsChetrum,
    emergencyCoverageMonthsTenths:
      calculateEmergencyCoverageTenths(
        liquidSavingsChetrum,
        averageMonthlyExpenseChetrum,
      ),
  }
}

export function formatCoverageMonths(
  tenths: number | null,
): string {
  if (tenths === null) {
    return 'Not enough expense history'
  }

  const whole =
    Math.trunc(tenths / 10)

  const fraction =
    tenths % 10

  return `${whole}.${fraction} months`
}
