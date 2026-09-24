import {
  describe,
  expect,
  it,
} from 'vitest'

import type { RegularMoney } from '../types/regularMoney'
import {
  generateOccurrencesBetween,
  getMonthBounds,
  getNextOccurrence,
  regularOccurrenceTransactionId,
} from './recurrence'

function regular(
  overrides: Partial<RegularMoney> = {},
): RegularMoney {
  return {
    id: 'test',
    name: 'Test',
    kind: 'expense',
    amountChetrum: 10000,
    category: 'Bills',
    frequency: 'monthly',
    startDate: '2026-01-31',
    endDate: '',
    note: '',
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  }
}

describe('recurrence utilities', () => {
  it('keeps a monthly schedule anchored to the original day', () => {
    const item = regular()

    expect(
      generateOccurrencesBetween(
        item,
        '2026-01-01',
        '2026-03-31',
      ),
    ).toEqual([
      '2026-01-31',
      '2026-02-28',
      '2026-03-31',
    ])
  })

  it('handles leap-day yearly schedules', () => {
    const item = regular({
      frequency: 'yearly',
      startDate: '2024-02-29',
    })

    expect(
      generateOccurrencesBetween(
        item,
        '2024-01-01',
        '2028-12-31',
      ),
    ).toEqual([
      '2024-02-29',
      '2025-02-28',
      '2026-02-28',
      '2027-02-28',
      '2028-02-29',
    ])
  })

  it('respects schedule end dates', () => {
    const item = regular({
      endDate: '2026-02-28',
    })

    expect(
      generateOccurrencesBetween(
        item,
        '2026-01-01',
        '2026-12-31',
      ),
    ).toEqual([
      '2026-01-31',
      '2026-02-28',
    ])
  })

  it('finds the next occurrence strictly after the supplied date', () => {
    const item = regular()

    expect(
      getNextOccurrence(
        item,
        '2026-02-28',
      ),
    ).toBe('2026-03-31')
  })

  it('gets leap-year month bounds correctly', () => {
    expect(
      getMonthBounds('2028-02'),
    ).toEqual({
      start: '2028-02-01',
      end: '2028-02-29',
    })
  })

  it('builds a stable unique transaction ID for each scheduled occurrence', () => {
    expect(
      regularOccurrenceTransactionId(
        'rent',
        '2026-09-01',
      ),
    ).toBe('regular:rent:2026-09-01')

    expect(
      regularOccurrenceTransactionId(
        'rent',
        '2026-10-01',
      ),
    ).not.toBe(
      regularOccurrenceTransactionId(
        'rent',
        '2026-09-01',
      ),
    )
  })
})
