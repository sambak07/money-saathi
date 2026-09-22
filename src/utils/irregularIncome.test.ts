import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  MoneyTransaction,
} from '../types/transaction'
import {
  buildIrregularIncomeSnapshot,
  comparePlanningFloor,
} from './irregularIncome'

function transaction(
  overrides: Partial<MoneyTransaction>,
): MoneyTransaction {
  return {
    id: 't1',
    kind: 'income',
    amountChetrum: 100,
    category: 'Other',
    note: '',
    date: '2026-09-10',
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  }
}

describe('irregular income analysis', () => {
  it('builds six calendar months without forecasting future income', () => {
    const snapshot =
      buildIrregularIncomeSnapshot(
        '2026-09',
        [
          transaction({
            id: 'july',
            amountChetrum: 500_000,
            date: '2026-07-10',
          }),
          transaction({
            id: 'aug',
            amountChetrum: 200_000,
            date: '2026-08-10',
          }),
          transaction({
            id: 'sep',
            amountChetrum: 800_000,
            date: '2026-09-10',
          }),
        ],
      )

    expect(snapshot.months).toHaveLength(6)
    expect(
      snapshot.currentMonthIncomeChetrum,
    ).toBe(800_000)

    expect(
      snapshot.lowestPositiveIncomeChetrum,
    ).toBe(200_000)

    expect(
      snapshot.highestIncomeChetrum,
    ).toBe(800_000)
  })

  it('averages recorded income across months containing any recorded activity', () => {
    const snapshot =
      buildIrregularIncomeSnapshot(
        '2026-09',
        [
          transaction({
            id: 'july-income',
            amountChetrum: 600,
            date: '2026-07-10',
          }),
          transaction({
            id: 'aug-expense',
            kind: 'expense',
            amountChetrum: 100,
            date: '2026-08-10',
          }),
          transaction({
            id: 'sep-income',
            amountChetrum: 300,
            date: '2026-09-10',
          }),
        ],
      )

    expect(
      snapshot.activeMonths,
    ).toBe(3)

    expect(
      snapshot.averageIncomeAcrossActiveMonthsChetrum,
    ).toBe(300)

    expect(
      snapshot.zeroIncomeActiveMonths,
    ).toBe(1)
  })

  it('compares a user-chosen planning floor without calling it a forecast', () => {
    expect(
      comparePlanningFloor(
        500_000,
        350_000,
      ),
    ).toEqual({
      floorChetrum: 500_000,
      currentMonthIncomeChetrum:
        350_000,
      remainingToFloorChetrum:
        150_000,
      amountAboveFloorChetrum: 0,
    })
  })
})
