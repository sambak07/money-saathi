import type { MoneyTransaction } from '../types/transaction'

export interface MonthlyReportSummary {
  month: string
  incomeChetrum: number
  expenseChetrum: number
  netChetrum: number
  transactionCount: number
}

export interface CategoryReportRow {
  category: string
  amountChetrum: number
  transactionCount: number
  shareBps: number
}

export function getMonthKeyOffset(
  monthKey: string,
  offset: number,
): string {
  const [year, month] = monthKey.split('-').map(Number)

  const date = new Date(year, month - 1 + offset, 1)

  const nextYear = date.getFullYear()
  const nextMonth = String(date.getMonth() + 1).padStart(2, '0')

  return `${nextYear}-${nextMonth}`
}

export function getMonthLabel(
  monthKey: string,
): string {
  const [year, month] = monthKey.split('-').map(Number)

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
  }).format(new Date(year, month - 1, 1))
}

export function summarizeMonth(
  transactions: MoneyTransaction[],
  monthKey: string,
): MonthlyReportSummary {
  let incomeChetrum = 0
  let expenseChetrum = 0
  let transactionCount = 0

  for (const transaction of transactions) {
    if (transaction.date.slice(0, 7) !== monthKey) {
      continue
    }

    transactionCount += 1

    if (transaction.kind === 'income') {
      incomeChetrum += transaction.amountChetrum
    } else {
      expenseChetrum += transaction.amountChetrum
    }
  }

  return {
    month: monthKey,
    incomeChetrum,
    expenseChetrum,
    netChetrum: incomeChetrum - expenseChetrum,
    transactionCount,
  }
}

export function buildMonthlyTrend(
  transactions: MoneyTransaction[],
  endingMonth: string,
  count: number,
): MonthlyReportSummary[] {
  const safeCount = Math.max(1, Math.min(count, 24))

  return Array.from(
    { length: safeCount },
    (_, index) => {
      const offset = index - safeCount + 1
      const month = getMonthKeyOffset(endingMonth, offset)

      return summarizeMonth(transactions, month)
    },
  )
}

export function calculateAverageChetrum(
  totalChetrum: number,
  count: number,
): number {
  if (
    !Number.isSafeInteger(totalChetrum) ||
    totalChetrum < 0 ||
    !Number.isSafeInteger(count) ||
    count <= 0
  ) {
    return 0
  }

  return Number(
    BigInt(totalChetrum) / BigInt(count),
  )
}

export function calculateShareBps(
  partChetrum: number,
  totalChetrum: number,
): number {
  if (
    !Number.isSafeInteger(partChetrum) ||
    !Number.isSafeInteger(totalChetrum) ||
    totalChetrum <= 0 ||
    partChetrum <= 0
  ) {
    return 0
  }

  return Number(
    (BigInt(partChetrum) * 10_000n) /
      BigInt(totalChetrum),
  )
}

export function calculateCashFlowRateBps(
  incomeChetrum: number,
  netChetrum: number,
): number | null {
  if (
    !Number.isSafeInteger(incomeChetrum) ||
    !Number.isSafeInteger(netChetrum) ||
    incomeChetrum <= 0
  ) {
    return null
  }

  return Number(
    (BigInt(netChetrum) * 10_000n) /
      BigInt(incomeChetrum),
  )
}

export function formatPercentBps(
  basisPoints: number,
): string {
  const negative = basisPoints < 0
  const absolute = Math.abs(basisPoints)
  const whole = Math.floor(absolute / 100)
  const decimal = String(absolute % 100).padStart(2, '0')

  return `${negative ? '-' : ''}${whole}.${decimal}%`
}

export function buildExpenseCategoryBreakdown(
  transactions: MoneyTransaction[],
  monthKey: string,
): CategoryReportRow[] {
  const categoryMap = new Map<
    string,
    {
      amountChetrum: number
      transactionCount: number
    }
  >()

  let totalExpenseChetrum = 0

  for (const transaction of transactions) {
    if (
      transaction.kind !== 'expense' ||
      transaction.date.slice(0, 7) !== monthKey
    ) {
      continue
    }

    totalExpenseChetrum += transaction.amountChetrum

    const current = categoryMap.get(transaction.category) ?? {
      amountChetrum: 0,
      transactionCount: 0,
    }

    categoryMap.set(transaction.category, {
      amountChetrum:
        current.amountChetrum + transaction.amountChetrum,
      transactionCount: current.transactionCount + 1,
    })
  }

  return Array.from(categoryMap.entries())
    .map(([category, value]) => ({
      category,
      amountChetrum: value.amountChetrum,
      transactionCount: value.transactionCount,
      shareBps: calculateShareBps(
        value.amountChetrum,
        totalExpenseChetrum,
      ),
    }))
    .sort((a, b) => b.amountChetrum - a.amountChetrum)
}

export function getMonthTransactions(
  transactions: MoneyTransaction[],
  monthKey: string,
): MoneyTransaction[] {
  return transactions
    .filter(
      (transaction) =>
        transaction.date.slice(0, 7) === monthKey,
    )
    .sort((a, b) => {
      const dateComparison = b.date.localeCompare(a.date)

      if (dateComparison !== 0) {
        return dateComparison
      }

      return b.createdAt - a.createdAt
    })
}

