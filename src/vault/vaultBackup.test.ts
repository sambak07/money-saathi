import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  VaultEntry,
} from '../types/vault'
import {
  createVaultSecurity,
  encryptVaultEntry,
} from './vaultCrypto'
import {
  isValidVaultBackupEnvelope,
  parseVaultBackupText,
  serializeVaultBackup,
  verifyVaultBackup,
} from './vaultBackup'

function sampleEntry(): VaultEntry {
  return {
    id: 'vault-backup-1',
    kind: 'account',
    title: 'Primary account',
    institution: 'Example Bank',
    referenceNumber: '001122334455',
    importantDate: '',
    notes: 'Reference only.',
    createdAt: 100,
    updatedAt: 100,
  }
}

describe('Money Vault encrypted backup', () => {
  it('serializes only encrypted record payloads', async () => {
    const {
      config,
      key,
    } =
      await createVaultSecurity(
        'backup passphrase value',
      )

    const entry =
      sampleEntry()

    const encrypted =
      await encryptVaultEntry(
        entry,
        key,
      )

    const envelope = {
      format:
        'MoneySaathiVaultBackup' as const,
      version: 1 as const,
      exportedAt:
        new Date().toISOString(),
      config,
      records: [
        encrypted,
      ],
    }

    const text =
      serializeVaultBackup(
        envelope,
      )

    expect(text).not.toContain(
      entry.referenceNumber,
    )

    expect(text).not.toContain(
      entry.institution,
    )

    expect(
      isValidVaultBackupEnvelope(
        JSON.parse(text),
      ),
    ).toBe(true)
  })

  it('parses and verifies a valid backup with the Vault passphrase', async () => {
    const {
      config,
      key,
    } =
      await createVaultSecurity(
        'backup passphrase value',
      )

    const encrypted =
      await encryptVaultEntry(
        sampleEntry(),
        key,
      )

    const text =
      serializeVaultBackup({
        format:
          'MoneySaathiVaultBackup',
        version: 1,
        exportedAt:
          new Date().toISOString(),
        config,
        records: [
          encrypted,
        ],
      })

    const parsed =
      parseVaultBackupText(
        text,
      )

    const restoredKey =
      await verifyVaultBackup(
        parsed,
        'backup passphrase value',
      )

    expect(
      restoredKey.extractable,
    ).toBe(false)
  })

  it('rejects duplicate encrypted record identifiers', async () => {
    const {
      config,
      key,
    } =
      await createVaultSecurity(
        'backup passphrase value',
      )

    const encrypted =
      await encryptVaultEntry(
        sampleEntry(),
        key,
      )

    expect(
      isValidVaultBackupEnvelope({
        format:
          'MoneySaathiVaultBackup',
        version: 1,
        exportedAt:
          new Date().toISOString(),
        config,
        records: [
          encrypted,
          encrypted,
        ],
      }),
    ).toBe(false)
  })
})