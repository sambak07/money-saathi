import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  BusinessTradeEntry,
} from '../types/business'
import {
  summarizeBusinessTradeEntries,
} from './businessTrade'

function entry(
  overrides: Partial<BusinessTradeEntry>,
): BusinessTradeEntry {
  return {
    id: 'trade-1',
    businessId: 'business-1',
    kind: 'sale',
    partyName: '',
    totalChetrum: 100_000,
    paidAtEntryChetrum: 100_000,
    paymentMethod: 'cash',
    date: '2026-09-24',
    reference: '',
    note: '',
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  }
}

describe('business sales and purchases summary', () => {
  it('separates sales from purchases without calling the difference profit', () => {
    expect(
      summarizeBusinessTradeEntries([
        entry({
          id: 'sale',
          totalChetrum: 1_000_000,
          paidAtEntryChetrum: 600_000,
          paymentMethod: 'mixed',
        }),
        entry({
          id: 'purchase',
          kind: 'purchase',
          totalChetrum: 400_000,
          paidAtEntryChetrum: 100_000,
          paymentMethod: 'mixed',
        }),
      ]),
    ).toEqual({
      salesChetrum: 1_000_000,
      purchasesChetrum: 400_000,
      paidAtSaleChetrum: 600_000,
      paidAtPurchaseChetrum: 100_000,
      creditSalesAtEntryChetrum: 400_000,
      creditPurchasesAtEntryChetrum: 300_000,
      salesLessPurchasesChetrum: 600_000,
      saleCount: 1,
      purchaseCount: 1,
    })
  })

  it('treats unpaid amount as credit at entry, not current outstanding balance', () => {
    const summary =
      summarizeBusinessTradeEntries([
        entry({
          totalChetrum: 500_000,
          paidAtEntryChetrum: 200_000,
          paymentMethod: 'mixed',
        }),
      ])

    expect(
      summary.creditSalesAtEntryChetrum,
    ).toBe(300_000)
  })

  it('rejects paid-at-entry above document total', () => {
    expect(
      () =>
        summarizeBusinessTradeEntries([
          entry({
            totalChetrum: 100_000,
            paidAtEntryChetrum: 120_000,
          }),
        ]),
    ).toThrow(
      'cannot exceed its total',
    )
  })

  it('uses integer chetrum totals safely', () => {
    expect(
      summarizeBusinessTradeEntries([
        entry({
          totalChetrum:
            Number.MAX_SAFE_INTEGER,
          paidAtEntryChetrum:
            Number.MAX_SAFE_INTEGER,
        }),
      ]).salesChetrum,
    ).toBe(
      Number.MAX_SAFE_INTEGER,
    )
  })
})