import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  RegularMoney,
} from '../types/regularMoney'
import type {
  MoneyTransaction,
} from '../types/transaction'
import {
  buildCashFlowForecast,
  buildStandardCashFlowForecasts,
} from './cashFlowForecast'

function transaction(
  partial: Partial<MoneyTransaction> &
    Pick<
      MoneyTransaction,
      'id' | 'kind' | 'amountChetrum' | 'date'
    >,
): MoneyTransaction {
  return {
    category: 'Other',
    note: '',
    createdAt: 1,
    updatedAt: 1,
    ...partial,
  }
}

function regular(
  partial: Partial<RegularMoney> &
    Pick<
      RegularMoney,
      'id' | 'name' | 'kind' | 'amountChetrum' | 'startDate'
    >,
): RegularMoney {
  return {
    category: 'Other',
    frequency: 'monthly',
    endDate: '',
    note: '',
    createdAt: 1,
    updatedAt: 1,
    ...partial,
  }
}

describe('cash-flow forecast', () => {
  it('starts from recorded money only and then applies future scheduled events', () => {
    const result =
      buildCashFlowForecast(
        '2026-09-10',
        30,
        [
          regular({
            id: 'salary',
            name: 'Salary',
            kind: 'income',
            amountChetrum: 50_000,
            startDate: '2026-09-20',
          }),
          regular({
            id: 'rent',
            name: 'Rent',
            kind: 'expense',
            amountChetrum: 30_000,
            startDate: '2026-09-15',
          }),
        ],
        [
          transaction({
            id: 'opening-income',
            kind: 'income',
            amountChetrum: 100_000,
            date: '2026-09-01',
          }),
        ],
        10_000,
      )

    expect(
      result.openingRecordedBalanceChetrum,
    ).toBe(100_000)

    expect(
      result.scheduledIncomeChetrum,
    ).toBe(50_000)

    expect(
      result.scheduledExpenseChetrum,
    ).toBe(30_000)

    expect(
      result.projectedEndBalanceChetrum,
    ).toBe(120_000)
  })

  it('does not double count a scheduled occurrence already recorded', () => {
    const result =
      buildCashFlowForecast(
        '2026-09-10',
        30,
        [
          regular({
            id: 'rent',
            name: 'Rent',
            kind: 'expense',
            amountChetrum: 30_000,
            startDate: '2026-09-15',
          }),
        ],
        [
          transaction({
            id: 'opening-income',
            kind: 'income',
            amountChetrum: 100_000,
            date: '2026-09-01',
          }),
          transaction({
            id: 'rent-recorded',
            kind: 'expense',
            amountChetrum: 30_000,
            date: '2026-09-10',
            recurringSourceId: 'rent',
            scheduledFor: '2026-09-15',
          }),
        ],
        0,
      )

    expect(
      result.openingRecordedBalanceChetrum,
    ).toBe(70_000)

    expect(
      result.scheduledExpenseChetrum,
    ).toBe(0)

    expect(
      result.projectedEndBalanceChetrum,
    ).toBe(70_000)
  })

  it('finds the lowest scheduled balance in event order', () => {
    const result =
      buildCashFlowForecast(
        '2026-09-10',
        30,
        [
          regular({
            id: 'rent',
            name: 'Rent',
            kind: 'expense',
            amountChetrum: 80_000,
            startDate: '2026-09-12',
          }),
          regular({
            id: 'salary',
            name: 'Salary',
            kind: 'income',
            amountChetrum: 100_000,
            startDate: '2026-09-20',
          }),
        ],
        [
          transaction({
            id: 'opening-income',
            kind: 'income',
            amountChetrum: 50_000,
            date: '2026-09-01',
          }),
        ],
        10_000,
      )

    expect(
      result.lowestProjectedBalanceChetrum,
    ).toBe(-30_000)

    expect(
      result.lowestProjectedBalanceDate,
    ).toBe('2026-09-12')

    expect(
      result.lowestAfterBufferChetrum,
    ).toBe(-40_000)

    expect(
      result.projectedEndBalanceChetrum,
    ).toBe(70_000)
  })

  it('ignores transactions dated in the future when calculating the opening balance', () => {
    const result =
      buildCashFlowForecast(
        '2026-09-10',
        30,
        [],
        [
          transaction({
            id: 'recorded',
            kind: 'income',
            amountChetrum: 50_000,
            date: '2026-09-01',
          }),
          transaction({
            id: 'future-manual',
            kind: 'income',
            amountChetrum: 500_000,
            date: '2026-09-20',
          }),
        ],
        0,
      )

    expect(
      result.openingRecordedBalanceChetrum,
    ).toBe(50_000)

    expect(
      result.projectedEndBalanceChetrum,
    ).toBe(50_000)
  })

  it('builds exactly the standard 30, 60 and 90 day horizons', () => {
    const results =
      buildStandardCashFlowForecasts(
        '2026-09-10',
        [],
        [],
        0,
      )

    expect(
      results.map(
        (item) =>
          item.daysAhead,
      ),
    ).toEqual([
      30,
      60,
      90,
    ])
  })
})