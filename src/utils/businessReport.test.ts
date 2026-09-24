import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  BusinessInventoryItem,
  BusinessOpenItem,
  BusinessTradeEntry,
  BusinessTradeLine,
  BusinessTransaction,
} from '../types/business'
import {
  buildBusinessReport,
} from './businessReport'

function transaction(
  overrides: Partial<BusinessTransaction> = {},
): BusinessTransaction {
  return {
    id: 'cash-1',
    businessId: 'business-1',
    kind: 'income',
    amountChetrum: 100_000,
    category: 'Sales',
    note: '',
    date: '2026-09-10',
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  }
}

function tradeEntry(
  overrides: Partial<BusinessTradeEntry> = {},
): BusinessTradeEntry {
  return {
    id: 'trade-1',
    businessId: 'business-1',
    kind: 'sale',
    partyName: '',
    totalChetrum: 300_000,
    paidAtEntryChetrum: 200_000,
    paymentMethod: 'mixed',
    date: '2026-09-12',
    reference: '',
    note: '',
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  }
}

function tradeLine(
  overrides: Partial<BusinessTradeLine> = {},
): BusinessTradeLine {
  return {
    id: 'line-1',
    businessId: 'business-1',
    tradeEntryId: 'trade-1',
    inventoryItemId: 'item-1',
    itemName: 'Engine oil',
    kind: 'sale',
    quantityMilliUnits: 2_000,
    lineAmountChetrum: 300_000,
    costOfGoodsSoldChetrum: 180_000,
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  }
}

function inventoryItem(
  overrides: Partial<BusinessInventoryItem> = {},
): BusinessInventoryItem {
  return {
    id: 'item-1',
    businessId: 'business-1',
    name: 'Engine oil',
    sku: '',
    unit: 'litre',
    openingQuantityMilliUnits: 10_000,
    currentUnitCostChetrum: 90_000,
    lowStockQuantityMilliUnits: 2_000,
    active: true,
    note: '',
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  }
}

function openItem(
  overrides: Partial<BusinessOpenItem> = {},
): BusinessOpenItem {
  return {
    id: 'open-1',
    businessId: 'business-1',
    partyId: 'party-1',
    direction: 'receivable',
    originalAmountChetrum: 100_000,
    outstandingAmountChetrum: 80_000,
    date: '2026-09-01',
    dueDate: '2026-09-20',
    reference: '',
    note: '',
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  }
}

