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
})


