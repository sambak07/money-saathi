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
  getGoalSaved,
} from './goals'

const MAX_SAFE =
  BigInt(
    Number.MAX_SAFE_INTEGER,
  )

export interface GoalFundingPlan {
  id: string
  name: string
  targetChetrum: number
  savedChetrum: number
  remainingChetrum: number
  targetDate: string
  targetReached: boolean
  targetPast: boolean
  calendarMonthsThroughTarget: number | null
  averageMonthlyNeededChetrum: number | null
}

export interface DebtGoalPlan {
  activeLoanCount: number
  outstandingPrincipalChetrum: number
  monthlyEmiChetrum: number
  loansMissingEmiCount: number
  liquidSavingsChetrum: number
  principalLessLiquidSavingsChetrum: number
  highestRateLoan:
    | {
        id: string
        name: string
        annualRateBps: number
        outstandingPrincipalChetrum: number
      }
    | null
  goalCount: number
  totalGoalTargetChetrum: number
  totalGoalSavedChetrum: number
  totalGoalRemainingChetrum: number
  reachedGoalCount: number
  overdueGoalCount: number
  goalsWithoutTargetDateCount: number
  datedGoalMonthlyNeedChetrum: number
  goalPlans: GoalFundingPlan[]
}

function assertMoney(
  value: number,
  label: string,
): void {
  if (
    !Number.isSafeInteger(
      value,
    ) ||
    value < 0
  ) {
    throw new Error(
      `${label} must be a non-negative safe integer.`,
    )
  }
}

function toSafeNumber(
  value: bigint,
  label: string,
): number {
  if (
    value > MAX_SAFE ||
    value < -MAX_SAFE
  ) {
    throw new Error(
      `${label} exceeds the supported money range.`,
    )
  }

  return Number(value)
}

function addMoney(
  total: bigint,
  value: number,
  label: string,
): bigint {
  assertMoney(
    value,
    label,
  )

  const next =
    total +
    BigInt(value)

  if (
    next > MAX_SAFE
  ) {
    throw new Error(
      `${label} total exceeds the supported money range.`,
    )
  }

  return next
}

function ceilingDivide(
  amount: bigint,
  divisor: number,
): bigint {
  if (
    divisor <= 0 ||
    !Number.isSafeInteger(
      divisor,
    )
  ) {
    throw new Error(
      'Planning divisor must be a positive safe integer.',
    )
  }

  if (
    amount <= 0n
  ) {
    return 0n
  }

  const denominator =
    BigInt(divisor)

  return (
    amount +
    denominator -
    1n
  ) /
    denominator
}

function calendarMonthsThroughTarget(
  today: string,
  targetDate: string,
): number | null {
  if (!targetDate) {
    return null
  }

  if (
    targetDate <
    today
  ) {
    return 0
  }

  const [
    todayYear,
    todayMonth,
  ] =
    today
      .split('-')
      .map(Number)

  const [
    targetYear,
    targetMonth,
  ] =
    targetDate
      .split('-')
      .map(Number)

  return (
    (
      targetYear *
        12 +
      targetMonth
    ) -
    (
      todayYear *
        12 +
      todayMonth
    ) +
    1
  )
}

