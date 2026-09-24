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
  isValidVaultEntry,
  maskVaultReference,
  unlockVaultKey,
} from './vaultCrypto'

function sampleEntry(): VaultEntry {
  return {
    id: 'vault-1',
    kind: 'insurance',
    title: 'Family protection policy',
    institution: 'Example Insurance',
    referenceNumber: 'POL-77889911',
    importantDate: '2030-06-30',
    notes: 'Renewal reference only.',
    createdAt: 1_000,
    updatedAt: 1_000,
  }
}

describe('Money Vault cryptography', () => {
  it('creates a non-extractable key and unlocks it with the correct passphrase', async () => {
    const {
      config,
      key,
    } =
      await createVaultSecurity(
        'correct horse battery staple',
      )

    expect(key.extractable).toBe(false)

    const unlocked =
      await unlockVaultKey(
        'correct horse battery staple',
        config,
      )

    expect(unlocked.extractable).toBe(false)
  })

  it('rejects the wrong Vault passphrase', async () => {
    const {
      config,
    } =
      await createVaultSecurity(
        'correct horse battery staple',
      )

    await expect(
      unlockVaultKey(
        'wrong passphrase value',
        config,
      ),
    ).rejects.toBeTruthy()
  })

  it('encrypts the complete record instead of storing identifiers in plaintext', async () => {
    const {
      key,
    } =
      await createVaultSecurity(
        'correct horse battery staple',
      )

    const entry =
      sampleEntry()

    const encrypted =
      await encryptVaultEntry(
        entry,
        key,
      )

    expect(
      encrypted.ciphertext,
    ).not.toContain(
      entry.referenceNumber,
    )

    expect(
      JSON.stringify(encrypted),
    ).not.toContain(
      entry.institution,
    )

    const decrypted =
      await decryptVaultRecord(
        encrypted,
        key,
      )

    expect(decrypted).toEqual(entry)
  })

  it('masks reference numbers by default', () => {
    expect(
      maskVaultReference(
        'POL-77889911',
      ),
    ).toBe(
      '•••• 9911',
    )
  })

  it('validates supported Vault records', () => {
    expect(
      isValidVaultEntry(
        sampleEntry(),
      ),
    ).toBe(true)

    expect(
      isValidVaultEntry({
        ...sampleEntry(),
        kind: 'password',
      }),
    ).toBe(false)
  })
})