describe('business reporting foundation', () => {
  it('keeps register, cash, dues and stock as separate lenses', () => {
    const report =
      buildBusinessReport({
        startDate: '2026-09-01',
        endDate: '2026-09-30',
        today: '2026-09-24',
        transactions: [
          transaction(),
          transaction({
            id: 'cash-2',
            kind: 'expense',
            amountChetrum: 40_000,
            category: 'Rent',
          }),
        ],
        tradeEntries: [
          tradeEntry(),
          tradeEntry({
            id: 'purchase-1',
            kind: 'purchase',
            totalChetrum: 120_000,
            paidAtEntryChetrum: 120_000,
          }),
        ],
        tradeLines: [
          tradeLine(),
          tradeLine({
            id: 'purchase-line',
            tradeEntryId: 'purchase-1',
            kind: 'purchase',
            quantityMilliUnits: 1_000,
            lineAmountChetrum: 120_000,
            costOfGoodsSoldChetrum: 0,
          }),
        ],
        openItems: [
          openItem(),
          openItem({
            id: 'open-2',
            direction: 'payable',
            originalAmountChetrum: 50_000,
            outstandingAmountChetrum: 50_000,
            dueDate: '2026-09-30',
          }),
        ],
        inventoryItems: [
          inventoryItem(),
        ],
      })

    expect(
      report.registeredSalesChetrum,
    ).toBe(300_000)

    expect(
      report.registeredPurchasesChetrum,
    ).toBe(120_000)

    expect(
      report.recordedCashNetChetrum,
    ).toBe(60_000)

    expect(
      report.verifiedGrossMarginBeforeOtherBusinessExpensesChetrum,
    ).toBe(120_000)

    expect(
      report.currentReceivablesChetrum,
    ).toBe(80_000)

    expect(
      report.currentPayablesChetrum,
    ).toBe(50_000)

    expect(
      report.overdueReceivablesChetrum,
    ).toBe(80_000)

    expect(
      report.estimatedStockValueChetrum,
    ).toBe(810_000)
  })

  it('filters register and cash figures by report period', () => {
    const report =
      buildBusinessReport({
        startDate: '2026-09-01',
        endDate: '2026-09-30',
        today: '2026-09-24',
        transactions: [
          transaction(),
          transaction({
            id: 'old-cash',
            date: '2026-08-31',
            amountChetrum: 999_000,
          }),
        ],
        tradeEntries: [
          tradeEntry(),
          tradeEntry({
            id: 'old-trade',
            date: '2026-08-31',
            totalChetrum: 999_000,
          }),
        ],
        tradeLines: [
          tradeLine(),
          tradeLine({
            id: 'old-line',
            tradeEntryId: 'old-trade',
            lineAmountChetrum: 999_000,
          }),
        ],
        openItems: [],
        inventoryItems: [
          inventoryItem(),
        ],
      })

    expect(
      report.registeredSalesChetrum,
    ).toBe(300_000)

    expect(
      report.recordedCashInChetrum,
    ).toBe(100_000)

    expect(
      report.verifiedSalesWithCogsChetrum,
    ).toBe(300_000)
  })

  it('marks gross-margin coverage incomplete when a sale document cannot be verified', () => {
    const report =
      buildBusinessReport({
        startDate: '2026-09-01',
        endDate: '2026-09-30',
        today: '2026-09-24',
        transactions: [],
        tradeEntries: [
          tradeEntry(),
        ],
        tradeLines: [],
        openItems: [],
        inventoryItems: [
          inventoryItem(),
        ],
      })

    expect(
      report.grossMarginCoverageComplete,
    ).toBe(false)

    expect(
      report.unverifiedSaleDocumentCount,
    ).toBe(1)

    expect(
      report.verifiedGrossMarginBeforeOtherBusinessExpensesChetrum,
    ).toBe(0)
  })

  it('uses current outstanding dues regardless of the report-period start', () => {
    const report =
      buildBusinessReport({
        startDate: '2026-09-01',
        endDate: '2026-09-30',
        today: '2026-09-24',
        transactions: [],
        tradeEntries: [],
        tradeLines: [],
        openItems: [
          openItem({
            date: '2026-01-10',
            dueDate: '2026-02-10',
          }),
        ],
        inventoryItems: [
          inventoryItem(),
        ],
      })

    expect(
      report.currentReceivablesChetrum,
    ).toBe(80_000)

    expect(
      report.overdueOpenItemCount,
    ).toBe(1)
  })

  it('rejects an invalid date range and invalid open-item balance', () => {
    expect(
      () =>
        buildBusinessReport({
          startDate: '2026-10-01',
          endDate: '2026-09-30',
          today: '2026-09-24',
          transactions: [],
          tradeEntries: [],
          tradeLines: [],
          openItems: [],
          inventoryItems: [],
        }),
    ).toThrow(
      'start date cannot be after its end date',
    )

    expect(
      () =>
        buildBusinessReport({
          startDate: '2026-09-01',
          endDate: '2026-09-30',
          today: '2026-09-24',
          transactions: [],
          tradeEntries: [],
          tradeLines: [],
          openItems: [
            openItem({
              originalAmountChetrum: 50_000,
              outstandingAmountChetrum: 60_000,
            }),
          ],
          inventoryItems: [],
        }),
    ).toThrow(
      'outstanding amount cannot exceed its original amount',
    )
  })
})