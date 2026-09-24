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
  decryptVaultRecord,
  encryptVaultEntry,
  unlockVaultKey,
} from './vaultCrypto'
import {
  buildRekeyedVaultPayload,
  VaultCurrentPassphraseError,
} from './vaultRekey'

const originalPassphrase =
  'original vault passphrase'

const nextPassphrase =
  'new vault passphrase 2026'

const entry: VaultEntry = {
  id: 'rekey-entry-1',
  kind: 'account',
  title: 'Primary account',
  institution: 'Example Bank',
  referenceNumber: '00123456789',
  importantDate: '',
  notes: 'Rekey test record',
  createdAt: 1_700_000_000_000,
  updatedAt: 1_700_000_000_000,
}

describe('Money Vault passphrase rekey', () => {
  it('re-encrypts every record under a fresh key and config', async () => {
    const original =
      await createVaultSecurity(
        originalPassphrase,
      )

    const originalRecord =
      await encryptVaultEntry(
        entry,
        original.key,
      )

    const rekeyed =
      await buildRekeyedVaultPayload(
        originalPassphrase,
        nextPassphrase,
        original.config,
        [originalRecord],
      )

    expect(
      rekeyed.config.salt,
    ).not.toBe(
      original.config.salt,
    )

    expect(
      rekeyed.records,
    ).toHaveLength(1)

    expect(
      rekeyed.records[0].id,
    ).toBe(
      originalRecord.id,
    )

    expect(
      rekeyed.records[0].ciphertext,
    ).not.toBe(
      originalRecord.ciphertext,
    )

    const nextKey =
      await unlockVaultKey(
        nextPassphrase,
        rekeyed.config,
      )

    await expect(
      decryptVaultRecord(
        rekeyed.records[0],
        nextKey,
      ),
    ).resolves.toEqual(
      entry,
    )

    await expect(
      unlockVaultKey(
        originalPassphrase,
        rekeyed.config,
      ),
    ).rejects.toThrow()
  })

  it('rejects an incorrect current passphrase before re-encryption', async () => {
    const original =
      await createVaultSecurity(
        originalPassphrase,
      )

    const originalRecord =
      await encryptVaultEntry(
        entry,
        original.key,
      )

    await expect(
      buildRekeyedVaultPayload(
        'wrong current passphrase',
        nextPassphrase,
        original.config,
        [originalRecord],
      ),
    ).rejects.toBeInstanceOf(
      VaultCurrentPassphraseError,
    )

    await expect(
      decryptVaultRecord(
        originalRecord,
        original.key,
      ),
    ).resolves.toEqual(
      entry,
    )
  })

  it('preserves an empty Vault while rotating its cryptographic config', async () => {
    const original =
      await createVaultSecurity(
        originalPassphrase,
      )

    const rekeyed =
      await buildRekeyedVaultPayload(
        originalPassphrase,
        nextPassphrase,
        original.config,
        [],
      )

    expect(
      rekeyed.records,
    ).toEqual([])

    await expect(
      unlockVaultKey(
        nextPassphrase,
        rekeyed.config,
      ),
    ).resolves.toMatchObject({
      extractable: false,
    })
  })
})