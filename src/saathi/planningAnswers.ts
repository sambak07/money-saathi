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
import type {
  RegularMoney,
} from '../types/regularMoney'
import type {
  MoneyTransaction,
} from '../types/transaction'
import {
  buildCashFlowForecast,
  type ForecastHorizon,
} from '../utils/cashFlowForecast'
import {
  buildDebtGoalPlan,
} from '../utils/debtGoalPlan'
import {
  formatNu,
} from '../utils/money'
import {
  buildMonthPlan,
} from '../utils/monthPlan'
import {
  formatScheduleDate,
} from '../utils/recurrence'
import type {
  LocalSaathiIntent,
} from './localQuestionRouter'

export type SaathiPlanningIntent =
  Extract<
    LocalSaathiIntent,
    | 'month-plan'
    | 'cash-flow-forecast'
    | 'goal-plan'
  >

export interface SaathiPlanningSource {
  today: string
  safetyBufferChetrum: number
  transactions: MoneyTransaction[]
  regularMoney: RegularMoney[]
  savingsAccounts: SavingsAccount[]
  loans: Loan[]
  goals: Goal[]
  goalContributions: GoalContribution[]
}

export function forecastHorizonFromQuestion(
  question: string,
): ForecastHorizon {
  if (
    /\b30\b/.test(
      question,
    )
  ) {
    return 30
  }

  if (
    /\b60\b/.test(
      question,
    )
  ) {
    return 60
  }

  return 90
}

export function answerSaathiPlanningQuestion(
  intent: SaathiPlanningIntent,
  question: string,
  source: SaathiPlanningSource,
): string {
  if (
    intent ===
    'month-plan'
  ) {
    const plan =
      buildMonthPlan(
        source.today,
        source.transactions,
        source.regularMoney,
        source.safetyBufferChetrum,
      )

    return (
      `This month you have recorded ${formatNu(plan.recordedIncomeChetrum)} coming in and ` +
      `${formatNu(plan.recordedExpenseChetrum)} going out. ` +
      `Current Safe to Spend is ${formatNu(plan.safeToSpend.safeToSpendChetrum)}. ` +
      `${formatNu(plan.scheduledExpenseRemainingChetrum)} of scheduled expenses remain unrecorded this month, ` +
      `and the conservative month planning room is ${formatNu(plan.conservativeMonthRoomChetrum)}. ` +
      `Scheduled future income is shown for planning but is not counted as current cash.`
    )
  }

  if (
    intent ===
    'cash-flow-forecast'
  ) {
    const daysAhead =
      forecastHorizonFromQuestion(
        question,
      )

    const forecast =
      buildCashFlowForecast(
        source.today,
        daysAhead,
        source.regularMoney,
        source.transactions,
        source.safetyBufferChetrum,
      )

    const lowestDate =
      forecast.lowestProjectedBalanceDate
        ? ` on ${formatScheduleDate(
            forecast.lowestProjectedBalanceDate,
          )}`
        : ''

    const bufferMessage =
      forecast.lowestAfterBufferChetrum <
        0
        ? `The schedule falls below your protected safety buffer by as much as ${formatNu(
            Math.abs(
              forecast.lowestAfterBufferChetrum,
            ),
          )}.`
        : `The lowest scheduled balance remains ${formatNu(
            forecast.lowestAfterBufferChetrum,
          )} above your protected safety buffer.`

    return (
      `Over the next ${daysAhead} days, your recorded opening balance is ` +
      `${formatNu(forecast.openingRecordedBalanceChetrum)}. ` +
      `Scheduled income is ${formatNu(forecast.scheduledIncomeChetrum)} and scheduled expenses are ` +
      `${formatNu(forecast.scheduledExpenseChetrum)}. ` +
      `If every listed Regular Money event happens as entered, the scheduled end balance is ` +
      `${formatNu(forecast.projectedEndBalanceChetrum)}. ` +
      `The lowest scheduled balance is ${formatNu(forecast.lowestProjectedBalanceChetrum)}${lowestDate}. ` +
      `${bufferMessage} This is a planning scenario, not guaranteed future cash.`
    )
  }

  const plan =
    buildDebtGoalPlan(
      source.today,
      source.loans,
      source.savingsAccounts,
      source.goals,
      source.goalContributions,
    )

  if (
    plan.goalCount ===
    0
  ) {
    return (
      'You do not have a recorded goal yet. Add a goal and any real contributions first; ' +
      'Saathi will not invent a target or saving amount for you.'
    )
  }

  const overdue =
    plan.overdueGoalCount >
      0
      ? ` ${plan.overdueGoalCount} unfinished ${plan.overdueGoalCount === 1 ? 'goal is' : 'goals are'} past the recorded target date.`
      : ''

  const undated =
    plan.goalsWithoutTargetDateCount >
      0
      ? ` ${plan.goalsWithoutTargetDateCount} unfinished ${plan.goalsWithoutTargetDateCount === 1 ? 'goal has' : 'goals have'} no target date, so no monthly pace is invented for ${plan.goalsWithoutTargetDateCount === 1 ? 'it' : 'them'}.`
      : ''

  return (
    `Across your recorded goals, ${formatNu(plan.totalGoalSavedChetrum)} has been contributed toward ` +
    `${formatNu(plan.totalGoalTargetChetrum)} of targets, leaving ${formatNu(plan.totalGoalRemainingChetrum)}. ` +
    `For unfinished goals that still have future target dates, the simple combined monthly pace is ` +
    `${formatNu(plan.datedGoalMonthlyNeedChetrum)}. ` +
    `This is arithmetic only and assumes no investment return.` +
    overdue +
    undated
  )
}