import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  assessAffordability,
  buildAttentionItems,
  buildDebtSnapshot,
  compareRecordedMonths,
} from './saathiTools'

describe('Ask Saathi deterministic tools', () => {
  it('compares a spending scenario only with current Safe to Spend', () => {
    expect(
      assessAffordability(
        5_000,
        10_000,
      ),
    ).toEqual({
      amountChetrum: 5_000,
      safeToSpendChetrum: 10_000,
      remainingChetrum: 5_000,
      status: 'within',
    })

    expect(
      assessAffordability(
        15_000,
        10_000,
      ).status,
    ).toBe('above')
  })

  it('compares current and previous recorded calendar months', () => {
    const result =
      compareRecordedMonths(
        '2026-09',
        [
          {
            id: '1',
            kind: 'income',
            amountChetrum: 10_000,
            category: 'Income',
            note: '',
            date: '2026-09-01',
            createdAt: 1,
            updatedAt: 1,
          },
          {
            id: '2',
            kind: 'expense',
            amountChetrum: 4_000,
            category: 'Food',
            note: '',
            date: '2026-09-02',
            createdAt: 2,
            updatedAt: 2,
          },
          {
            id: '3',
            kind: 'income',
            amountChetrum: 8_000,
            category: 'Income',
            note: '',
            date: '2026-08-01',
            createdAt: 3,
            updatedAt: 3,
          },
        ],
      )

    expect(
      result.current.netChetrum,
    ).toBe(6_000)

    expect(
      result.previous.netChetrum,
    ).toBe(8_000)

    expect(
      result.netChangeChetrum,
    ).toBe(-2_000)
  })

  it('summarizes debt and liquid savings without calling it net worth', () => {
    const result =
      buildDebtSnapshot(
        [
          {
            id: 'loan',
            name: 'Loan',
            lender: 'Bank',
            originalPrincipalChetrum: 100_000,
            outstandingPrincipalChetrum: 80_000,
            annualRateBps: 900,
            emiChetrum: 5_000,
            tenureMonths: 24,
            startDate: '2026-01-01',
            note: '',
            createdAt: 1,
            updatedAt: 1,
          },
        ],
        [
          {
            id: 'saving',
            name: 'Savings',
            balanceChetrum: 30_000,
            note: '',
            createdAt: 1,
            updatedAt: 1,
          },
        ],
      )

    expect(
      result.outstandingPrincipalChetrum,
    ).toBe(80_000)

    expect(
      result.monthlyEmiChetrum,
    ).toBe(5_000)

    expect(
      result.principalLessLiquidSavingsChetrum,
    ).toBe(50_000)
  })

  it('flags zero Safe to Spend without inventing a recommendation', () => {
    const items =
      buildAttentionItems({
        safeToSpendChetrum: 0,
        upcomingCommitmentsChetrum: 20_000,
        safetyBufferChetrum: 0,
        currentMonthIncomeChetrum: 100_000,
        currentMonthExpenseChetrum: 50_000,
        outstandingLoanChetrum: 0,
        transactionCount: 10,
      })

    expect(
      items.some(
        (item) =>
          item.id ===
          'no-safe-room',
      ),
    ).toBe(true)

    expect(
      items.some(
        (item) =>
          item.id ===
          'no-buffer',
      ),
    ).toBe(true)
  })
})