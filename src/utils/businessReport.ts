import type {
  BusinessInventoryItem,
  BusinessOpenItem,
  BusinessTradeEntry,
  BusinessTradeLine,
  BusinessTransaction,
} from '../types/business'
import {
  summarizeBusinessInventory,
} from './businessInventory'
import {
  summarizeBusinessTradeDocument,
  summarizeBusinessTradeEntries,
} from './businessTrade'
import {
  summarizeBusinessTransactions,
} from './business'

const ISO_DATE_PATTERN =
  /^\d{4}-\d{2}-\d{2}$/

const MAX_SAFE =
  BigInt(
    Number.MAX_SAFE_INTEGER,
  )

export interface BusinessReportInput {
  startDate: string
  endDate: string
  today: string
  transactions: BusinessTransaction[]
  tradeEntries: BusinessTradeEntry[]
  tradeLines: BusinessTradeLine[]
  openItems: BusinessOpenItem[]
  inventoryItems: BusinessInventoryItem[]
}

export interface BusinessReport {
  startDate: string
  endDate: string
  registeredSalesChetrum: number
  registeredPurchasesChetrum: number
  recordedCashInChetrum: number
  recordedCashOutChetrum: number
  recordedCashNetChetrum: number
  verifiedSalesWithCogsChetrum: number
  explicitCogsChetrum: number
  verifiedGrossMarginBeforeOtherBusinessExpensesChetrum: number
  grossMarginCoverageComplete: boolean
  unverifiedSaleDocumentCount: number
  currentReceivablesChetrum: number
  currentPayablesChetrum: number
  currentOpenPositionChetrum: number
  overdueReceivablesChetrum: number
  overduePayablesChetrum: number
  overdueOpenItemCount: number
  estimatedStockValueChetrum: number
  lowStockItemCount: number
  negativeStockItemCount: number
}

function assertDate(
  value: string,
  label: string,
): void {
  if (
    !ISO_DATE_PATTERN.test(
      value,
    )
  ) {
    throw new Error(
      `${label} must use YYYY-MM-DD.`,
    )
  }
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
    value >
      MAX_SAFE ||
    value <
      -MAX_SAFE
  ) {
    throw new Error(
      `${label} exceeds the supported money range.`,
    )
  }

  return Number(
    value,
  )
}

function inPeriod(
  date: string,
  startDate: string,
  endDate: string,
): boolean {
  return (
    date >=
      startDate &&
    date <=
      endDate
  )
}

