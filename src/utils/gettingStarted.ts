import type {
  MoneySaathiProfile,
} from '../profile/userProfile'

export type GettingStartedStepId =
  | 'personalize'
  | 'first-money'
  | 'regular-money'
  | 'safety-buffer'
  | 'goal'
  | 'business'

export interface GettingStartedInputs {
  transactionCount: number
  regularMoneyCount: number
  goalCount: number
  businessCount: number
  safetyBufferChetrum: number
}

export interface GettingStartedStep {
  id: GettingStartedStepId
  title: string
  description: string
  href: string
  action: string
  complete: boolean
}

export interface GettingStartedJourney {
  steps: GettingStartedStep[]
  completedCount: number
  totalCount: number
  isComplete: boolean
  nextStep: GettingStartedStep | null
}

function assertCount(
  value: number,
  label: string,
): void {
  if (
    !Number.isSafeInteger(value) ||
    value < 0
  ) {
    throw new Error(
      `${label} must be a non-negative safe integer.`,
    )
  }
}

export function buildGettingStartedJourney(
  profile: MoneySaathiProfile,
  inputs: GettingStartedInputs,
): GettingStartedJourney {
  assertCount(
    inputs.transactionCount,
    'Transaction count',
  )

  assertCount(
    inputs.regularMoneyCount,
    'Regular Money count',
  )

  assertCount(
    inputs.goalCount,
    'Goal count',
  )

  assertCount(
    inputs.businessCount,
    'Business count',
  )

  assertCount(
    inputs.safetyBufferChetrum,
    'Safety buffer',
  )

  const steps: GettingStartedStep[] = [
    {
      id: 'personalize',
      title: 'Tell Money Saathi what matters to you',
      description:
        'Choose the money areas you want help with and pick Simple Home or Full Home.',
      href: '/app/setup',
      action: 'Personalize',
      complete: profile.needs.length > 0,
    },
    {
      id: 'first-money',
      title: 'Record your first real money movement',
      description:
        'Add one income or expense. Start with something real, however small.',
      href: '/app/transactions/new',
      action: 'Add money',
      complete:
        inputs.transactionCount > 0,
    },
  ]

  if (
    profile.needs.includes('salary') ||
    profile.needs.includes('retirement')
  ) {
    steps.push({
      id: 'regular-money',
      title: profile.needs.includes('retirement')
        ? 'Add your pension or repeating commitments'
        : 'Add salary and repeating commitments',
      description:
        'Regular Money helps Money Saathi understand what normally comes in and goes out.',
      href: '/app/regular-money',
      action: 'Add Regular Money',
      complete:
        inputs.regularMoneyCount > 0,
    })
  }

  steps.push({
    id: 'safety-buffer',
    title: 'Protect some money before spending',
    description:
      'Set a safety buffer so Safe to Spend stays conservative when life gets expensive.',
    href: '/app/safety-buffer',
    action: 'Set safety buffer',
    complete:
      inputs.safetyBufferChetrum > 0,
  })

  if (
    profile.needs.includes('savings-goals')
  ) {
    steps.push({
      id: 'goal',
      title: 'Give your savings a purpose',
      description:
        'Create one goal such as education, an emergency fund, travel or something important to you.',
      href: '/app/goals',
      action: 'Create a goal',
      complete:
        inputs.goalCount > 0,
    })
  }

  if (
    profile.needs.includes('small-business')
  ) {
    steps.push({
      id: 'business',
      title: 'Create a separate business workspace',
      description:
        'Keep shop, service or self-employment money away from your personal ledger.',
      href: '/app/business',
      action: 'Open Business',
      complete:
        inputs.businessCount > 0,
    })
  }

  const completedCount =
    steps.filter(
      (step) => step.complete,
    ).length

  const nextStep =
    steps.find(
      (step) => !step.complete,
    ) ?? null

  return {
    steps,
    completedCount,
    totalCount: steps.length,
    isComplete:
      completedCount === steps.length,
    nextStep,
  }
}
