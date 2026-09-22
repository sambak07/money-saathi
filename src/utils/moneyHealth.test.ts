import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  MoneyTransaction,
} from '../types/transaction'
import {
  buildMoneyHealthSnapshot,
  calculateEmergencyCoverageTenths,
  formatCoverageMonths,
} from './moneyHealth'

function transaction(
  overrides: Partial<MoneyTransaction>,
): MoneyTransaction {
  return {
    id: 't1',
    kind: 'expense',
    amountChetrum: 100_000,
    category: 'Other',
    note: '',
    date: '2026-09-10',
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  }
}

describe('transparent money health', () => {
  it('builds recent cash flow from recorded transactions', () => {
    const snapshot =
      buildMoneyHealthSnapshot(
        '2026-09',
        [
          transaction({
            id: 'july-income',
            kind: 'income',
            amountChetrum: 500_000,
            date: '2026-07-01',
          }),
          transaction({
            id: 'july-expense',
            amountChetrum: 300_000,
            date: '2026-07-02',
          }),
          transaction({
            id: 'aug-income',
            kind: 'income',
            amountChetrum: 500_000,
            date: '2026-08-01',
          }),
          transaction({
            id: 'aug-expense',
            amountChetrum: 550_000,
            date: '2026-08-02',
          }),
          transaction({
            id: 'sep-income',
            kind: 'income',
            amountChetrum: 600_000,
            date: '2026-09-01',
          }),
          transaction({
            id: 'sep-expense',
            amountChetrum: 350_000,
            date: '2026-09-02',
          }),
        ],
        1_000_000,
      )

    expect(
      snapshot.positiveNetMonths,
    ).toBe(2)

    expect(
      snapshot.currentMonth.netChetrum,
    ).toBe(250_000)
  })

  it('calculates average recorded monthly expense using integer arithmetic', () => {
    const snapshot =
      buildMoneyHealthSnapshot(
        '2026-09',
        [
          transaction({
            id: 'july',
            amountChetrum: 300,
            date: '2026-07-02',
          }),
          transaction({
            id: 'aug',
            amountChetrum: 400,
            date: '2026-08-02',
          }),
          transaction({
            id: 'sep',
            amountChetrum: 500,
            date: '2026-09-02',
          }),
        ],
        1_000,
      )

    expect(
      snapshot.averageMonthlyExpenseChetrum,
    ).toBe(400)
  })

  it('calculates emergency coverage in tenths without floating-point money arithmetic', () => {
    expect(
      calculateEmergencyCoverageTenths(
        1_250_000,
        500_000,
      ),
    ).toBe(25)

    expect(
      formatCoverageMonths(25),
    ).toBe('2.5 months')
  })

  it('does not invent emergency coverage without expense history', () => {
    expect(
      calculateEmergencyCoverageTenths(
        1_000_000,
        0,
      ),
    ).toBeNull()

    expect(
      formatCoverageMonths(null),
    ).toBe(
      'Not enough expense history',
    )
  })
})
