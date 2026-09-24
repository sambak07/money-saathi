import type {
  MoneyNeed,
} from '../profile/userProfile'
import type {
  FixedDeposit,
  RecurringDeposit,
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
  calculateSafeToSpend,
} from '../utils/safeToSpend'
import {
  summarizeSimpleMonth,
  transactionBalanceChetrum,
} from '../utils/simpleHome'

export const SAATHI_CONTEXT_CATEGORIES = [
  'profile',
  'money-summary',
  'transactions',
  'commitments',
  'savings',
  'loans',
  'goals',
] as const

export type SaathiContextCategory =
  (typeof SAATHI_CONTEXT_CATEGORIES)[number]

export const SAATHI_CONTEXT_INTENTS = [
  'overview',
  'affordability',
  'spending',
  'debt',
  'savings',
  'learn',
] as const

export type SaathiContextIntent =
  (typeof SAATHI_CONTEXT_INTENTS)[number]

export interface SaathiContextPermissions {
  version: 1
  enabled: boolean
  categories: Record<
    SaathiContextCategory,
    boolean
  >
}

export interface SaathiContextSource {
  today: string
  safetyBufferChetrum: number
  needs: MoneyNeed[]
  transactions: MoneyTransaction[]
  regularMoney: RegularMoney[]
  savingsAccounts: SavingsAccount[]
  fixedDeposits: FixedDeposit[]
  recurringDeposits: RecurringDeposit[]
  loans: Loan[]
  goals: Goal[]
  goalContributions: GoalContribution[]
}

export interface SaathiContextEnvelope {
  schemaVersion: 1
  intent: SaathiContextIntent
  asOfDate: string
  includedCategories: SaathiContextCategory[]
  context: {
    profile?: {
      needs: MoneyNeed[]
    }
    moneySummary?: {
      recordedBalanceChetrum: number
      currentMonthIncomeChetrum: number
      currentMonthExpenseChetrum: number
      safeToSpendChetrum: number
      upcomingCommitmentsChetrum: number
      safetyBufferChetrum: number
      horizonDate: string
      nextExpectedIncomeDate: string | null
    }
    transactions?: Array<{
      date: string
      kind: 'income' | 'expense'
      amountChetrum: number
      category: string
    }>
    commitments?: Array<{
      name: string
      kind: 'income' | 'expense'
      amountChetrum: number
      frequency: 'weekly' | 'monthly' | 'yearly'
      startDate: string
      endDate: string
    }>
    savings?: {
      accounts: Array<{
        name: string
        balanceChetrum: number
      }>
      fixedDeposits: Array<{
        name: string
        principalChetrum: number
        annualRateBps: number
        tenureMonths: number
        startDate: string
      }>
      recurringDeposits: Array<{
        name: string
        installmentChetrum: number
        annualRateBps: number
        tenureMonths: number
        installmentsPaid: number
        startDate: string
      }>
    }
    loans?: Array<{
      name: string
      lender: string
      outstandingPrincipalChetrum: number
      annualRateBps: number
      emiChetrum: number
      tenureMonths: number
      startDate: string
    }>
    goals?: Array<{
      name: string
      targetChetrum: number
      contributedChetrum: number
      targetDate: string
    }>
  }
}

const STORAGE_KEY =
  'money-saathi:saathi-context-permissions:v1'

const DEFAULT_CATEGORIES: Record<
  SaathiContextCategory,
  boolean
> = {
  profile: false,
  'money-summary': false,
  transactions: false,
  commitments: false,
  savings: false,
  loans: false,
  goals: false,
}

export const DEFAULT_SAATHI_CONTEXT_PERMISSIONS:
  SaathiContextPermissions = {
    version: 1,
    enabled: false,
    categories: {
      ...DEFAULT_CATEGORIES,
    },
  }

const INTENT_CATEGORIES: Record<
  SaathiContextIntent,
  SaathiContextCategory[]
