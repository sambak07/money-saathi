import type {
  EncryptedVaultRecord,
  VaultConfig,
} from '../types/vault'
import {
  createVaultSecurity,
  decryptVaultRecord,
  encryptVaultEntry,
  unlockVaultKey,
} from './vaultCrypto'
import {
  getEncryptedVaultRecords,
  getVaultConfig,
  replaceVaultStorage,
} from './vaultStore'

export class VaultCurrentPassphraseError
  extends Error {
  constructor() {
    super(
      'The current Vault passphrase is incorrect.',
    )

    this.name =
      'VaultCurrentPassphraseError'
  }
}

export interface RekeyedVaultPayload {
  config: VaultConfig
  records: EncryptedVaultRecord[]
  key: CryptoKey
}

export async function buildRekeyedVaultPayload(
  currentPassphrase: string,
  newPassphrase: string,
  config: VaultConfig,
  records: EncryptedVaultRecord[],
): Promise<RekeyedVaultPayload> {
  let currentKey: CryptoKey

  try {
    currentKey =
      await unlockVaultKey(
        currentPassphrase,
        config,
      )
  } catch {
    throw new VaultCurrentPassphraseError()
  }

  const entries =
    await Promise.all(
      records.map(
        (record) =>
          decryptVaultRecord(
            record,
            currentKey,
          ),
      ),
    )

  const {
    config: nextConfig,
    key: nextKey,
  } =
    await createVaultSecurity(
      newPassphrase,
    )

  const nextRecords =
    await Promise.all(
      entries.map(
        (entry) =>
          encryptVaultEntry(
            entry,
            nextKey,
          ),
      ),
    )

  return {
    config: nextConfig,
    records: nextRecords,
    key: nextKey,
  }
}

export async function changeVaultPassphrase(
  currentPassphrase: string,
  newPassphrase: string,
): Promise<CryptoKey> {
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

  const rekeyed =
    await buildRekeyedVaultPayload(
      currentPassphrase,
      newPassphrase,
      config,
      records,
    )

  // The configuration and every encrypted record are replaced
  // in one IndexedDB transaction. Nothing is persisted until all
  // existing records have first been decrypted and re-encrypted
  // successfully in memory.
  await replaceVaultStorage(
    rekeyed.config,
    rekeyed.records,
  )

  return rekeyed.key
}