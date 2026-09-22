import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  BusinessTransaction,
} from '../types/business'
import {
  summarizeBusinessTransactions,
} from './business'

function transaction(
  overrides: Partial<BusinessTransaction>,
): BusinessTransaction {
  return {
    id: 't1',
    businessId: 'b1',
    kind: 'income',
    amountChetrum: 100,
    category: 'Sales',
    note: '',
    date: '2026-09-22',
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  }
}

describe('business financial summary', () => {
  it('keeps business inflow and outflow separate', () => {
    expect(
      summarizeBusinessTransactions([
        transaction({
          id: 'income',
          amountChetrum: 1_000_000,
        }),
        transaction({
          id: 'expense',
          kind: 'expense',
          amountChetrum: 400_000,
        }),
      ]),
    ).toEqual({
      moneyInChetrum: 1_000_000,
      moneyOutChetrum: 400_000,
      netCashChetrum: 600_000,
    })
  })

  it('does not use floating-point money arithmetic', () => {
    expect(
      summarizeBusinessTransactions([
        transaction({
          amountChetrum:
            Number.MAX_SAFE_INTEGER,
        }),
      ]).moneyInChetrum,
    ).toBe(Number.MAX_SAFE_INTEGER)
  })

  it('rejects unsafe business money values', () => {
    expect(() =>
      summarizeBusinessTransactions([
        transaction({
          amountChetrum:
            Number.MAX_SAFE_INTEGER + 1,
        }),
      ]),
    ).toThrow()
  })
})
