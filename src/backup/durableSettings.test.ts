import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  isValidBackupPayload,
} from './backup'
import {
  isValidDurableSettingsBackup,
} from './durableSettings'

const emptyData = {
  transactions: [],
  budgets: [],
  regularMoney: [],
  goals: [],
  goalContributions: [],
  savingsAccounts: [],
  fixedDeposits: [],
  recurringDeposits: [],
  loans: [],
  financialSchemes: [],
  businessProfiles: [],
  businessTransactions: [],
  businessParties: [],
  businessOpenItems: [],
}

const durableSettings = {
  preferences: {
    displayName: '',
    reportTrendMonths: 6,
    dashboardRecentCount: 5,
    safetyBufferChetrum: 100_000,
  },
  profile: {
    needs: [
      'daily-money',
      'savings-goals',
    ],
    homeExperience: 'full',
  },
  financialSafety: {
    targetMonths: 6,
  },
  irregularIncome: {
    planningFloorChetrum:
      300_000,
  },
  alertPreferences: {
    dueSoonDays: 7,
    browserNotifications: true,
    quietHoursEnabled: true,
    quietStart: '21:00',
    quietEnd: '07:00',
  },
  loanDueReminders: [
    {
      loanId: 'loan-1',
      amountChetrum: 142_000,
      nextDueDate: '2026-09-30',
      frequency: 'monthly',
      enabled: true,
      updatedAt: 1,
    },
  ],
}

describe('durable encrypted backup coverage', () => {
  it('accepts a complete durable settings snapshot', () => {
    expect(
      isValidDurableSettingsBackup(
        durableSettings,
      ),
    ).toBe(true)
  })

  it('rejects unsafe loan reminder money', () => {
    expect(
      isValidDurableSettingsBackup({
        ...durableSettings,
        loanDueReminders: [
          {
            ...durableSettings
              .loanDueReminders[0],
            amountChetrum:
              Number.MAX_SAFE_INTEGER +
              1,
          },
        ],
      }),
    ).toBe(false)
  })

  it('accepts new backups with durable settings', () => {
    expect(
      isValidBackupPayload({
        format: BACKUP_FORMAT,
        version: BACKUP_VERSION,
        exportedAt:
          '2026-09-22T10:00:00.000Z',
        data: emptyData,
        settings:
          durableSettings,
      }),
    ).toBe(true)
  })

  it('keeps legacy version 1 backups without settings valid', () => {
    expect(
      isValidBackupPayload({
        format: BACKUP_FORMAT,
        version: BACKUP_VERSION,
        exportedAt:
          '2026-09-22T10:00:00.000Z',
        data: emptyData,
      }),
    ).toBe(true)
  })

  it('rejects corrupt optional settings in an otherwise valid backup', () => {
    expect(
      isValidBackupPayload({
        format: BACKUP_FORMAT,
        version: BACKUP_VERSION,
        exportedAt:
          '2026-09-22T10:00:00.000Z',
        data: emptyData,
        settings: {
          ...durableSettings,
          alertPreferences: {
            ...durableSettings
              .alertPreferences,
            dueSoonDays: 99,
          },
        },
      }),
    ).toBe(false)
  })
})