> = {
  overview: [
    'profile',
    'money-summary',
    'commitments',
  ],
  affordability: [
    'money-summary',
    'commitments',
    'savings',
  ],
  spending: [
    'money-summary',
    'transactions',
  ],
  debt: [
    'money-summary',
    'loans',
    'savings',
  ],
  savings: [
    'money-summary',
    'savings',
    'goals',
  ],
  learn: [],
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

export function sanitizeSaathiContextPermissions(
  value: unknown,
): SaathiContextPermissions {
  if (
    !isRecord(value) ||
    value.version !== 1 ||
    typeof value.enabled !== 'boolean' ||
    !isRecord(value.categories)
  ) {
    return {
      version: 1,
      enabled: false,
      categories: {
        ...DEFAULT_CATEGORIES,
      },
    }
  }

  const categories = {
    ...DEFAULT_CATEGORIES,
  }

  for (
    const category of
    SAATHI_CONTEXT_CATEGORIES
  ) {
    categories[category] =
      value.categories[category] === true
  }

  return {
    version: 1,
    enabled: value.enabled,
    categories,
  }
}

export function getSaathiContextPermissions():
  SaathiContextPermissions {
  const raw =
    localStorage.getItem(
      STORAGE_KEY,
    )

  if (!raw) {
    return {
      version: 1,
      enabled: false,
      categories: {
        ...DEFAULT_CATEGORIES,
      },
    }
  }

  try {
    return sanitizeSaathiContextPermissions(
      JSON.parse(raw),
    )
  } catch {
    return {
      version: 1,
      enabled: false,
      categories: {
        ...DEFAULT_CATEGORIES,
      },
    }
  }
}

export function saveSaathiContextPermissions(
  permissions: SaathiContextPermissions,
): void {
  const sanitized =
    sanitizeSaathiContextPermissions(
      permissions,
    )

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      sanitized,
    ),
  )

  window.dispatchEvent(
    new Event(
      'money-saathi-saathi-permissions-change',
    ),
  )
}

export function resetSaathiContextPermissions():
  SaathiContextPermissions {
  localStorage.removeItem(
    STORAGE_KEY,
  )

  window.dispatchEvent(
    new Event(
      'money-saathi-saathi-permissions-change',
    ),
  )

  return {
    version: 1,
    enabled: false,
    categories: {
      ...DEFAULT_CATEGORIES,
    },
  }
}

export function recommendedCategoriesForIntent(
  intent: SaathiContextIntent,
): SaathiContextCategory[] {
  return [
    ...INTENT_CATEGORIES[
      intent
    ],
  ]
}

function subtractDaysIso(
  dateText: string,
  days: number,
): string {
  const [
    year,
    month,
    day,
  ] =
    dateText
      .split('-')
      .map(Number)

  const date =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day,
      ),
    )

  date.setUTCDate(
    date.getUTCDate() -
    days,
  )

  return date
    .toISOString()
    .slice(0, 10)
}

function sumGoalContributions(
  goalId: string,
  contributions: GoalContribution[],
): number {
  let total = 0n

  for (
    const contribution of contributions
  ) {
    if (
      contribution.goalId !==
      goalId
    ) {
      continue
    }

    total += BigInt(
      contribution.amountChetrum,
    )
  }

  if (
    total >
    BigInt(
      Number.MAX_SAFE_INTEGER,
    )
  ) {
    throw new Error(
      'Goal contributions exceed the supported money range.',
    )
  }

  return Number(total)
}

