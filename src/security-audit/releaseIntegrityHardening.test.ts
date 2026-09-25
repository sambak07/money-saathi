/// <reference types="node" />

import {
  readFileSync,
} from 'node:fs'
import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  isValidBackupPayload,
  migrateBackupPayload,
} from '../backup/backup'

const appLock =
  readFileSync(
    new URL(
      '../security/appLock.ts',
      import.meta.url,
    ),
    'utf8',
  )

const emptySnapshot = {
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
  businessTradeEntries: [],
  businessInventoryItems: [],
  businessTradeLines: [],
}

describe('Stage 11B release integrity hardening', () => {
  it('rejects a present malformed business collection instead of migrating it to empty', () => {
    const migrated =
      migrateBackupPayload({
        format:
          BACKUP_FORMAT,
        version:
          BACKUP_VERSION,
        exportedAt:
          '2026-09-25T05:30:00.000Z',
        data: {
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
          businessTradeLines:
            'damaged',
        },
      })

    expect(
      migrated,
    ).toBeNull()
  })

  it('still migrates genuinely absent newer business collections for legacy v1 backups', () => {
    const migrated =
      migrateBackupPayload({
        format:
          BACKUP_FORMAT,
        version:
          BACKUP_VERSION,
        exportedAt:
          '2026-09-25T05:30:00.000Z',
        data: {
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
        },
      })

    expect(
      migrated,
    ).not.toBeNull()

    expect(
      migrated?.data.businessTradeLines,
    ).toEqual([])
  })

  it('rejects a business due linked to a party owned by another business', () => {
    expect(
      isValidBackupPayload({
        format:
          BACKUP_FORMAT,
        version:
          BACKUP_VERSION,
        exportedAt:
          '2026-09-25T05:30:00.000Z',
        data: {
          ...emptySnapshot,
          businessProfiles: [
            {
              id: 'business-a',
              name: 'Business A',
              createdAt: 1,
              updatedAt: 1,
            },
            {
              id: 'business-b',
              name: 'Business B',
              createdAt: 1,
              updatedAt: 1,
            },
          ],
          businessParties: [
            {
              id: 'party-b',
              businessId: 'business-b',
              name: 'Customer B',
              role: 'customer',
              phone: '',
              note: '',
              createdAt: 1,
              updatedAt: 1,
            },
          ],
          businessOpenItems: [
            {
              id: 'due-a',
              businessId: 'business-a',
              partyId: 'party-b',
              direction: 'receivable',
              originalAmountChetrum: 100,
              outstandingAmountChetrum: 100,
              date: '2026-09-25',
              dueDate: '',
              reference: '',
              note: '',
              createdAt: 1,
              updatedAt: 1,
            },
          ],
        },
      }),
    ).toBe(false)
  })

  it('clears stale App Lock throttle state on successful credential lifecycle changes', () => {
    const enableStart =
      appLock.indexOf(
        'export async function enableAppLock',
      )

    const verifyStart =
      appLock.indexOf(
        'export async function verifyAppPin',
      )

    const enableBlock =
      appLock.slice(
        enableStart,
        verifyStart,
      )

    expect(
      enableBlock,
    ).toContain(
      'clearPinThrottle()',
    )

    const disableStart =
      appLock.indexOf(
        'export async function disableAppLock',
      )

    const unlockStart =
      appLock.indexOf(
        'export function unlockSession',
      )

    const disableBlock =
      appLock.slice(
        disableStart,
        unlockStart,
      )

    expect(
      disableBlock,
    ).toContain(
      'clearPinThrottle()',
    )
  })
})