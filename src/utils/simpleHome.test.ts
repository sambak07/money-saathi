import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  MoneyTransaction,
} from '../types/transaction'
import {
  summarizeSimpleMonth,
  transactionBalanceChetrum,
} from './simpleHome'

function transaction(
  overrides: Partial<MoneyTransaction>,
): MoneyTransaction {
  return {
    id: 't1',
    kind: 'income',
    amountChetrum: 100,
    category: 'Other',
    note: '',
    date: '2026-09-22',
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  }
}

describe('Simple Home money summary', () => {
  it('summarizes the selected calendar month', () => {
    expect(
      summarizeSimpleMonth(
        '2026-09',
        [
          transaction({
            id: 'in',
            amountChetrum: 1_000,
          }),
          transaction({
            id: 'out',
            kind: 'expense',
            amountChetrum: 350,
          }),
          transaction({
            id: 'old',
            amountChetrum: 999,
            date: '2026-08-22',
          }),
        ],
      ),
    ).toEqual({
      incomeChetrum: 1_000,
      expenseChetrum: 350,
      netChetrum: 650,
    })
  })

  it('calculates all-time recorded transaction balance', () => {
    expect(
      transactionBalanceChetrum([
        transaction({
          id: 'in',
          amountChetrum: 1_000,
        }),
        transaction({
          id: 'out',
          kind: 'expense',
          amountChetrum: 400,
        }),
      ]),
    ).toBe(600)
  })

  it('excludes future transactions from an as-of recorded balance', () => {
    expect(
      transactionBalanceChetrum(
        [
          transaction({
            id: 'today',
            amountChetrum: 1_000,
            date: '2026-09-22',
          }),
          transaction({
            id: 'future',
            amountChetrum: 10_000,
            date: '2026-10-01',
          }),
        ],
        '2026-09-22',
      ),
    ).toBe(1_000)
  })
})
