import type { Goal, GoalContribution } from '../types/goal'
import { getLocalToday } from './money'

function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function formatGoalDate(value: string): string {
  if (!value) return 'No target date'

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parseLocalDate(value))
}

export function getGoalSaved(
  goalId: string,
  contributions: GoalContribution[],
): number {
  return contributions
    .filter((item) => item.goalId === goalId)
    .reduce((sum, item) => sum + item.amountChetrum, 0)
}

export function getGoalProgress(
  goal: Goal,
  savedChetrum: number,
): number {
  if (goal.targetChetrum <= 0) return 0
  return (savedChetrum / goal.targetChetrum) * 100
}

export function getGoalDateStatus(
  goal: Goal,
  savedChetrum: number,
): string {
  if (savedChetrum >= goal.targetChetrum) {
    return 'Goal reached'
  }

  if (!goal.targetDate) return 'No target date'

  const today = parseLocalDate(getLocalToday())
  const target = parseLocalDate(goal.targetDate)

  const days = Math.ceil(
    (target.getTime() - today.getTime()) / 86_400_000,
  )

  if (days < 0) {
    const overdue = Math.abs(days)
    return `${overdue} ${overdue === 1 ? 'day' : 'days'} past target`
  }

  if (days === 0) return 'Target date is today'

  return `${days} ${days === 1 ? 'day' : 'days'} to target`
}
