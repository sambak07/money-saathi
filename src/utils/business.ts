import type {
  BusinessTransaction,
} from '../types/business'

const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER)

function sumKind(
  transactions: BusinessTransaction[],
  kind: 'income' | 'expense',
): number {
  let total = 0n

  for (const transaction of transactions) {
    if (transaction.kind !== kind) {
      continue
    }

    if (
      !Number.isSafeInteger(
        transaction.amountChetrum,
      ) ||
      transaction.amountChetrum < 0
    ) {
      throw new Error(
        'Business transaction amount must be a non-negative safe integer.',
      )
    }

    total += BigInt(
      transaction.amountChetrum,
    )

    if (total > MAX_SAFE) {
      throw new Error(
        'Business transaction total exceeds the supported money range.',
      )
    }
  }

  return Number(total)
}

export interface BusinessSummary {
  moneyInChetrum: number
  moneyOutChetrum: number
  netCashChetrum: number
}

export function summarizeBusinessTransactions(
  transactions: BusinessTransaction[],
): BusinessSummary {
  const moneyInChetrum =
    sumKind(transactions, 'income')

  const moneyOutChetrum =
    sumKind(transactions, 'expense')

  return {
    moneyInChetrum,
    moneyOutChetrum,
    netCashChetrum:
      moneyInChetrum -
      moneyOutChetrum,
  }
}
