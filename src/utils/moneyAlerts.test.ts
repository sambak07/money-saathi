import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  FinancialScheme,
} from '../types/scheme'
import type {
  RegularMoney,
} from '../types/regularMoney'
import type {
  MoneyTransaction,
} from '../types/transaction'
import {
  buildMoneyAlerts,
  countAlertLevels,
} from './moneyAlerts'

function regular(
  overrides: Partial<RegularMoney>,
): RegularMoney {
  return {
    id: 'rent',
    name: 'Rent',
    kind: 'expense',
    amountChetrum: 100_000,
    category: 'Housing',
    frequency: 'monthly',
    startDate: '2026-09-25',
    endDate: '',
    note: '',
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  }
}

function transaction(
  overrides: Partial<MoneyTransaction>,
): MoneyTransaction {
  return {
    id: 't1',
    kind: 'expense',
    amountChetrum: 100_000,
    category: 'Housing',
    note: '',
    date: '2026-09-25',
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  }
}

function scheme(
  overrides: Partial<FinancialScheme>,
): FinancialScheme {
  return {
    id: 'scheme-1',
    name: 'Protection plan',
    provider: 'Provider',
    category: 'endowment',
    status: 'active',
    contributionChetrum: 50_000,
    contributionFrequency: 'monthly',
    currentValueChetrum: 0,
    protectionCoverChetrum: 0,
    futureBenefitChetrum: 0,
    startDate: '2026-01-01',
    nextContributionDate: '2026-09-28',
    maturityDate: '',
    note: '',
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  }
}

describe('Money Saathi alerts', () => {
  it('creates due-soon and today reminders from Regular Money', () => {
    const alerts =
      buildMoneyAlerts({
        today: '2026-09-22',
        dueSoonDays: 7,
        regularMoney: [
          regular({
            startDate: '2026-09-22',
          }),
          regular({
            id: 'internet',
            name: 'Internet',
            startDate: '2026-09-25',
          }),
        ],
        transactions: [],
        schemes: [],
        recordedBalanceChetrum:
          1_000_000,
        safeToSpendChetrum:
          900_000,
        upcomingCommitmentsChetrum:
          100_000,
      })

    expect(
      alerts.some(
        (alert) =>
          alert.status === 'today',
      ),
    ).toBe(true)

    expect(
      alerts.some(
        (alert) =>
          alert.status === 'soon',
      ),
    ).toBe(true)
  })

  it('does not remind for a recurring occurrence already recorded', () => {
    const alerts =
      buildMoneyAlerts({
        today: '2026-09-22',
        dueSoonDays: 7,
        regularMoney: [
          regular({
            startDate: '2026-09-25',
          }),
        ],
        transactions: [
          transaction({
            recurringSourceId:
              'rent',
            scheduledFor:
              '2026-09-25',
          }),
        ],
        schemes: [],
        recordedBalanceChetrum:
          1_000_000,
        safeToSpendChetrum:
          900_000,
        upcomingCommitmentsChetrum:
          0,
      })

    expect(
      alerts.some(
        (alert) =>
          alert.source ===
          'regular-money',
      ),
    ).toBe(false)
  })

  it('shows stale scheme contribution dates as references rather than proof of non-payment', () => {
    const alerts =
      buildMoneyAlerts({
        today: '2026-09-22',
        dueSoonDays: 7,
        regularMoney: [],
        transactions: [],
        schemes: [
          scheme({
            nextContributionDate:
              '2026-09-20',
          }),
        ],
        recordedBalanceChetrum:
          0,
        safeToSpendChetrum: 0,
        upcomingCommitmentsChetrum:
          0,
      })

    expect(
      alerts[0].detail,
    ).toContain(
      'cannot know whether a contribution was actually paid',
    )
  })

  it('keeps an old unresolved Regular Money occurrence visible without dropping it after 30 days', () => {
    const alerts =
      buildMoneyAlerts({
        today: '2026-09-22',
        dueSoonDays: 7,
        regularMoney: [
          regular({
            id: 'old-rent',
            startDate: '2026-07-01',
          }),
        ],
        transactions: [],
        schemes: [],
        recordedBalanceChetrum:
          1_000_000,
        safeToSpendChetrum:
          900_000,
        upcomingCommitmentsChetrum:
          100_000,
      })

    expect(
      alerts.some(
        (alert) =>
          alert.source === 'regular-money' &&
          alert.status === 'overdue' &&
          alert.dueDate === '2026-07-01',
      ),
    ).toBe(true)
  })

  it('adds a non-notification status alert when Safe to Spend reaches zero', () => {
    const alerts =
      buildMoneyAlerts({
        today: '2026-09-22',
        dueSoonDays: 7,
        regularMoney: [],
        transactions: [],
        schemes: [],
        recordedBalanceChetrum:
          500_000,
        safeToSpendChetrum: 0,
        upcomingCommitmentsChetrum:
          500_000,
      })

    const safeAlert =
      alerts.find(
        (alert) =>
          alert.source ===
          'safe-to-spend',
      )

    expect(
      safeAlert?.notificationEligible,
    ).toBe(false)
  })

  it('counts alert levels', () => {
    expect(
      countAlertLevels([
        {
          id: '1',
          level: 'urgent',
          status: 'today',
          source: 'regular-money',
          title: 'A',
          detail: 'A',
          dueDate: '2026-09-22',
          amountChetrum: 1,
          href: '/app',
          actionLabel: 'Open',
          notificationEligible: true,
        },
        {
          id: '2',
          level: 'attention',
          status: 'soon',
          source: 'scheme',
          title: 'B',
          detail: 'B',
          dueDate: '2026-09-23',
          amountChetrum: 1,
          href: '/app',
          actionLabel: 'Open',
          notificationEligible: true,
        },
      ]),
    ).toEqual({
      urgent: 1,
      attention: 1,
      info: 0,
    })
  })
})
