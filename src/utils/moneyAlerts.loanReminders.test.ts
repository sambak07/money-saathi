import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  buildMoneyAlerts,
} from './moneyAlerts'

describe('verified loan alert integration', () => {
  it('creates an alert from a user-verified loan reminder date', () => {
    const alerts =
      buildMoneyAlerts({
        today: '2026-09-22',
        dueSoonDays: 7,
        regularMoney: [],
        transactions: [],
        schemes: [],
        recordedBalanceChetrum: 0,
        safeToSpendChetrum: 0,
        upcomingCommitmentsChetrum: 0,
        loanReminders: [
          {
            loanId: 'loan-1',
            loanName: 'Vehicle loan',
            amountChetrum: 120_000,
            nextDueDate: '2026-09-25',
            frequency: 'monthly',
          },
        ],
      })

    const loanAlert =
      alerts.find(
        (alert) =>
          alert.source === 'loan',
      )

    expect(
      loanAlert?.title,
    ).toContain('Vehicle loan')

    expect(
      loanAlert?.detail,
    ).toContain(
      'were entered by you',
    )

    expect(
      loanAlert?.amountChetrum,
    ).toBe(120_000)
  })

  it('keeps an unresolved loan reminder visible after more than 30 days overdue', () => {
    const alerts =
      buildMoneyAlerts({
        today: '2026-09-22',
        dueSoonDays: 7,
        regularMoney: [],
        transactions: [],
        schemes: [],
        recordedBalanceChetrum: 0,
        safeToSpendChetrum: 0,
        upcomingCommitmentsChetrum: 0,
        loanReminders: [
          {
            loanId: 'loan-old',
            loanName: 'Old loan',
            amountChetrum: 120_000,
            nextDueDate: '2026-08-01',
            frequency: 'monthly',
          },
        ],
      })

    expect(
      alerts.some(
        (alert) =>
          alert.source === 'loan' &&
          alert.status === 'overdue',
      ),
    ).toBe(true)
  })

  it('does not invent a loan alert when no verified reminder exists', () => {
    const alerts =
      buildMoneyAlerts({
        today: '2026-09-22',
        dueSoonDays: 7,
        regularMoney: [],
        transactions: [],
        schemes: [],
        recordedBalanceChetrum: 0,
        safeToSpendChetrum: 0,
        upcomingCommitmentsChetrum: 0,
      })

    expect(
      alerts.some(
        (alert) =>
          alert.source === 'loan',
      ),
    ).toBe(false)
  })
})
