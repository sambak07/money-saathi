import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  MoneyTransaction,
} from '../types/transaction'
import {
  buildMonthlyTransactionsCsv,
  formatChetrumForCsv,
  getMonthlyTransactionsCsvFilename,
} from './reportExport'

function transaction(
  overrides:
    Partial<MoneyTransaction> = {},
): MoneyTransaction {
  return {
    id:
      'transaction-1',
    kind:
      'expense',
    amountChetrum:
      1_116_667,
    category:
      'Food',
    note:
      '',
    date:
      '2026-09-25',
    createdAt:
      1,
    updatedAt:
      1,
    ...overrides,
  }
}

describe('monthly report CSV export', () => {
  it('formats integer chetrum without floating-point money math', () => {
    expect(
      formatChetrumForCsv(
        1_116_667,
      ),
    ).toBe(
      '11166.67',
    )

    expect(
      formatChetrumForCsv(
        5,
      ),
    ).toBe(
      '0.05',
    )
  })

  it('exports fields and quotes CSV text', () => {
    const csv =
      buildMonthlyTransactionsCsv([
        transaction({
          category:
            'Food, home',
          note:
            'He said "paid"',
        }),
      ])

    expect(csv).toContain(
      '"Food, home"',
    )

    expect(csv).toContain(
      '"He said ""paid"""',
    )

    expect(csv).toContain(
      '"11166.67"',
    )
  })

  it('protects user-entered text from spreadsheet formula execution', () => {
    const csv =
      buildMonthlyTransactionsCsv([
        transaction({
          category:
            '=SUM(A1:A2)',
          note:
            '@command',
        }),
      ])

    expect(csv).toContain(
      '"\'=SUM(A1:A2)"',
    )

    expect(csv).toContain(
      '"\'@command"',
    )
  })

  it('builds a stable month-specific filename', () => {
    expect(
      getMonthlyTransactionsCsvFilename(
        '2026-09',
      ),
    ).toBe(
      'money-saathi-2026-09-transactions.csv',
    )

    expect(() =>
      getMonthlyTransactionsCsvFilename(
        '2026-13',
      ),
    ).toThrow()
  })
})
