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
  decryptBackupEnvelope,
  encryptBackupPayload,
  parseEncryptedBackupText,
  type MoneySaathiBackupPayload,
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
  businessParties: [],
  businessOpenItems: [],
  businessTradeEntries: [],
  businessInventoryItems: [],
  businessTradeLines: [],
}

function samplePayload():
  MoneySaathiBackupPayload {
  return {
    format:
      BACKUP_FORMAT,
    version:
      BACKUP_VERSION,
    exportedAt:
      '2026-09-30T04:00:00.000Z',
    data: {
      ...emptySnapshot,
      transactions: [
        {
          id: 'backup-test-1',
          kind: 'expense',
          amountChetrum: 12345,
          category: 'Food',
          note: 'Synthetic backup test',
          date: '2026-09-30',
          createdAt: 1,
          updatedAt: 1,
        },
      ],
    },
  }
}

describe(
  'encrypted backup round trip',
  () => {
    it(
      'survives encrypt, serialize, parse and decrypt',
      async () => {
        const payload =
          samplePayload()

        const password =
          'SyntheticBackup@2026'

        const encrypted =
          await encryptBackupPayload(
            payload,
            password,
          )

        const fileText =
          JSON.stringify(
            encrypted,
          )

        const parsed =
          parseEncryptedBackupText(
            fileText,
          )

        const restored =
          await decryptBackupEnvelope(
            parsed,
            password,
          )

        expect(
          restored,
        ).toEqual(
          payload,
        )
      },
    )

    it(
      'rejects the wrong password',
      async () => {
        const encrypted =
          await encryptBackupPayload(
            samplePayload(),
            'CorrectBackup@2026',
          )

        const fileText =
          JSON.stringify(
            encrypted,
          )

        const parsed =
          parseEncryptedBackupText(
            fileText,
          )

        await expect(
          decryptBackupEnvelope(
            parsed,
            'WrongBackup@2026',
          ),
        ).rejects.toBeTruthy()
      },
    )
  },
)
