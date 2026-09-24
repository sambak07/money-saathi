import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  MoneyTransaction,
} from '../types/transaction'
import {
  isFutureTransactionDate,
  preserveRecurringMetadata,
} from './transactionIntegrity'

function transaction(
  overrides: Partial<MoneyTransaction> = {},
): MoneyTransaction {
  return {
    id: 't1',
    kind: 'expense',
    amountChetrum: 1_000,
    category: 'Bills',
    note: '',
    date: '2026-09-22',
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  }
}

describe('transaction integrity', () => {
  it('preserves the schedule identity of an edited recurring transaction', () => {
    expect(
      preserveRecurringMetadata(
        transaction({
          recurringSourceId: 'rent',
          scheduledFor: '2026-09-21',
        }),
      ),
    ).toEqual({
      recurringSourceId: 'rent',
      scheduledFor: '2026-09-21',
    })
  })

  it('does not invent recurrence metadata for an ordinary transaction', () => {
    expect(
      preserveRecurringMetadata(
        transaction(),
      ),
    ).toEqual({})
  })

  it('detects future transaction dates using ISO local dates', () => {
    expect(
      isFutureTransactionDate(
        '2026-09-23',
        '2026-09-22',
      ),
    ).toBe(true)

    expect(
      isFutureTransactionDate(
        '2026-09-22',
        '2026-09-22',
      ),
    ).toBe(false)
  })
})