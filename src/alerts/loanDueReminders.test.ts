import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  buildLoanReminderReferences,
  markLoanReminderPaid,
  nextMonthlyDueDate,
  sanitizeLoanDueReminder,
} from './loanDueReminders'

describe('verified loan reminders', () => {
  it('rejects invalid reminder records', () => {
    expect(
      sanitizeLoanDueReminder({
        loanId: 'l1',
        amountChetrum: -1,
        nextDueDate: '2026-09-25',
        frequency: 'monthly',
        enabled: true,
        updatedAt: 1,
      }),
    ).toBeNull()
  })

  it('moves a monthly due date forward while respecting shorter months', () => {
    expect(
      nextMonthlyDueDate(
        '2027-01-31',
      ),
    ).toBe('2027-02-28')

    expect(
      nextMonthlyDueDate(
        '2028-01-31',
      ),
    ).toBe('2028-02-29')
  })

  it('disables a one-time reminder after the user marks it paid', () => {
    const result =
      markLoanReminderPaid({
        loanId: 'l1',
        amountChetrum: 100_000,
        nextDueDate: '2026-09-25',
        frequency: 'one-time',
        enabled: true,
        updatedAt: 1,
      })

    expect(result.enabled).toBe(false)
  })

  it('joins reminder records only to existing loans', () => {
    const result =
      buildLoanReminderReferences(
        [
          {
            id: 'l1',
            name: 'Vehicle loan',
          },
        ],
        [
          {
            loanId: 'l1',
            amountChetrum: 100_000,
            nextDueDate: '2026-09-25',
            frequency: 'monthly',
            enabled: true,
            updatedAt: 1,
          },
          {
            loanId: 'missing',
            amountChetrum: 200_000,
            nextDueDate: '2026-09-26',
            frequency: 'monthly',
            enabled: true,
            updatedAt: 1,
          },
        ],
      )

    expect(result).toEqual([
      {
        loanId: 'l1',
        loanName: 'Vehicle loan',
        amountChetrum: 100_000,
        nextDueDate: '2026-09-25',
        frequency: 'monthly',
      },
    ])
  })
})
