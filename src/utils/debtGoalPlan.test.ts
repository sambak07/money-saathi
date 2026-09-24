import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  SavingsAccount,
} from '../types/asset'
import type {
  Goal,
  GoalContribution,
} from '../types/goal'
import type {
  Loan,
} from '../types/loan'
import {
  buildDebtGoalPlan,
} from './debtGoalPlan'

function loan(
  partial: Partial<Loan> &
    Pick<
      Loan,
      'id' | 'name' | 'outstandingPrincipalChetrum'
    >,
): Loan {
  return {
    lender: '',
    originalPrincipalChetrum:
      partial.outstandingPrincipalChetrum,
    annualRateBps: 0,
    emiChetrum: 0,
    tenureMonths: 0,
    startDate: '2026-01-01',
    note: '',
    createdAt: 1,
    updatedAt: 1,
    ...partial,
  }
}

function savings(
  id: string,
  balanceChetrum: number,
): SavingsAccount {
  return {
    id,
    name: id,
    balanceChetrum,
    note: '',
    createdAt: 1,
    updatedAt: 1,
  }
}

function goal(
  partial: Partial<Goal> &
    Pick<
      Goal,
      'id' | 'name' | 'targetChetrum'
    >,
): Goal {
  return {
    targetDate: '',
    note: '',
    createdAt: 1,
    updatedAt: 1,
    ...partial,
  }
}

function contribution(
  partial: Partial<GoalContribution> &
    Pick<
      GoalContribution,
      'id' | 'goalId' | 'amountChetrum'
    >,
): GoalContribution {
  return {
    date: '2026-09-01',
    note: '',
    createdAt: 1,
    ...partial,
  }
}

describe('debt and goal planning', () => {
  it('summarizes active debt, EMI and liquid savings without treating savings as debt payment', () => {
    const result =
      buildDebtGoalPlan(
        '2026-09-24',
        [
          loan({
            id: 'loan-a',
            name: 'Loan A',
            outstandingPrincipalChetrum: 100_000,
            annualRateBps: 900,
            emiChetrum: 10_000,
          }),
          loan({
            id: 'loan-b',
            name: 'Loan B',
            outstandingPrincipalChetrum: 50_000,
            annualRateBps: 500,
            emiChetrum: 5_000,
          }),
        ],
        [
          savings(
            'savings-a',
            40_000,
          ),
        ],
        [],
        [],
      )

    expect(
      result.outstandingPrincipalChetrum,
    ).toBe(150_000)

    expect(
      result.monthlyEmiChetrum,
    ).toBe(15_000)

    expect(
      result.liquidSavingsChetrum,
    ).toBe(40_000)

    expect(
      result.principalLessLiquidSavingsChetrum,
    ).toBe(110_000)
  })

  it('identifies the highest recorded annual rate as a fact', () => {
    const result =
      buildDebtGoalPlan(
        '2026-09-24',
        [
          loan({
            id: 'low',
            name: 'Lower rate',
            outstandingPrincipalChetrum: 100_000,
            annualRateBps: 500,
          }),
          loan({
            id: 'high',
            name: 'Higher rate',
            outstandingPrincipalChetrum: 80_000,
            annualRateBps: 900,
          }),
        ],
        [],
        [],
        [],
      )

    expect(
      result.highestRateLoan?.id,
    ).toBe('high')

    expect(
      result.highestRateLoan?.annualRateBps,
    ).toBe(900)
  })

  it('calculates a simple monthly goal pace through the target calendar month', () => {
    const result =
      buildDebtGoalPlan(
        '2026-09-24',
        [],
        [],
        [
          goal({
            id: 'goal-a',
            name: 'Goal A',
            targetChetrum: 120_000,
            targetDate: '2026-11-30',
          }),
        ],
        [
          contribution({
            id: 'contribution-a',
            goalId: 'goal-a',
            amountChetrum: 30_000,
          }),
        ],
      )

    expect(
      result.goalPlans[0].remainingChetrum,
    ).toBe(90_000)

    expect(
      result.goalPlans[0].calendarMonthsThroughTarget,
    ).toBe(3)

    expect(
      result.goalPlans[0].averageMonthlyNeededChetrum,
    ).toBe(30_000)

    expect(
      result.datedGoalMonthlyNeedChetrum,
    ).toBe(30_000)
  })

  it('marks unfinished past-target goals without inventing a monthly amount', () => {
    const result =
      buildDebtGoalPlan(
        '2026-09-24',
        [],
        [],
        [
          goal({
            id: 'past',
            name: 'Past goal',
            targetChetrum: 100_000,
            targetDate: '2026-08-31',
          }),
        ],
        [],
      )

    expect(
      result.overdueGoalCount,
    ).toBe(1)

    expect(
      result.goalPlans[0].targetPast,
    ).toBe(true)

    expect(
      result.goalPlans[0].averageMonthlyNeededChetrum,
    ).toBeNull()
  })

  it('keeps a reached goal at zero remaining even if contributions exceed the target', () => {
    const result =
      buildDebtGoalPlan(
        '2026-09-24',
        [],
        [],
        [
          goal({
            id: 'reached',
            name: 'Reached goal',
            targetChetrum: 100_000,
            targetDate: '2026-12-31',
          }),
        ],
        [
          contribution({
            id: 'over',
            goalId: 'reached',
            amountChetrum: 120_000,
          }),
        ],
      )

    expect(
      result.goalPlans[0].remainingChetrum,
    ).toBe(0)

    expect(
      result.goalPlans[0].targetReached,
    ).toBe(true)
  })
})