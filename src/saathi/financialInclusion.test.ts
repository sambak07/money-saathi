import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  buildSaathiGuidance,
} from './financialInclusion'

function snapshot() {
  return {
    needs: [],
    transactionCount: 10,
    recordedBalanceChetrum: 100_000,
    safeToSpendChetrum: 50_000,
    upcomingCommitmentsChetrum: 30_000,
    safetyBufferChetrum: 20_000,
    currentMonthIncomeChetrum: 100_000,
    currentMonthExpenseChetrum: 50_000,
    liquidSavingsChetrum: 0,
    outstandingLoanChetrum: 0,
    goalCount: 0,
    nextExpectedIncomeDate: null,
    horizonDate: '2026-09-30',
  }
}

describe('Saathi financial inclusion engine', () => {
  it('adds student guidance only when the user selects that need', () => {
    const general =
      buildSaathiGuidance(
        snapshot(),
      )

    expect(
      general.some(
        (item) =>
          item.id ===
          'student-first-money',
      ),
    ).toBe(false)

    const student =
      buildSaathiGuidance({
        ...snapshot(),
        needs: [
          'student',
        ],
      })

    expect(
      student.some(
        (item) =>
          item.id ===
          'student-first-money',
      ),
    ).toBe(true)
  })

  it('does not recommend optional spending when Safe to Spend is zero', () => {
    const guidance =
      buildSaathiGuidance({
        ...snapshot(),
        safeToSpendChetrum: 0,
      })

    expect(
      guidance.some(
        (item) =>
          item.id ===
          'safe-to-spend-zero',
      ),
    ).toBe(true)
  })

  it('adds irregular-income guidance only from an explicit profile choice', () => {
    const guidance =
      buildSaathiGuidance({
        ...snapshot(),
        needs: [
          'irregular-income',
        ],
      })

    expect(
      guidance.some(
        (item) =>
          item.id ===
          'irregular-income-reality',
      ),
    ).toBe(true)
  })

  it('always includes a digital scam-protection principle', () => {
    const guidance =
      buildSaathiGuidance(
        snapshot(),
      )

    expect(
      guidance.some(
        (item) =>
          item.id ===
          'scam-rule',
      ),
    ).toBe(true)
  })
})