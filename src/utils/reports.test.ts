import {
  describe,
  expect,
  it,
} from 'vitest'

import type { MoneyTransaction } from '../types/transaction'
import {
  buildExpenseCategoryBreakdown,
  buildMonthlyTrend,
  calculateCashFlowRateBps,
  calculateShareBps,
  formatPercentBps,
  getMonthKeyOffset,
  summarizeMonth,
} from './reports'

function transaction(
  overrides: Partial<MoneyTransaction>,
): MoneyTransaction {
  return {
    id: crypto.randomUUID(),
    kind: 'expense',
    amountChetrum: 10000,
    category: 'Food',
    note: '',
    date: '2026-09-01',
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  }
}

describe('report utilities', () => {
  it('moves safely across year boundaries', () => {
    expect(getMonthKeyOffset('2026-01', -1)).toBe('2025-12')
    expect(getMonthKeyOffset('2026-12', 1)).toBe('2027-01')
  })

  it('summarizes only the selected month', () => {
    const records = [
      transaction({
        kind: 'income',
        amountChetrum: 100000,
        date: '2026-09-01',
      }),
      transaction({
        amountChetrum: 25000,
        date: '2026-09-02',
      }),
      transaction({
        amountChetrum: 99999,
        date: '2026-08-31',
      }),
    ]

    expect(
      summarizeMonth(records, '2026-09'),
    ).toEqual({
      month: '2026-09',
      incomeChetrum: 100000,
      expenseChetrum: 25000,
      netChetrum: 75000,
      transactionCount: 2,
    })
  })

  it('builds a fixed-length monthly trend ending at the selected month', () => {
    const trend = buildMonthlyTrend([], '2026-09', 3)

    expect(trend.map((item) => item.month)).toEqual([
      '2026-07',
      '2026-08',
      '2026-09',
    ])
  })

  it('calculates category share using integer basis points', () => {
    expect(calculateShareBps(25000, 100000)).toBe(2500)
    expect(formatPercentBps(2500)).toBe('25.00%')
  })

  it('calculates positive and negative cash-flow rates', () => {
    expect(
      calculateCashFlowRateBps(100000, 25000),
    ).toBe(2500)

    expect(
      calculateCashFlowRateBps(100000, -10000),
    ).toBe(-1000)

    expect(
      calculateCashFlowRateBps(0, 0),
    ).toBeNull()
  })

  it('groups expense categories from largest to smallest', () => {
    const records = [
      transaction({
        category: 'Food',
        amountChetrum: 30000,
      }),
      transaction({
        category: 'Transport',
        amountChetrum: 20000,
      }),
      transaction({
        category: 'Food',
        amountChetrum: 10000,
      }),
    ]

    const breakdown =
      buildExpenseCategoryBreakdown(records, '2026-09')

    expect(breakdown[0]).toMatchObject({
      category: 'Food',
      amountChetrum: 40000,
      transactionCount: 2,
      shareBps: 6666,
    })

    expect(breakdown[1]).toMatchObject({
      category: 'Transport',
      amountChetrum: 20000,
      transactionCount: 1,
      shareBps: 3333,
    })
  })
})
