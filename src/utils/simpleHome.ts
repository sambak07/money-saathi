import type {
  MoneyTransaction,
} from '../types/transaction'

const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER)

export interface SimpleMonthSummary {
  incomeChetrum: number
  expenseChetrum: number
  netChetrum: number
}

function addMoney(
  total: bigint,
  amountChetrum: number,
): bigint {
  if (
    !Number.isSafeInteger(amountChetrum) ||
    amountChetrum < 0
  ) {
    throw new Error(
      'Transaction amount must be a non-negative safe integer.',
    )
  }

  const next =
    total + BigInt(amountChetrum)

  if (next > MAX_SAFE) {
    throw new Error(
      'Simple Home money total exceeds the supported range.',
    )
  }

  return next
}

export function summarizeSimpleMonth(
  month: string,
  transactions: MoneyTransaction[],
): SimpleMonthSummary {
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

  return {
    incomeChetrum: Number(income),
    expenseChetrum: Number(expense),
    netChetrum:
      Number(income - expense),
  }
}

export function transactionBalanceChetrum(
  transactions: MoneyTransaction[],
): number {
  let income = 0n
  let expense = 0n

  for (const transaction of transactions) {
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

  const balance = income - expense

  if (
    balance > MAX_SAFE ||
    balance < -MAX_SAFE
  ) {
    throw new Error(
      'Transaction balance exceeds the supported range.',
    )
  }

  return Number(balance)
}
