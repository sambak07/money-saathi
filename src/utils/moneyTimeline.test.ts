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
  buildMoneyTimeline,
  timelineDateLabel,
} from './moneyTimeline'

function regular(
  overrides: Partial<RegularMoney>,
): RegularMoney {
  return {
    id: 'regular-1',
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
    id: 'transaction-1',
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

describe('upcoming money timeline', () => {
  it('summarizes unrecorded recurring money in the selected horizon', () => {
    const result = buildMoneyTimeline(
      '2026-09-22',
      30,
      [
        regular({
          id: 'rent',
          amountChetrum: 150_000,
        }),
        regular({
          id: 'salary',
          kind: 'income',
          name: 'Salary',
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

    expect(result.items).toHaveLength(2)
  })

  it('does not show a recurring occurrence already recorded', () => {
    const result = buildMoneyTimeline(
      '2026-09-22',
      30,
      [
        regular({
          id: 'rent',
        }),
      ],
      [
        transaction({
          recurringSourceId: 'rent',
          scheduledFor: '2026-09-25',
        }),
      ],
      [],
    )

    expect(result.items).toEqual([])
    expect(
      result.expectedExpenseChetrum,
    ).toBe(0)
  })

  it('shows scheme contributions only as references and does not double-count them', () => {
    const result = buildMoneyTimeline(
      '2026-09-22',
      30,
      [],
      [],
      [
        scheme({
          contributionChetrum: 80_000,
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

  it('excludes inactive scheme references', () => {
    const result = buildMoneyTimeline(
      '2026-09-22',
      30,
      [],
      [],
      [
        scheme({
          status: 'closed',
        }),
      ],
    )

    expect(
      result.schemeReferences,
    ).toEqual([])
  })

  it('labels today and tomorrow clearly', () => {
    expect(
      timelineDateLabel(
        '2026-09-22',
        '2026-09-22',
      ),
    ).toBe('Today')

    expect(
      timelineDateLabel(
        '2026-09-22',
        '2026-09-23',
      ),
    ).toBe('Tomorrow')
  })

  it('rejects unsupported timeline ranges', () => {
    expect(() =>
      buildMoneyTimeline(
        '2026-09-22',
        367,
        [],
        [],
        [],
      ),
    ).toThrow()
  })
})
