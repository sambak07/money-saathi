import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  BusinessTradeEntry,
  BusinessTradeLine,
} from '../types/business'
import {
  summarizeBusinessTradeDocument,
} from './businessTrade'

function entry(
  overrides: Partial<BusinessTradeEntry> = {},
): BusinessTradeEntry {
  return {
    id: 'trade-1',
    businessId: 'business-1',
    kind: 'sale',
    partyName: 'Customer A',
    totalChetrum: 300_000,
    paidAtEntryChetrum: 200_000,
    paymentMethod: 'mixed',
    date: '2026-09-24',
    reference: 'INV-001',
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
    quantityMilliUnits: 1_000,
    lineAmountChetrum: 300_000,
    costOfGoodsSoldChetrum: 180_000,
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  }
}

describe('business trade document integrity', () => {
  it('summarizes unpaid-at-entry and explicit sale COGS', () => {
    expect(
      summarizeBusinessTradeDocument(
        entry(),
        [
          line(),
        ],
      ),
    ).toEqual({
      lineTotalChetrum: 300_000,
      unpaidAtEntryChetrum: 100_000,
      costOfGoodsSoldChetrum: 180_000,
      grossMarginBeforeOtherBusinessExpensesChetrum: 120_000,
    })
  })

  it('requires document total to equal line totals', () => {
    expect(
      () =>
        summarizeBusinessTradeDocument(
          entry({
            totalChetrum: 299_999,
          }),
          [
            line(),
          ],
        ),
    ).toThrow(
      'must equal the sum of its lines',
    )
  })

  it('rejects purchase-line COGS', () => {
    expect(
      () =>
        summarizeBusinessTradeDocument(
          entry({
            kind: 'purchase',
          }),
          [
            line({
              kind: 'purchase',
            }),
          ],
        ),
    ).toThrow(
      'Purchase lines cannot record cost of goods sold.',
    )
  })

  it('does not label purchase documents with a gross margin', () => {
    expect(
      summarizeBusinessTradeDocument(
        entry({
          kind: 'purchase',
          totalChetrum: 300_000,
          paidAtEntryChetrum: 300_000,
        }),
        [
          line({
            kind: 'purchase',
            costOfGoodsSoldChetrum: 0,
          }),
        ],
      )
        .grossMarginBeforeOtherBusinessExpensesChetrum,
    ).toBeNull()
  })

  it('requires every line to belong to the same document and business', () => {
    expect(
      () =>
        summarizeBusinessTradeDocument(
          entry(),
          [
            line({
              tradeEntryId:
                'other-trade',
            }),
          ],
        ),
    ).toThrow(
      'belongs to a different document',
    )

    expect(
      () =>
        summarizeBusinessTradeDocument(
          entry(),
          [
            line({
              businessId:
                'other-business',
            }),
          ],
        ),
    ).toThrow(
      'belongs to a different business',
    )
  })
})