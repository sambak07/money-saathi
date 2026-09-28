import {
  getGoalContributions,
  getGoals,
  getLoans,
  getRegularMoney,
  getSavingsAccounts,
  getTransactions,
} from '../storage/db'
import {
  sanitizeSaathiContextPermissions,
  type SaathiContextCategory,
  type SaathiContextPermissions,
} from './contextPermissions'
import type {
  LocalSaathiIntent,
} from './localQuestionRouter'

export interface SaathiQuestionData {
  transactions: Awaited<
    ReturnType<typeof getTransactions>
  >
  regularMoney: Awaited<
    ReturnType<typeof getRegularMoney>
  >
  savingsAccounts: Awaited<
    ReturnType<typeof getSavingsAccounts>
  >
  loans: Awaited<
    ReturnType<typeof getLoans>
  >
  goals: Awaited<
    ReturnType<typeof getGoals>
  >
  goalContributions: Awaited<
    ReturnType<typeof getGoalContributions>
  >
}

const QUESTION_REQUIREMENTS: Record<
  Exclude<
    LocalSaathiIntent,
    'learn' | 'unknown'
  >,
  readonly SaathiContextCategory[]
> = {
  affordability: [
    'money-summary',
  ],
  attention: [
    'money-summary',
    'loans',
    'savings',
  ],
  'month-change': [
    'transactions',
  ],
  'month-plan': [
    'money-summary',
  ],
  'cash-flow-forecast': [
    'money-summary',
    'commitments',
  ],
  'goal-plan': [
    'goals',
    'loans',
    'savings',
  ],
  debt: [
    'loans',
    'savings',
  ],
  'saving-guidance': [
    'money-summary',
    'savings',
  ],
  'spending-control': [
    'money-summary',
  ],
  'salary-plan': [
    'money-summary',
  ],
}

const CATEGORY_LABELS: Record<
  SaathiContextCategory,
  string
> = {
  profile: 'Profile',
  'money-summary': 'Money summary',
  transactions: 'Recent transaction activity',
  commitments: 'Regular money',
  savings: 'Savings and deposits',
  loans: 'Loans',
  goals: 'Goals',
}

export function isSaathiCategoryEnabled(
  permissions: SaathiContextPermissions,
  category: SaathiContextCategory,
): boolean {
  const sanitized =
    sanitizeSaathiContextPermissions(
      permissions,
    )

  return (
    sanitized.enabled &&
    sanitized.categories[
      category
    ]
  )
}

export function requiredCategoriesForSaathiIntent(
  intent: LocalSaathiIntent,
): SaathiContextCategory[] {
  if (
    intent === 'learn' ||
    intent === 'unknown'
  ) {
    return []
  }

  return [
    ...QUESTION_REQUIREMENTS[
      intent
    ],
  ]
}

export function canUseSaathiIntent(
  permissions: SaathiContextPermissions,
  intent: LocalSaathiIntent,
): boolean {
  const required =
    requiredCategoriesForSaathiIntent(
      intent,
    )

  if (
    required.length ===
    0
  ) {
    return true
  }

  const sanitized =
    sanitizeSaathiContextPermissions(
      permissions,
    )

  return (
    sanitized.enabled &&
    required.every(
      (category) =>
        sanitized.categories[
          category
        ],
    )
  )
}

export function getSaathiPermissionMessage(
  permissions: SaathiContextPermissions,
  intent: LocalSaathiIntent,
): string {
  const required =
    requiredCategoriesForSaathiIntent(
      intent,
    )

  if (
    required.length ===
    0
  ) {
    return ''
  }

  const sanitized =
    sanitizeSaathiContextPermissions(
      permissions,
    )

  if (!sanitized.enabled) {
    return (
      'Local Saathi data access is Off. I can still explain general money concepts, ' +
      'but I will not use your personal Money Saathi records. Turn it on in Data permissions ' +
      'to ask questions about your own money.'
    )
  }

  const missing =
    required.filter(
      (category) =>
        !sanitized.categories[
          category
        ],
    )

  if (
    missing.length ===
    0
  ) {
    return ''
  }

  return (
    'Saathi does not have permission to use all local record categories needed for this question. ' +
    'Review Data permissions and enable: ' +
    missing
      .map(
        (category) =>
          CATEGORY_LABELS[
            category
          ],
      )
      .join(', ') +
    '.'
  )
}

export async function loadPermittedSaathiQuestionData(
  permissions: SaathiContextPermissions,
): Promise<SaathiQuestionData> {
  const sanitized =
    sanitizeSaathiContextPermissions(
      permissions,
    )

  if (!sanitized.enabled) {
    return {
      transactions: [],
      regularMoney: [],
      savingsAccounts: [],
      loans: [],
      goals: [],
      goalContributions: [],
    }
  }

  const moneySummaryAllowed =
    sanitized.categories[
      'money-summary'
    ]

  const transactions =
    moneySummaryAllowed ||
    sanitized.categories[
      'transactions'
    ]
      ? await getTransactions()
      : []

  const regularMoney =
    moneySummaryAllowed ||
    sanitized.categories[
      'commitments'
    ]
      ? await getRegularMoney()
      : []

  const savingsAccounts =
    sanitized.categories[
      'savings'
    ]
      ? await getSavingsAccounts()
      : []

  const loans =
    sanitized.categories[
      'loans'
    ]
      ? await getLoans()
      : []

  const goals =
    sanitized.categories[
      'goals'
    ]
      ? await getGoals()
      : []

  const goalContributions =
    sanitized.categories[
      'goals'
    ]
      ? await getGoalContributions()
      : []

  return {
    transactions,
    regularMoney,
    savingsAccounts,
    loans,
    goals,
    goalContributions,
  }
}