export function buildSaathiContextEnvelope(
  source: SaathiContextSource,
  permissions: SaathiContextPermissions,
  intent: SaathiContextIntent,
): SaathiContextEnvelope {
  const sanitized =
    sanitizeSaathiContextPermissions(
      permissions,
    )

  const required =
    recommendedCategoriesForIntent(
      intent,
    )

  const included =
    sanitized.enabled
      ? required.filter(
          (category) =>
            sanitized.categories[
              category
            ],
        )
      : []

  const envelope: SaathiContextEnvelope = {
    schemaVersion: 1,
    intent,
    asOfDate:
      source.today,
    includedCategories:
      included,
    context: {},
  }

  if (
    included.includes(
      'profile',
    )
  ) {
    envelope.context.profile = {
      needs: [
        ...source.needs,
      ],
    }
  }

  const recordedTransactions =
    source.transactions.filter(
      (transaction) =>
        transaction.date <=
        source.today,
    )

  if (
    included.includes(
      'money-summary',
    )
  ) {
    const recordedBalanceChetrum =
      transactionBalanceChetrum(
        recordedTransactions,
        source.today,
      )

    const month =
      summarizeSimpleMonth(
        source.today.slice(
          0,
          7,
        ),
        recordedTransactions,
      )

    const safe =
      calculateSafeToSpend(
        source.today,
        recordedBalanceChetrum,
        source.regularMoney,
        recordedTransactions,
        source.safetyBufferChetrum,
      )

    envelope.context.moneySummary = {
      recordedBalanceChetrum,
      currentMonthIncomeChetrum:
        month.incomeChetrum,
      currentMonthExpenseChetrum:
        month.expenseChetrum,
      safeToSpendChetrum:
        safe.safeToSpendChetrum,
      upcomingCommitmentsChetrum:
        safe.upcomingCommitmentsChetrum,
      safetyBufferChetrum:
        safe.safetyBufferChetrum,
      horizonDate:
        safe.horizonDate,
      nextExpectedIncomeDate:
        safe.nextExpectedIncomeDate,
    }
  }

  if (
    included.includes(
      'transactions',
    )
  ) {
    const cutoff =
      subtractDaysIso(
        source.today,
        90,
      )

    envelope.context.transactions =
      recordedTransactions
        .filter(
          (transaction) =>
            transaction.date >=
            cutoff,
        )
        .map(
          (transaction) => ({
            date:
              transaction.date,
            kind:
              transaction.kind,
            amountChetrum:
              transaction.amountChetrum,
            category:
              transaction.category,
          }),
        )
  }

  if (
    included.includes(
      'commitments',
    )
  ) {
    envelope.context.commitments =
      source.regularMoney.map(
        (item) => ({
          name:
            item.name,
          kind:
            item.kind,
          amountChetrum:
            item.amountChetrum,
          frequency:
            item.frequency,
          startDate:
            item.startDate,
          endDate:
            item.endDate,
        }),
      )
  }

  if (
    included.includes(
      'savings',
    )
  ) {
    envelope.context.savings = {
      accounts:
        source.savingsAccounts.map(
          (account) => ({
            name:
              account.name,
            balanceChetrum:
              account.balanceChetrum,
          }),
        ),
      fixedDeposits:
        source.fixedDeposits.map(
          (deposit) => ({
            name:
              deposit.name,
            principalChetrum:
              deposit.principalChetrum,
            annualRateBps:
              deposit.annualRateBps,
            tenureMonths:
              deposit.tenureMonths,
            startDate:
              deposit.startDate,
          }),
        ),
      recurringDeposits:
        source.recurringDeposits.map(
          (deposit) => ({
            name:
              deposit.name,
            installmentChetrum:
              deposit.installmentChetrum,
            annualRateBps:
              deposit.annualRateBps,
            tenureMonths:
              deposit.tenureMonths,
            installmentsPaid:
              deposit.installmentsPaid,
            startDate:
              deposit.startDate,
          }),
        ),
    }
  }

  if (
    included.includes(
      'loans',
    )
  ) {
    envelope.context.loans =
      source.loans.map(
        (loan) => ({
          name:
            loan.name,
          lender:
            loan.lender,
          outstandingPrincipalChetrum:
            loan.outstandingPrincipalChetrum,
          annualRateBps:
            loan.annualRateBps,
          emiChetrum:
            loan.emiChetrum,
          tenureMonths:
            loan.tenureMonths,
          startDate:
            loan.startDate,
        }),
      )
  }

  if (
    included.includes(
      'goals',
    )
  ) {
    envelope.context.goals =
      source.goals.map(
        (goal) => ({
          name:
            goal.name,
          targetChetrum:
            goal.targetChetrum,
          contributedChetrum:
            sumGoalContributions(
              goal.id,
              source.goalContributions,
            ),
          targetDate:
            goal.targetDate,
        }),
      )
  }

  return envelope
}