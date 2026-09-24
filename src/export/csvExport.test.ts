import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  BusinessProfile,
  BusinessTransaction,
} from '../types/business'
import type {
  MoneyTransaction,
} from '../types/transaction'
import {
  buildBusinessTransactionsCsv,
  buildPersonalTransactionsCsv,
  chetrumToNuText,
  escapeCsvCell,
  safeExportFileName,
} from './csvExport'

function personal(
  overrides: Partial<MoneyTransaction>,
): MoneyTransaction {
  return {
    id: 'p1',
    kind: 'expense',
    amountChetrum: 12345,
    category: 'Food',
    note: '',
    date: '2026-09-22',
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  }
}

function businessTransaction(
  overrides: Partial<BusinessTransaction>,
): BusinessTransaction {
  return {
    id: 'btx1',
    businessId: 'b1',
    kind: 'income',
    amountChetrum: 50000,
    category: 'Sales',
    note: '',
    date: '2026-09-22',
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  }
}

const business: BusinessProfile = {
  id: 'b1',
  name: 'Druk Shop',
  createdAt: 1,
  updatedAt: 1,
}

describe('CSV data export', () => {
  it('formats chetrum exactly without floating-point money arithmetic', () => {
    expect(
      chetrumToNuText(12345),
    ).toBe('123.45')

    expect(
      chetrumToNuText(5),
    ).toBe('0.05')
  })

  it('escapes commas, quotes and new lines', () => {
    expect(
      escapeCsvCell(
        'Lunch, "Trongsa"\nToday',
      ),
    ).toBe(
      '"Lunch, ""Trongsa""\nToday"',
    )
  })

  it('protects user-entered spreadsheet formulas', () => {
    expect(
      escapeCsvCell(
        '=SUM(A1:A2)',
        true,
      ),
    ).toBe(
      "'=SUM(A1:A2)",
    )

    expect(
      escapeCsvCell(
        '@command',
        true,
      ),
    ).toBe(
      "'@command",
    )

    expect(
      escapeCsvCell(
        '\t=SUM(A1:A2)',
        true,
      ),
    ).toBe(
      "'\t=SUM(A1:A2)",
    )
  })

  it('exports personal transactions with a UTF-8 BOM', () => {
    const csv =
      buildPersonalTransactionsCsv([
        personal({
          category: '=Danger',
          note: 'Tea, snacks',
        }),
      ])

    expect(
      csv.startsWith('\uFEFF'),
    ).toBe(true)

    expect(csv).toContain('123.45')
    expect(csv).toContain("'=Danger")
    expect(csv).toContain(
      '"Tea, snacks"',
    )
  })

  it('keeps business export separate from personal data', () => {
    const csv =
      buildBusinessTransactionsCsv(
        business,
        [
          businessTransaction({
            amountChetrum: 98765,
          }),
        ],
      )

    expect(csv).toContain('Druk Shop')
    expect(csv).toContain('987.65')
    expect(csv).not.toContain(
      'Recurring source ID',
    )
  })

  it('creates safe filenames', () => {
    expect(
      safeExportFileName(
        'Money Saathi Personal',
        '2026-09-22',
      ),
    ).toBe(
      'money-saathi-personal-2026-09-22.csv',
    )
  })
})
