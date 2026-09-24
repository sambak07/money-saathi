import type {
  EncryptedVaultRecord,
  VaultBackupEnvelope,
  VaultConfig,
} from '../types/vault'
import {
  decryptVaultRecord,
  unlockVaultKey,
} from './vaultCrypto'
import {
  getEncryptedVaultRecords,
  getVaultConfig,
  replaceVaultStorage,
} from './vaultStore'

export const VAULT_BACKUP_FORMAT =
  'MoneySaathiVaultBackup' as const

export const VAULT_BACKUP_VERSION =
  1 as const

export const MAX_VAULT_BACKUP_BYTES =
  10 * 1024 * 1024

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null
  )
}

function isFiniteNumber(
  value: unknown,
): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value)
  )
}

function isVaultConfig(
  value: unknown,
): value is VaultConfig {
  if (!isRecord(value)) {
    return false
  }

  return (
    value.version === 1 &&
    typeof value.salt === 'string' &&
    value.salt.length > 0 &&
    typeof value.verifierIv === 'string' &&
    value.verifierIv.length > 0 &&
    typeof value.verifierCiphertext === 'string' &&
    value.verifierCiphertext.length > 0 &&
    isFiniteNumber(value.createdAt)
  )
}

function isEncryptedVaultRecord(
  value: unknown,
): value is EncryptedVaultRecord {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.id === 'string' &&
    value.id.length > 0 &&
    value.version === 1 &&
    typeof value.iv === 'string' &&
    value.iv.length > 0 &&
    typeof value.ciphertext === 'string' &&
    value.ciphertext.length > 0 &&
    isFiniteNumber(value.createdAt) &&
    isFiniteNumber(value.updatedAt)
  )
}

export function isValidVaultBackupEnvelope(
  value: unknown,
): value is VaultBackupEnvelope {
  if (!isRecord(value)) {
    return false
  }

  if (
    value.format !==
      VAULT_BACKUP_FORMAT ||
    value.version !==
      VAULT_BACKUP_VERSION ||
    typeof value.exportedAt !==
      'string' ||
    Number.isNaN(
      Date.parse(
        value.exportedAt,
      ),
    ) ||
    !isVaultConfig(
      value.config,
    ) ||
    !Array.isArray(
      value.records,
    ) ||
    !value.records.every(
      isEncryptedVaultRecord,
    )
  ) {
    return false
  }

  const ids =
    new Set<string>()

  for (
    const record of value.records
  ) {
    if (
      ids.has(record.id)
    ) {
      return false
    }

    ids.add(record.id)
  }

  return true
}

export async function buildVaultBackup(): Promise<
  VaultBackupEnvelope
> {
  const [
    config,
    records,
  ] =
    await Promise.all([
      getVaultConfig(),
      getEncryptedVaultRecords(),
    ])

  if (!config) {
    throw new Error(
      'Money Vault has not been created yet.',
    )
  }

  return {
    format:
      VAULT_BACKUP_FORMAT,
    version:
      VAULT_BACKUP_VERSION,
    exportedAt:
      new Date().toISOString(),
    config,
    records,
  }
}

export function serializeVaultBackup(
  envelope: VaultBackupEnvelope,
): string {
  if (
    !isValidVaultBackupEnvelope(
      envelope,
    )
  ) {
    throw new Error(
      'Money Vault backup is not valid.',
    )
  }

  return JSON.stringify(
    envelope,
    null,
    2,
  )
}

export function parseVaultBackupText(
  text: string,
): VaultBackupEnvelope {
  const bytes =
    new TextEncoder().encode(
      text,
    ).byteLength

  if (
    bytes >
    MAX_VAULT_BACKUP_BYTES
  ) {
    throw new Error(
      'This Money Vault backup is too large.',
    )
  }

  const parsed: unknown =
    JSON.parse(text)

  if (
    !isValidVaultBackupEnvelope(
      parsed,
    )
  ) {
    throw new Error(
      'This is not a supported Money Vault backup.',
    )
  }

  return parsed
}

export async function verifyVaultBackup(
  envelope: VaultBackupEnvelope,
  passphrase: string,
): Promise<CryptoKey> {
  if (
    !isValidVaultBackupEnvelope(
      envelope,
    )
  ) {
    throw new Error(
      'Money Vault backup is not valid.',
    )
  }

  const key =
    await unlockVaultKey(
      passphrase,
      envelope.config,
    )

  await Promise.all(
    envelope.records.map(
      (record) =>
        decryptVaultRecord(
          record,
          key,
        ),
    ),
  )

  return key
}

export async function restoreVaultBackup(
  envelope: VaultBackupEnvelope,
  passphrase: string,
): Promise<CryptoKey> {
  const key =
    await verifyVaultBackup(
      envelope,
      passphrase,
    )

  await replaceVaultStorage(
    envelope.config,
    envelope.records,
  )

  return key
}