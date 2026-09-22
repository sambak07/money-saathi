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
  calculateSafeToSpend,
  formatChetrumForSafetyInput,
  parseNuInputToChetrum,
} from './safeToSpend'

function regular(
  overrides: Partial<RegularMoney>,
): RegularMoney {
  return {
    id: 'regular-1',
    name: 'Regular money',
    kind: 'expense',
    amountChetrum: 1_000,
    category: 'Other',
    frequency: 'monthly',
    startDate: '2026-09-01',
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
    amountChetrum: 1_000,
    category: 'Other',
    note: '',
    date: '2026-09-25',
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  }
}

describe('Safe to Spend', () => {
  it('parses Nu. input exactly into integer chetrum', () => {
    expect(
      parseNuInputToChetrum('10000.05'),
    ).toBe(1_000_005)

    expect(
      parseNuInputToChetrum('0.01'),
    ).toBe(1)

    expect(
      parseNuInputToChetrum('10.999'),
    ).toBeNull()
  })

  it('formats safety-buffer values without floating-point money arithmetic', () => {
    expect(
      formatChetrumForSafetyInput(1_000_005),
    ).toBe('10000.05')
  })

  it('subtracts upcoming commitments and protected buffer from recorded balance', () => {
    const result = calculateSafeToSpend(
      '2026-09-22',
      4_000_000,
      [
        regular({
          id: 'rent',
          amountChetrum: 1_850_000,
          startDate: '2026-09-25',
        }),
        regular({
          id: 'salary',
          kind: 'income',
          amountChetrum: 6_000_000,
          startDate: '2026-09-30',
        }),
      ],
      [],
      1_000_000,
    )

    expect(
      result.safeToSpendChetrum,
    ).toBe(1_150_000)

    expect(
      result.upcomingCommitmentsChetrum,
    ).toBe(1_850_000)

    expect(
      result.nextExpectedIncomeDate,
    ).toBe('2026-09-30')
  })

  it('does not add future income into Safe to Spend', () => {
    const result = calculateSafeToSpend(
      '2026-09-22',
      1_000_000,
      [
        regular({
          id: 'salary',
          kind: 'income',
          amountChetrum: 10_000_000,
          startDate: '2026-09-25',
        }),
      ],
      [],
      0,
    )

    expect(
      result.safeToSpendChetrum,
    ).toBe(1_000_000)
  })

  it('does not subtract a recurring commitment already recorded for that date', () => {
    const result = calculateSafeToSpend(
      '2026-09-22',
      4_000_000,
      [
        regular({
          id: 'rent',
          amountChetrum: 1_850_000,
          startDate: '2026-09-25',
        }),
        regular({
          id: 'salary',
          kind: 'income',
          amountChetrum: 6_000_000,
          startDate: '2026-09-30',
        }),
      ],
      [
        transaction({
          recurringSourceId: 'rent',
          scheduledFor: '2026-09-25',
        }),
      ],
      1_000_000,
    )

    expect(
      result.upcomingCommitmentsChetrum,
    ).toBe(0)

    expect(
      result.safeToSpendChetrum,
    ).toBe(3_000_000)
  })

  it('uses month end when no scheduled income is available', () => {
    const result = calculateSafeToSpend(
      '2026-09-22',
      2_000_000,
      [
        regular({
          id: 'rent',
          amountChetrum: 500_000,
          startDate: '2026-09-29',
        }),
      ],
      [],
      0,
    )

    expect(
      result.horizonDate,
    ).toBe('2026-09-30')

    expect(
      result.safeToSpendChetrum,
    ).toBe(1_500_000)
  })

  it('never presents a negative Safe to Spend amount', () => {
    const result = calculateSafeToSpend(
      '2026-09-22',
      -50_000,
      [],
      [],
      10_000,
    )

    expect(
      result.safeToSpendChetrum,
    ).toBe(0)
  })
})
