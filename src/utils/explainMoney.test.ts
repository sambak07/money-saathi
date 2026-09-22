import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  buildMoneyQuestions,
  buildMoneySignals,
  sumSafeChetrum,
  type ExplainMoneyInputs,
} from './explainMoney'

const base: ExplainMoneyInputs = {
  recordedBalanceChetrum: 1_000_000,
  safeToSpendChetrum: 700_000,
  upcomingCommitmentsChetrum: 200_000,
  safetyBufferChetrum: 100_000,
  currentMonthIncomeChetrum: 500_000,
  currentMonthExpenseChetrum: 350_000,
  liquidSavingsChetrum: 900_000,
  averageMonthlyExpenseChetrum: 300_000,
  emergencyCoverageMonthsTenths: 30,
  outstandingLoanChetrum: 0,
  goalCount: 0,
  irregularIncomeSelected: false,
}

describe('Explain My Money', () => {
  it('explains why Safe to Spend can be lower than recorded balance', () => {
    const signals =
      buildMoneySignals(base)

    expect(signals[0].id).toBe(
      'today-safe-to-spend',
    )

    expect(
      signals[0].explanation,
    ).toContain('upcoming Regular Money')
  })

  it('describes a negative month without turning it into a score', () => {
    const signals =
      buildMoneySignals({
        ...base,
        currentMonthIncomeChetrum:
          200_000,
        currentMonthExpenseChetrum:
          400_000,
      })

    expect(
      signals.some(
        (signal) =>
          signal.id === 'month-negative',
      ),
    ).toBe(true)
  })

  it('adds debt explanation only when debt is recorded', () => {
    expect(
      buildMoneySignals(base).some(
        (signal) =>
          signal.kind === 'debt',
      ),
    ).toBe(false)

    expect(
      buildMoneySignals({
        ...base,
        outstandingLoanChetrum:
          1_500_000,
      }).some(
        (signal) =>
          signal.kind === 'debt',
      ),
    ).toBe(true)
  })

  it('keeps irregular-income language historical rather than predictive', () => {
    const signals =
      buildMoneySignals({
        ...base,
        irregularIncomeSelected: true,
      })

    expect(
      signals.find(
        (signal) =>
          signal.kind ===
          'income-rhythm',
      )?.explanation,
    ).toContain(
      'does not forecast future income',
    )
  })

  it('builds questions rather than commands', () => {
    const questions =
      buildMoneyQuestions({
        ...base,
        safetyBufferChetrum: 0,
        outstandingLoanChetrum:
          800_000,
      })

    expect(
      questions.every(
        (question) =>
          question.endsWith('?'),
      ),
    ).toBe(true)
  })

  it('sums money using safe integer arithmetic', () => {
    expect(
      sumSafeChetrum(
        [
          100_000,
          200_000,
          300_000,
        ],
        'Loan principal',
      ),
    ).toBe(600_000)
  })
})
