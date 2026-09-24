import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  BusinessInventoryItem,
  BusinessTradeLine,
} from '../types/business'
import {
  summarizeBusinessInventory,
} from './businessInventory'

function item(
  overrides: Partial<BusinessInventoryItem> = {},
): BusinessInventoryItem {
  return {
    id: 'item-1',
    businessId: 'business-1',
    name: 'Engine oil',
    sku: '',
    unit: 'litre',
    openingQuantityMilliUnits: 10_000,
    currentUnitCostChetrum: 50_000,
    lowStockQuantityMilliUnits: 2_000,
    active: true,
    note: '',
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  }
}

function line(
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
    lineAmountChetrum: 160_000,
    costOfGoodsSoldChetrum: 100_000,
    createdAt: 2,
    updatedAt: 2,
    ...overrides,
  }
}

describe('business inventory and COGS summary', () => {
  it('derives quantity from opening stock plus purchases minus sales', () => {
    const summary =
      summarizeBusinessInventory(
        [
          item(),
        ],
        [
          line({
            id: 'purchase',
            kind: 'purchase',
            quantityMilliUnits: 5_000,
            lineAmountChetrum: 250_000,
            costOfGoodsSoldChetrum: 0,
          }),
          line({
            id: 'sale',
            quantityMilliUnits: 4_000,
            lineAmountChetrum: 320_000,
            costOfGoodsSoldChetrum: 200_000,
          }),
        ],
      )

    expect(
      summary.items[0]
        .quantityMilliUnits,
    ).toBe(11_000)

    expect(
      summary.costOfGoodsSoldChetrum,
    ).toBe(200_000)

    expect(
      summary.grossMarginBeforeOtherBusinessExpensesChetrum,
    ).toBe(120_000)
  })

  it('labels stock value as an estimate based on recorded current unit cost', () => {
    const summary =
      summarizeBusinessInventory(
        [
          item({
            openingQuantityMilliUnits: 1_500,
            currentUnitCostChetrum: 20_000,
          }),
        ],
        [],
      )

    expect(
      summary.estimatedStockValueChetrum,
    ).toBe(30_000)
  })

  it('flags negative inventory instead of hiding it', () => {
    const summary =
      summarizeBusinessInventory(
        [
          item({
            openingQuantityMilliUnits: 1_000,
          }),
        ],
        [
          line({
            quantityMilliUnits: 2_000,
          }),
        ],
      )

    expect(
      summary.negativeStockItemCount,
    ).toBe(1)

    expect(
      summary.items[0]
        .negativeQuantity,
    ).toBe(true)

    expect(
      summary.items[0]
        .estimatedStockValueChetrum,
    ).toBe(0)
  })

  it('rejects COGS on purchase lines', () => {
    expect(
      () =>
        summarizeBusinessInventory(
          [
            item(),
          ],
          [
            line({
              kind: 'purchase',
              costOfGoodsSoldChetrum: 1,
            }),
          ],
        ),
    ).toThrow(
      'Purchase trade lines cannot record cost of goods sold.',
    )
  })
})