export function buildDebtGoalPlan(
  today: string,
  loans: Loan[],
  savingsAccounts: SavingsAccount[],
  goals: Goal[],
  goalContributions: GoalContribution[],
): DebtGoalPlan {
  let outstanding = 0n
  let monthlyEmi = 0n
  let liquidSavings = 0n

  let activeLoanCount = 0
  let loansMissingEmiCount = 0

  let highestRateLoan:
    DebtGoalPlan['highestRateLoan'] =
      null

  for (
    const loan of loans
  ) {
    assertMoney(
      loan.outstandingPrincipalChetrum,
      'Outstanding loan principal',
    )

    assertMoney(
      loan.emiChetrum,
      'Loan EMI',
    )

    if (
      !Number.isSafeInteger(
        loan.annualRateBps,
      ) ||
      loan.annualRateBps < 0
    ) {
      throw new Error(
        'Loan annual rate must be a non-negative integer.',
      )
    }

    if (
      loan.outstandingPrincipalChetrum ===
      0
    ) {
      continue
    }

    activeLoanCount += 1

    outstanding =
      addMoney(
        outstanding,
        loan.outstandingPrincipalChetrum,
        'Outstanding loan principal',
      )

    monthlyEmi =
      addMoney(
        monthlyEmi,
        loan.emiChetrum,
        'Loan EMI',
      )

    if (
      loan.emiChetrum ===
      0
    ) {
      loansMissingEmiCount += 1
    }

    if (
      !highestRateLoan ||
      loan.annualRateBps >
        highestRateLoan.annualRateBps ||
      (
        loan.annualRateBps ===
          highestRateLoan.annualRateBps &&
        loan.outstandingPrincipalChetrum >
          highestRateLoan.outstandingPrincipalChetrum
      )
    ) {
      highestRateLoan = {
        id:
          loan.id,
        name:
          loan.name,
        annualRateBps:
          loan.annualRateBps,
        outstandingPrincipalChetrum:
          loan.outstandingPrincipalChetrum,
      }
    }
  }

  for (
    const account of
      savingsAccounts
  ) {
    liquidSavings =
      addMoney(
        liquidSavings,
        account.balanceChetrum,
        'Savings account balance',
      )
  }

  let totalGoalTarget = 0n
  let totalGoalSaved = 0n
  let totalGoalRemaining = 0n
  let datedGoalMonthlyNeed = 0n

  let reachedGoalCount = 0
  let overdueGoalCount = 0
  let goalsWithoutTargetDateCount = 0

  const goalPlans:
    GoalFundingPlan[] = []

  for (
    const goal of goals
  ) {
    assertMoney(
      goal.targetChetrum,
      'Goal target',
    )

    const saved =
      getGoalSaved(
        goal.id,
        goalContributions,
      )

    assertMoney(
      saved,
      'Goal savings',
    )

    const remaining =
      BigInt(
        goal.targetChetrum,
      ) -
      BigInt(saved)

    const safeRemaining =
      remaining > 0n
        ? remaining
        : 0n

    const reached =
      safeRemaining ===
      0n

    if (reached) {
      reachedGoalCount += 1
    }

    const months =
      reached
        ? null
        : calendarMonthsThroughTarget(
            today,
            goal.targetDate,
          )

    const targetPast =
      !reached &&
      Boolean(
        goal.targetDate,
      ) &&
      goal.targetDate <
        today

    if (targetPast) {
      overdueGoalCount += 1
    }

    if (
      !goal.targetDate &&
      !reached
    ) {
      goalsWithoutTargetDateCount += 1
    }

    const averageMonthlyNeeded =
      !reached &&
      months !== null &&
      months > 0
        ? ceilingDivide(
            safeRemaining,
            months,
          )
        : null

    if (
      averageMonthlyNeeded !==
      null
    ) {
      datedGoalMonthlyNeed =
        addMoney(
          datedGoalMonthlyNeed,
          toSafeNumber(
            averageMonthlyNeeded,
            'Average monthly goal amount',
          ),
          'Dated goal monthly need',
        )
    }

    totalGoalTarget =
      addMoney(
        totalGoalTarget,
        goal.targetChetrum,
        'Goal targets',
      )

    totalGoalSaved =
      addMoney(
        totalGoalSaved,
        saved,
        'Goal savings',
      )

    totalGoalRemaining +=
      safeRemaining

    if (
      totalGoalRemaining >
      MAX_SAFE
    ) {
      throw new Error(
        'Goal remaining total exceeds the supported money range.',
      )
    }

    goalPlans.push({
      id:
        goal.id,
      name:
        goal.name,
      targetChetrum:
        goal.targetChetrum,
      savedChetrum:
        saved,
      remainingChetrum:
        toSafeNumber(
          safeRemaining,
          'Goal remaining amount',
        ),
      targetDate:
        goal.targetDate,
      targetReached:
        reached,
      targetPast,
      calendarMonthsThroughTarget:
        months,
      averageMonthlyNeededChetrum:
        averageMonthlyNeeded ===
          null
          ? null
          : toSafeNumber(
              averageMonthlyNeeded,
              'Average monthly goal amount',
            ),
    })
  }

  goalPlans.sort(
    (left, right) => {
      if (
        left.targetReached !==
        right.targetReached
      ) {
        return left.targetReached
          ? 1
          : -1
      }

      const leftDate =
        left.targetDate ||
        '9999-12-31'

      const rightDate =
        right.targetDate ||
        '9999-12-31'

      const dateComparison =
        leftDate.localeCompare(
          rightDate,
        )

      if (
        dateComparison !==
        0
      ) {
        return dateComparison
      }

      return left.name.localeCompare(
        right.name,
      )
    },
  )

  return {
    activeLoanCount,
    outstandingPrincipalChetrum:
      toSafeNumber(
        outstanding,
        'Outstanding principal',
      ),
    monthlyEmiChetrum:
      toSafeNumber(
        monthlyEmi,
        'Monthly EMI',
      ),
    loansMissingEmiCount,
    liquidSavingsChetrum:
      toSafeNumber(
        liquidSavings,
        'Liquid savings',
      ),
    principalLessLiquidSavingsChetrum:
      toSafeNumber(
        outstanding -
        liquidSavings,
        'Principal less liquid savings',
      ),
    highestRateLoan,
    goalCount:
      goals.length,
    totalGoalTargetChetrum:
      toSafeNumber(
        totalGoalTarget,
        'Goal targets',
      ),
    totalGoalSavedChetrum:
      toSafeNumber(
        totalGoalSaved,
        'Goal savings',
      ),
    totalGoalRemainingChetrum:
      toSafeNumber(
        totalGoalRemaining,
        'Goal remaining',
      ),
    reachedGoalCount,
    overdueGoalCount,
    goalsWithoutTargetDateCount,
    datedGoalMonthlyNeedChetrum:
      toSafeNumber(
        datedGoalMonthlyNeed,
        'Dated goal monthly need',
      ),
    goalPlans,
  }
}