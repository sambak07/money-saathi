import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  buildFinancialSafetyPlan,
  calculateCoverageMonthsTenths,
  formatCoverageTenths,
} from './financialSafety'

describe('financial safety plan', () => {
  it('does not invent an emergency target before the user chooses one', () => {
    expect(
      buildFinancialSafetyPlan(
        500_000,
        1_000_000,
        null,
      ),
    ).toEqual({
      targetMonths: null,
      averageMonthlyExpenseChetrum:
        500_000,
      potentiallyLiquidSavingsChetrum:
        1_000_000,
      targetChetrum: null,
      gapChetrum: null,
      aboveTargetChetrum: null,
      coverageMonthsTenths: 20,
    })
  })

  it('calculates a target and gap with integer money arithmetic', () => {
    const plan =
      buildFinancialSafetyPlan(
        500_000,
        1_000_000,
        6,
      )

    expect(
      plan.targetChetrum,
    ).toBe(3_000_000)

    expect(
      plan.gapChetrum,
    ).toBe(2_000_000)

    expect(
      plan.aboveTargetChetrum,
    ).toBe(0)
  })

  it('shows money above the chosen planning target without calling it excess cash', () => {
    const plan =
      buildFinancialSafetyPlan(
        500_000,
        4_000_000,
        6,
      )

    expect(
      plan.gapChetrum,
    ).toBe(0)

    expect(
      plan.aboveTargetChetrum,
    ).toBe(1_000_000)
  })

  it('calculates coverage in tenths without floating-point money arithmetic', () => {
    expect(
      calculateCoverageMonthsTenths(
        1_250_000,
        500_000,
      ),
    ).toBe(25)

    expect(
      formatCoverageTenths(25),
    ).toBe('2.5 months')
  })

  it('does not invent coverage when there is no recorded expense history', () => {
    expect(
      calculateCoverageMonthsTenths(
        1_000_000,
        0,
      ),
    ).toBeNull()
  })
})