export function buildBusinessReport(
  input: BusinessReportInput,
): BusinessReport {
  assertDate(
    input.startDate,
    'Business report start date',
  )

  assertDate(
    input.endDate,
    'Business report end date',
  )

  assertDate(
    input.today,
    'Business report current date',
  )

  if (
    input.startDate >
    input.endDate
  ) {
    throw new Error(
      'Business report start date cannot be after its end date.',
    )
  }

  const periodTransactions =
    input.transactions.filter(
      (transaction) =>
        inPeriod(
          transaction.date,
          input.startDate,
          input.endDate,
        ),
    )

  const periodTradeEntries =
    input.tradeEntries.filter(
      (entry) =>
        inPeriod(
          entry.date,
          input.startDate,
          input.endDate,
        ),
    )

  const periodTradeIds =
    new Set(
      periodTradeEntries.map(
        (entry) =>
          entry.id,
      ),
    )

  const periodTradeLines =
    input.tradeLines.filter(
      (line) =>
        periodTradeIds.has(
          line.tradeEntryId,
        ),
    )

  const tradeSummary =
    summarizeBusinessTradeEntries(
      periodTradeEntries,
    )

  const cashSummary =
    summarizeBusinessTransactions(
      periodTransactions,
    )

  const linesByTradeId =
    new Map<
      string,
      BusinessTradeLine[]
    >()

  for (
    const line of periodTradeLines
  ) {
    const current =
      linesByTradeId.get(
        line.tradeEntryId,
      ) ??
      []

    current.push(
      line,
    )

    linesByTradeId.set(
      line.tradeEntryId,
      current,
    )
  }

  let verifiedSales =
    0n

  let explicitCogs =
    0n

  let verifiedGrossMargin =
    0n

  let unverifiedSaleDocumentCount =
    0

  for (
    const entry of periodTradeEntries
  ) {
    if (
      entry.kind !==
      'sale'
    ) {
      continue
    }

    const lines =
      linesByTradeId.get(
        entry.id,
      ) ??
      []

    try {
      const summary =
        summarizeBusinessTradeDocument(
          entry,
          lines,
        )

      verifiedSales +=
        BigInt(
          summary.lineTotalChetrum,
        )

      explicitCogs +=
        BigInt(
          summary.costOfGoodsSoldChetrum,
        )

      verifiedGrossMargin +=
        BigInt(
          summary.grossMarginBeforeOtherBusinessExpensesChetrum ??
            0,
        )
    } catch {
      unverifiedSaleDocumentCount +=
        1
    }
  }

  let currentReceivables =
    0n

  let currentPayables =
    0n

  let overdueReceivables =
    0n

  let overduePayables =
    0n

  let overdueOpenItemCount =
    0

  for (
    const item of input.openItems
  ) {
    assertMoney(
      item.originalAmountChetrum,
      'Business open-item original amount',
    )

    assertMoney(
      item.outstandingAmountChetrum,
      'Business open-item outstanding amount',
    )

    if (
      item.outstandingAmountChetrum >
      item.originalAmountChetrum
    ) {
      throw new Error(
        'Business open-item outstanding amount cannot exceed its original amount.',
      )
    }

    if (
      item.outstandingAmountChetrum ===
      0
    ) {
      continue
    }

    const outstanding =
      BigInt(
        item.outstandingAmountChetrum,
      )

    const overdue =
      item.dueDate !==
        '' &&
      item.dueDate <
        input.today

    if (
      item.direction ===
      'receivable'
    ) {
      currentReceivables +=
        outstanding

      if (overdue) {
        overdueReceivables +=
          outstanding
      }
    } else {
      currentPayables +=
        outstanding

      if (overdue) {
        overduePayables +=
          outstanding
      }
    }

    if (overdue) {
      overdueOpenItemCount +=
        1
    }

    for (
      const total of [
        currentReceivables,
        currentPayables,
        overdueReceivables,
        overduePayables,
      ]
    ) {
      if (
        total >
        MAX_SAFE
      ) {
        throw new Error(
          'Business open-item total exceeds the supported money range.',
        )
      }
    }
  }

  const inventorySummary =
    summarizeBusinessInventory(
      input.inventoryItems,
      input.tradeLines,
    )

  return {
    startDate:
      input.startDate,
    endDate:
      input.endDate,
    registeredSalesChetrum:
      tradeSummary.salesChetrum,
    registeredPurchasesChetrum:
      tradeSummary.purchasesChetrum,
    recordedCashInChetrum:
      cashSummary.moneyInChetrum,
    recordedCashOutChetrum:
      cashSummary.moneyOutChetrum,
    recordedCashNetChetrum:
      cashSummary.netCashChetrum,
    verifiedSalesWithCogsChetrum:
      toSafeNumber(
        verifiedSales,
        'Verified sales',
      ),
    explicitCogsChetrum:
      toSafeNumber(
        explicitCogs,
        'Explicit COGS',
      ),
    verifiedGrossMarginBeforeOtherBusinessExpensesChetrum:
      toSafeNumber(
        verifiedGrossMargin,
        'Verified gross margin before other business expenses',
      ),
    grossMarginCoverageComplete:
      unverifiedSaleDocumentCount ===
      0,
    unverifiedSaleDocumentCount,
    currentReceivablesChetrum:
      toSafeNumber(
        currentReceivables,
        'Current receivables',
      ),
    currentPayablesChetrum:
      toSafeNumber(
        currentPayables,
        'Current payables',
      ),
    currentOpenPositionChetrum:
      toSafeNumber(
        currentReceivables -
          currentPayables,
        'Current open position',
      ),
    overdueReceivablesChetrum:
      toSafeNumber(
        overdueReceivables,
        'Overdue receivables',
      ),
    overduePayablesChetrum:
      toSafeNumber(
        overduePayables,
        'Overdue payables',
      ),
    overdueOpenItemCount,
    estimatedStockValueChetrum:
      inventorySummary.estimatedStockValueChetrum,
    lowStockItemCount:
      inventorySummary.lowStockItemCount,
    negativeStockItemCount:
      inventorySummary.negativeStockItemCount,
  }
}