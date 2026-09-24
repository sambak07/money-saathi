import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  FixedDeposit,
  RecurringDeposit,
} from '../types/asset'
import type {
  FinancialScheme,
} from '../types/scheme'
import {
  buildMoneyAlerts,
  type BusinessDueReference,
} from './moneyAlerts'

const baseInput = {
  today:
    '2026-09-24',
  dueSoonDays:
    7,
  regularMoney: [],
  transactions: [],
  schemes: [] as FinancialScheme[],
  recordedBalanceChetrum:
    0,
  safeToSpendChetrum:
    0,
  upcomingCommitmentsChetrum:
    0,
}

function fixedDeposit(
  overrides:
    Partial<FixedDeposit> = {},
): FixedDeposit {
  return {
    id: 'fd-1',
    name: 'One year FD',
    principalChetrum:
      1_000_000,
    annualRateBps:
      600,
    tenureMonths:
      12,
    startDate:
      '2025-09-30',
    note: '',
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  }
}

function recurringDeposit(
  overrides:
    Partial<RecurringDeposit> = {},
): RecurringDeposit {
  return {
    id: 'rd-1',
    name: 'Monthly RD',
    installmentChetrum:
      10_000,
    annualRateBps:
      500,
    tenureMonths:
      12,
    installmentsPaid:
      11,
    startDate:
      '2025-09-27',
    note: '',
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  }
}

function scheme(
  overrides:
    Partial<FinancialScheme> = {},
): FinancialScheme {
  return {
    id: 'scheme-1',
    name: 'Education plan',
    provider: 'Provider',
    category: 'education',
    status: 'active',
    contributionChetrum: 0,
    contributionFrequency:
      'none',
    currentValueChetrum: 0,
    protectionCoverChetrum: 0,
    futureBenefitChetrum:
      5_000_000,
    startDate:
      '2020-09-30',
    nextContributionDate:
      '',
    maturityDate:
      '2026-09-30',
    note: '',
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  }
}

describe('Money Saathi due-date completion', () => {
  it('creates FD and RD maturity reminders without inventing payout amounts', () => {
    const alerts =
      buildMoneyAlerts({
        ...baseInput,
        fixedDeposits: [
          fixedDeposit(),
        ],
        recurringDeposits: [
          recurringDeposit(),
        ],
      })

    const depositAlerts =
      alerts.filter(
        (alert) =>
          alert.source ===
          'deposit',
      )

    expect(
      depositAlerts,
    ).toHaveLength(2)

    expect(
      depositAlerts.every(
        (alert) =>
          alert.amountChetrum ===
          null,
      ),
    ).toBe(true)

    expect(
      depositAlerts[0].detail,
    ).toContain(
      'does not assume the maturity payout amount',
    )
  })

  it('creates an explicit scheme maturity reminder without treating future benefit as cash', () => {
    const alerts =
      buildMoneyAlerts({
        ...baseInput,
        schemes: [
          scheme(),
        ],
      })

    const maturity =
      alerts.find(
        (alert) =>
          alert.id.startsWith(
            'scheme-maturity:',
          ),
      )

    expect(
      maturity?.amountChetrum,
    ).toBeNull()

    expect(
      maturity?.detail,
    ).toContain(
      'not treated as guaranteed cash',
    )
  })

  it('creates recorded business due reminders only while an amount remains outstanding', () => {
    const due:
      BusinessDueReference = {
        id: 'due-1',
        businessId:
          'business-1',
        businessName:
          'BAiL Auto',
        direction:
          'payable',
        outstandingAmountChetrum:
          50_000,
        dueDate:
          '2026-09-24',
      }

    const alerts =
      buildMoneyAlerts({
        ...baseInput,
        businessDues: [
          due,
          {
            ...due,
            id: 'settled',
            outstandingAmountChetrum:
              0,
          },
        ],
      })

    const businessAlerts =
      alerts.filter(
        (alert) =>
          alert.source ===
          'business-due',
      )

    expect(
      businessAlerts,
    ).toHaveLength(1)

    expect(
      businessAlerts[0].level,
    ).toBe('urgent')

    expect(
      businessAlerts[0].amountChetrum,
    ).toBe(50_000)
  })
})