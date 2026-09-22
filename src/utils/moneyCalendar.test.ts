import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  FinancialScheme,
} from '../types/scheme'
import type {
  RegularMoney,
} from '../types/regularMoney'
import type {
  MoneyTransaction,
} from '../types/transaction'
import {
  buildMoneyCalendarMonth,
  getCalendarMonthBounds,
  groupCalendarItemsByDate,
  shiftCalendarMonth,
} from './moneyCalendar'

function regular(
  overrides: Partial<RegularMoney>,
): RegularMoney {
  return {
    id: 'rent',
    name: 'Rent',
    kind: 'expense',
    amountChetrum: 100_000,
    category: 'Housing',
    frequency: 'monthly',
    startDate: '2026-09-25',
    endDate: '',
    note: '',
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  }
}

function transaction(
  overrides: Partial<MoneyTransaction>,
): MoneyTransaction {
  return {
    id: 't1',
    kind: 'expense',
    amountChetrum: 100_000,
    category: 'Housing',
    note: '',
    date: '2026-09-25',
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  }
}

function scheme(
  overrides: Partial<FinancialScheme>,
): FinancialScheme {
  return {
    id: 'scheme-1',
    name: 'Protection plan',
    provider: 'Provider',
    category: 'endowment',
    status: 'active',
    contributionChetrum: 50_000,
    contributionFrequency: 'monthly',
    currentValueChetrum: 0,
    protectionCoverChetrum: 0,
    futureBenefitChetrum: 0,
    startDate: '2026-01-01',
    nextContributionDate: '2026-09-28',
    maturityDate: '',
    note: '',
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  }
}

describe('monthly money calendar', () => {
  it('calculates valid month boundaries including leap February', () => {
    expect(
      getCalendarMonthBounds(
        '2028-02',
      ),
    ).toEqual({
      startDate: '2028-02-01',
      endDate: '2028-02-29',
    })
  })

  it('moves across year boundaries', () => {
    expect(
      shiftCalendarMonth(
        '2026-12',
        1,
      ),
    ).toBe('2027-01')

    expect(
      shiftCalendarMonth(
        '2027-01',
        -1,
      ),
    ).toBe('2026-12')
  })

  it('summarizes unrecorded recurring money for one calendar month', () => {
    const result =
      buildMoneyCalendarMonth(
        '2026-09',
        [
          regular({
            id: 'rent',
            amountChetrum: 150_000,
          }),
          regular({
            id: 'salary',
            name: 'Salary',
            kind: 'income',
            category: 'Salary',
            amountChetrum: 500_000,
            startDate: '2026-09-30',
          }),
        ],
        [],
        [],
      )

    expect(
      result.expectedIncomeChetrum,
    ).toBe(500_000)

    expect(
      result.expectedExpenseChetrum,
    ).toBe(150_000)

    expect(
      result.items,
    ).toHaveLength(2)
  })

  it('removes recurring occurrences already recorded as transactions', () => {
    const result =
      buildMoneyCalendarMonth(
        '2026-09',
        [
          regular({
            id: 'rent',
          }),
        ],
        [
          transaction({
            recurringSourceId:
              'rent',
            scheduledFor:
              '2026-09-25',
          }),
        ],
        [],
      )

    expect(
      result.items,
    ).toEqual([])

    expect(
      result.expectedExpenseChetrum,
    ).toBe(0)
  })

  it('keeps scheme contribution dates as separate references', () => {
    const result =
      buildMoneyCalendarMonth(
        '2026-09',
        [],
        [],
        [
          scheme({
            contributionChetrum:
              80_000,
          }),
        ],
      )

    expect(
      result.schemeReferences,
    ).toHaveLength(1)

    expect(
      result.expectedExpenseChetrum,
    ).toBe(0)
  })

  it('groups scheduled items by date', () => {
    const result =
      buildMoneyCalendarMonth(
        '2026-09',
        [
          regular({
            id: 'rent',
          }),
          regular({
            id: 'internet',
            name: 'Internet',
            amountChetrum: 20_000,
          }),
        ],
        [],
        [],
      )

    expect(
      groupCalendarItemsByDate(
        result.items,
      ),
    ).toHaveLength(1)
  })
})
