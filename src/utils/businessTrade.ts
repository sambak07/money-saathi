import type {
  BusinessTradeEntry,
} from '../types/business'

const MAX_SAFE =
  BigInt(
    Number.MAX_SAFE_INTEGER,
  )

export interface BusinessTradeSummary {
  salesChetrum: number
  purchasesChetrum: number
  paidAtSaleChetrum: number
  paidAtPurchaseChetrum: number
  creditSalesAtEntryChetrum: number
  creditPurchasesAtEntryChetrum: number
  salesLessPurchasesChetrum: number
  saleCount: number
  purchaseCount: number
}

function assertAmount(
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

export function summarizeBusinessTradeEntries(
  entries: BusinessTradeEntry[],
): BusinessTradeSummary {
  let sales = 0n
  let purchases = 0n
  let paidAtSale = 0n
  let paidAtPurchase = 0n
  let creditSales = 0n
  let creditPurchases = 0n
  let saleCount = 0
  let purchaseCount = 0

  for (
    const entry of entries
  ) {
    assertAmount(
      entry.totalChetrum,
      'Business trade total',
    )

    assertAmount(
      entry.paidAtEntryChetrum,
      'Business trade paid amount',
    )

    if (
      entry.paidAtEntryChetrum >
      entry.totalChetrum
    ) {
      throw new Error(
        'Business trade paid amount cannot exceed its total.',
      )
    }

    const total =
      BigInt(
        entry.totalChetrum,
      )

    const paid =
      BigInt(
        entry.paidAtEntryChetrum,
      )

    const credit =
      total -
      paid

    if (
      entry.kind ===
      'sale'
    ) {
      sales +=
        total

      paidAtSale +=
        paid

      creditSales +=
        credit

      saleCount += 1
    } else {
      purchases +=
        total

      paidAtPurchase +=
        paid

      creditPurchases +=
        credit

      purchaseCount += 1
    }

    for (
      const amount of [
        sales,
        purchases,
        paidAtSale,
        paidAtPurchase,
        creditSales,
        creditPurchases,
      ]
    ) {
      if (
        amount >
        MAX_SAFE
      ) {
        throw new Error(
          'Business trade total exceeds the supported money range.',
        )
      }
    }
  }

  return {
    salesChetrum:
      toSafeNumber(
        sales,
        'Sales',
      ),
    purchasesChetrum:
      toSafeNumber(
        purchases,
        'Purchases',
      ),
    paidAtSaleChetrum:
      toSafeNumber(
        paidAtSale,
        'Paid at sale',
      ),
    paidAtPurchaseChetrum:
      toSafeNumber(
        paidAtPurchase,
        'Paid at purchase',
      ),
    creditSalesAtEntryChetrum:
      toSafeNumber(
        creditSales,
        'Credit sales',
      ),
    creditPurchasesAtEntryChetrum:
      toSafeNumber(
        creditPurchases,
        'Credit purchases',
      ),
    salesLessPurchasesChetrum:
      toSafeNumber(
        sales -
        purchases,
        'Sales less purchases',
      ),
    saleCount,
    purchaseCount,
  }
}