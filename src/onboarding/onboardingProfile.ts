import type {
  MoneyNeed,
} from '../profile/userProfile'

export type OnboardingMoneySituation =
  | 'salary'
  | 'business'
  | 'student'
  | 'mixed'
  | 'other'

export type OnboardingMoneyGoal =
  | 'control-spending'
  | 'save-more'
  | 'build-goals'
  | 'understand-money'

function uniqueNeeds(
  needs: MoneyNeed[],
): MoneyNeed[] {
  return [
    ...new Set(
      needs,
    ),
  ]
}

export function onboardingNeeds(
  situation: OnboardingMoneySituation,
  goal: OnboardingMoneyGoal,
): MoneyNeed[] {
  const needs: MoneyNeed[] = []

  if (situation === 'salary') {
    needs.push('salary')
  } else if (situation === 'business') {
    needs.push(
      'small-business',
      'irregular-income',
    )
  } else if (situation === 'student') {
    needs.push('daily-money')
  } else if (situation === 'mixed') {
    needs.push('irregular-income')
  }

  if (
    goal === 'control-spending' ||
    goal === 'understand-money'
  ) {
    needs.push('daily-money')
  }

  if (
    goal === 'save-more' ||
    goal === 'build-goals'
  ) {
    needs.push('savings-goals')
  }

  return uniqueNeeds(
    needs,
  )
}