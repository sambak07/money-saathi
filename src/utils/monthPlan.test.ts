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
  buildMonthPlan,
} from './monthPlan'

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

describe('My Month planning engine', () => {
  it('keeps future scheduled income outside current Safe to Spend and current month room', () => {
    const result =
      buildMonthPlan(
        '2026-09-10',
        [
          transaction({
            id: 'income-1',
            kind: 'income',
            amountChetrum: 100_000,
            date: '2026-09-01',
          }),
        ],
        [
          regular({
            id: 'salary-2',
            name: 'Later salary',
            kind: 'income',
            amountChetrum: 200_000,
            startDate: '2026-09-20',
          }),
        ],
        10_000,
      )

    expect(
      result.scheduledIncomeRemainingChetrum,
    ).toBe(200_000)

    expect(
      result.recordedBalanceChetrum,
    ).toBe(100_000)

    expect(
      result.conservativeMonthRoomChetrum,
    ).toBe(90_000)

    expect(
      result.safeToSpend.safeToSpendChetrum,
    ).toBe(90_000)
  })

  it('subtracts all unrecorded scheduled expenses from conservative month room', () => {
    const result =
      buildMonthPlan(
        '2026-09-10',
        [
          transaction({
            id: 'income-1',
            kind: 'income',
            amountChetrum: 100_000,
            date: '2026-09-01',
          }),
        ],
        [
          regular({
            id: 'rent',
            name: 'Rent',
            kind: 'expense',
            amountChetrum: 30_000,
            startDate: '2026-09-15',
          }),
          regular({
            id: 'phone',
            name: 'Phone',
            kind: 'expense',
            amountChetrum: 5_000,
            startDate: '2026-09-25',
          }),
        ],
        10_000,
      )

    expect(
      result.scheduledExpenseRemainingChetrum,
    ).toBe(35_000)

    expect(
      result.conservativeMonthRoomChetrum,
    ).toBe(55_000)
  })

  it('does not double count a Regular Money occurrence already recorded', () => {
    const result =
      buildMonthPlan(
        '2026-09-20',
        [
          transaction({
            id: 'income-1',
            kind: 'income',
            amountChetrum: 100_000,
            date: '2026-09-01',
          }),
          transaction({
            id: 'rent-recorded',
            kind: 'expense',
            amountChetrum: 30_000,
            date: '2026-09-15',
            recurringSourceId: 'rent',
            scheduledFor: '2026-09-15',
          }),
        ],
        [
          regular({
            id: 'rent',
            name: 'Rent',
            kind: 'expense',
            amountChetrum: 30_000,
            startDate: '2026-09-15',
          }),
        ],
        10_000,
      )

    expect(
      result.scheduledExpenseRemainingChetrum,
    ).toBe(0)

    expect(
      result.recordedExpenseChetrum,
    ).toBe(30_000)

    expect(
      result.conservativeMonthRoomChetrum,
    ).toBe(60_000)
  })

  it('surfaces overdue scheduled expenses but does not invent missed past income', () => {
    const result =
      buildMonthPlan(
        '2026-09-20',
        [],
        [
          regular({
            id: 'rent',
            name: 'Rent',
            kind: 'expense',
            amountChetrum: 30_000,
            startDate: '2026-09-05',
          }),
          regular({
            id: 'salary',
            name: 'Salary',
            kind: 'income',
            amountChetrum: 100_000,
            startDate: '2026-09-05',
          }),
        ],
        0,
      )

    expect(
      result.overdueExpenseCount,
    ).toBe(1)

    expect(
      result.overdueExpenseChetrum,
    ).toBe(30_000)

    expect(
      result.scheduledIncomeRemainingChetrum,
    ).toBe(0)
  })

  it('produces a scheduled month outlook without calling it current cash', () => {
    const result =
      buildMonthPlan(
        '2026-09-10',
        [
          transaction({
            id: 'income-1',
            kind: 'income',
            amountChetrum: 100_000,
            date: '2026-09-01',
          }),
          transaction({
            id: 'expense-1',
            kind: 'expense',
            amountChetrum: 20_000,
            date: '2026-09-03',
          }),
        ],
        [
          regular({
            id: 'later-income',
            name: 'Later income',
            kind: 'income',
            amountChetrum: 50_000,
            startDate: '2026-09-20',
          }),
          regular({
            id: 'later-expense',
            name: 'Later expense',
            kind: 'expense',
            amountChetrum: 30_000,
            startDate: '2026-09-25',
          }),
        ],
        0,
      )

    expect(
      result.recordedMonthNetChetrum,
    ).toBe(80_000)

    expect(
      result.projectedMonthNetChetrum,
    ).toBe(100_000)
  })
})