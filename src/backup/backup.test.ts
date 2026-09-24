import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  MoneySaathiDatabaseSnapshot,
} from '../storage/db'
import {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  buildBackupSummary,
  isValidBackupPayload,
  migrateBackupPayload,
} from './backup'

const emptySnapshot: MoneySaathiDatabaseSnapshot = {
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
}

describe('backup validation', () => {
  it('accepts a valid version 1 payload', () => {
    expect(
      isValidBackupPayload({
        format: BACKUP_FORMAT,
        version: BACKUP_VERSION,
        exportedAt: '2026-09-22T10:00:00.000Z',
        data: emptySnapshot,
      }),
    ).toBe(true)
  })

  it('rejects payloads with missing data collections', () => {
    expect(
      isValidBackupPayload({
        format: BACKUP_FORMAT,
        version: BACKUP_VERSION,
        exportedAt: '2026-09-22T10:00:00.000Z',
        data: {
          transactions: [],
        },
      }),
    ).toBe(false)
  })

  it('builds a complete record summary', () => {
    const summary = buildBackupSummary({
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      exportedAt: '2026-09-22T10:00:00.000Z',
      data: {
        ...emptySnapshot,
        transactions: [
          {
            id: 't1',
            kind: 'expense',
            amountChetrum: 100,
            category: 'Food',
            note: '',
            date: '2026-09-22',
            createdAt: 1,
            updatedAt: 1,
          },
        ],
      },
    })

    expect(summary.transactions).toBe(1)
    expect(summary.totalRecords).toBe(1)
  })

  it('rejects duplicate record IDs before restore', () => {
    const duplicate = {
      id: 't1',
      kind: 'expense',
      amountChetrum: 100,
      category: 'Food',
      note: '',
      date: '2026-09-22',
      createdAt: 1,
      updatedAt: 1,
    }

    expect(
      isValidBackupPayload({
        format: BACKUP_FORMAT,
        version: BACKUP_VERSION,
        exportedAt: '2026-09-22T10:00:00.000Z',
        data: {
          ...emptySnapshot,
          transactions: [
            duplicate,
            { ...duplicate },
          ],
        },
      }),
    ).toBe(false)
  })

  it('rejects unsafe integer money values before restore', () => {
    expect(
      isValidBackupPayload({
        format: BACKUP_FORMAT,
        version: BACKUP_VERSION,
        exportedAt: '2026-09-22T10:00:00.000Z',
        data: {
          ...emptySnapshot,
          transactions: [
            {
              id: 't1',
              kind: 'expense',
              amountChetrum:
                Number.MAX_SAFE_INTEGER + 1,
              category: 'Food',
              note: '',
              date: '2026-09-22',
              createdAt: 1,
              updatedAt: 1,
            },
          ],
        },
      }),
    ).toBe(false)
  })

  it('rejects impossible calendar dates before restore', () => {
    expect(
      isValidBackupPayload({
        format: BACKUP_FORMAT,
        version: BACKUP_VERSION,
        exportedAt: '2026-09-22T10:00:00.000Z',
        data: {
          ...emptySnapshot,
          transactions: [
            {
              id: 't1',
              kind: 'expense',
              amountChetrum: 100,
              category: 'Food',
              note: '',
              date: '2026-02-31',
              createdAt: 1,
              updatedAt: 1,
            },
          ],
        },
      }),
    ).toBe(false)
  })

  it('rejects unsupported transaction kinds before restore', () => {
    expect(
      isValidBackupPayload({
        format: BACKUP_FORMAT,
        version: BACKUP_VERSION,
        exportedAt: '2026-09-22T10:00:00.000Z',
        data: {
          ...emptySnapshot,
          transactions: [
            {
              id: 't1',
              kind: 'transfer',
              amountChetrum: 100,
              category: 'Other',
              note: '',
              date: '2026-09-22',
              createdAt: 1,
              updatedAt: 1,
            },
          ],
        },
      }),
    ).toBe(false)
  })

  it('rejects a financial record that contains only an ID', () => {
    expect(
      isValidBackupPayload({
        format: BACKUP_FORMAT,
        version: BACKUP_VERSION,
        exportedAt: '2026-09-22T10:00:00.000Z',
        data: {
          ...emptySnapshot,
          transactions: [
            {
              id: 'missing-fields',
            },
          ],
        },
      }),
    ).toBe(false)
  })

  it('rejects orphaned goal contributions and business transactions', () => {
    expect(
      isValidBackupPayload({
        format: BACKUP_FORMAT,
        version: BACKUP_VERSION,
        exportedAt: '2026-09-22T10:00:00.000Z',
        data: {
          ...emptySnapshot,
          goalContributions: [
            {
              id: 'contribution',
              goalId: 'missing-goal',
              amountChetrum: 100,
              date: '2026-09-22',
              note: '',
              createdAt: 1,
            },
          ],
        },
      }),
    ).toBe(false)

    expect(
      isValidBackupPayload({
        format: BACKUP_FORMAT,
        version: BACKUP_VERSION,
        exportedAt: '2026-09-22T10:00:00.000Z',
        data: {
          ...emptySnapshot,
          businessTransactions: [
            {
              id: 'business-transaction',
              businessId: 'missing-business',
              kind: 'income',
              amountChetrum: 100,
              category: 'Sales',
              note: '',
              date: '2026-09-22',
              createdAt: 1,
              updatedAt: 1,
            },
          ],
        },
      }),
    ).toBe(false)
  })

  it('migrates the original version 1 backup shape to the current snapshot', () => {
    const legacyData = {
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
    }

    const migrated =
      migrateBackupPayload({
        format: BACKUP_FORMAT,
        version: BACKUP_VERSION,
        exportedAt: '2026-09-22T10:00:00.000Z',
        data: legacyData,
      })

    expect(migrated).not.toBeNull()
    expect(
      migrated?.data.businessProfiles,
    ).toEqual([])
    expect(
      migrated?.data.businessTransactions,
    ).toEqual([])
  })

  it('includes business collections in the restore summary', () => {
    const summary =
      buildBackupSummary({
        format: BACKUP_FORMAT,
        version: BACKUP_VERSION,
        exportedAt: '2026-09-22T10:00:00.000Z',
        data: {
          ...emptySnapshot,
          businessProfiles: [
            {
              id: 'business-1',
              name: 'Druk Shop',
              createdAt: 1,
              updatedAt: 1,
            },
          ],
          businessTransactions: [
            {
              id: 'business-tx-1',
              businessId: 'business-1',
              kind: 'income',
              amountChetrum: 100,
              category: 'Sales',
              note: '',
              date: '2026-09-22',
              createdAt: 1,
              updatedAt: 1,
            },
          ],
        },
      })

    expect(
      summary.businessProfiles,
    ).toBe(1)
    expect(
      summary.businessTransactions,
    ).toBe(1)
    expect(
      summary.totalRecords,
    ).toBe(2)
  })
})


