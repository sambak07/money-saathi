import type {
  BusinessTradeEntry,
  BusinessTradeLine,
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

export interface BusinessTradeDocumentSummary {
  lineTotalChetrum: number
  unpaidAtEntryChetrum: number
  costOfGoodsSoldChetrum: number
  grossMarginBeforeOtherBusinessExpensesChetrum:
    number | null
}

export function summarizeBusinessTradeDocument(
  entry: BusinessTradeEntry,
  lines: BusinessTradeLine[],
): BusinessTradeDocumentSummary {
  assertAmount(
    entry.totalChetrum,
    'Business trade total',
  )

  assertAmount(
    entry.paidAtEntryChetrum,
    'Business trade paid amount',
  )

  if (
    entry.totalChetrum <=
    0
  ) {
    throw new Error(
      'Business trade total must be greater than zero.',
    )
  }

  if (
    entry.paidAtEntryChetrum >
    entry.totalChetrum
  ) {
    throw new Error(
      'Business trade paid amount cannot exceed its total.',
    )
  }

  if (
    lines.length ===
    0
  ) {
    throw new Error(
      'A business sale or purchase must contain at least one line.',
    )
  }

  let lineTotal = 0n
  let cogs = 0n

  for (
    const line of lines
  ) {
    if (
      line.tradeEntryId !==
      entry.id
    ) {
      throw new Error(
        'Business trade line belongs to a different document.',
      )
    }

    if (
      line.businessId !==
      entry.businessId
    ) {
      throw new Error(
        'Business trade line belongs to a different business.',
      )
    }

    if (
      line.kind !==
      entry.kind
    ) {
      throw new Error(
        'Business trade line kind does not match its document.',
      )
    }

    if (
      !Number.isSafeInteger(
        line.quantityMilliUnits,
      ) ||
      line.quantityMilliUnits <=
        0
    ) {
      throw new Error(
        'Business trade line quantity must be a positive safe integer.',
      )
    }

    if (
      !Number.isSafeInteger(
        line.lineAmountChetrum,
      ) ||
      line.lineAmountChetrum <=
        0
    ) {
      throw new Error(
        'Business trade line amount must be a positive safe integer.',
      )
    }

    assertAmount(
      line.costOfGoodsSoldChetrum,
      'Business trade line cost of goods sold',
    )

    if (
      entry.kind ===
        'purchase' &&
      line.costOfGoodsSoldChetrum !==
        0
    ) {
      throw new Error(
        'Purchase lines cannot record cost of goods sold.',
      )
    }

    lineTotal +=
      BigInt(
        line.lineAmountChetrum,
      )

    if (
      entry.kind ===
      'sale'
    ) {
      cogs +=
        BigInt(
          line.costOfGoodsSoldChetrum,
        )
    }

    if (
      lineTotal >
        MAX_SAFE ||
      cogs >
        MAX_SAFE
    ) {
      throw new Error(
        'Business trade document total exceeds the supported money range.',
      )
    }
  }

  if (
    lineTotal !==
    BigInt(
      entry.totalChetrum,
    )
  ) {
    throw new Error(
      'Business trade document total must equal the sum of its lines.',
    )
  }

  const unpaidAtEntry =
    BigInt(
      entry.totalChetrum,
    ) -
    BigInt(
      entry.paidAtEntryChetrum,
    )

  const grossMargin =
    lineTotal -
    cogs

  return {
    lineTotalChetrum:
      Number(
        lineTotal,
      ),
    unpaidAtEntryChetrum:
      Number(
        unpaidAtEntry,
      ),
    costOfGoodsSoldChetrum:
      Number(
        cogs,
      ),
    grossMarginBeforeOtherBusinessExpensesChetrum:
      entry.kind ===
        'sale'
        ? toSafeNumber(
            grossMargin,
            'Gross margin before other business expenses',
          )
        : null,
  }
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