import type {
  EncryptedVaultRecord,
  VaultConfig,
  VaultEntry,
  VaultKind,
} from '../types/vault'
import {
  VAULT_KINDS,
} from '../types/vault'

const VAULT_VERSION = 1
const PBKDF2_ITERATIONS = 600_000
const SALT_BYTES = 16
const IV_BYTES = 12

const KEY_CHECK_PLAINTEXT =
  'MoneySaathiVaultKeyCheck:v1'

const KEY_CHECK_AAD =
  'MoneySaathiVault:v1:check'

export const VAULT_MIN_PASSPHRASE_LENGTH = 10

const textEncoder =
  new TextEncoder()

const textDecoder =
  new TextDecoder()

function toArrayBuffer(
  bytes: Uint8Array,
): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer
}

function bytesToBase64(
  bytes: Uint8Array,
): string {
  let binary = ''

  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary)
}

function base64ToBytes(
  value: string,
): Uint8Array {
  const binary =
    atob(value)

  const bytes =
    new Uint8Array(binary.length)

  for (
    let index = 0;
    index < binary.length;
    index++
  ) {
    bytes[index] =
      binary.charCodeAt(index)
  }

  return bytes
}

function isVaultKind(
  value: unknown,
): value is VaultKind {
  return (
    typeof value === 'string' &&
    VAULT_KINDS.includes(
      value as VaultKind,
    )
  )
}

function isSafeText(
  value: unknown,
  maxLength: number,
): value is string {
  return (
    typeof value === 'string' &&
    value.length <= maxLength
  )
}

export function isValidVaultEntry(
  value: unknown,
): value is VaultEntry {
  if (
    typeof value !== 'object' ||
    value === null
  ) {
    return false
  }

  const record =
    value as Record<string, unknown>

  return (
    typeof record.id === 'string' &&
    record.id.length > 0 &&
    isVaultKind(record.kind) &&
    isSafeText(record.title, 120) &&
    record.title.trim().length > 0 &&
    isSafeText(record.institution, 120) &&
    isSafeText(record.referenceNumber, 180) &&
    isSafeText(record.importantDate, 10) &&
    (
      record.importantDate === '' ||
      /^\d{4}-\d{2}-\d{2}$/.test(
        record.importantDate,
      )
    ) &&
    isSafeText(record.notes, 1_500) &&
    typeof record.createdAt === 'number' &&
    Number.isFinite(record.createdAt) &&
    typeof record.updatedAt === 'number' &&
    Number.isFinite(record.updatedAt)
  )
}

export function maskVaultReference(
  value: string,
): string {
  const cleaned =
    value.trim()

  if (!cleaned) {
    return 'Not recorded'
  }

  const visible =
    cleaned.slice(-4)

  return `•••• ${visible}`
}

async function deriveVaultKey(
  passphrase: string,
  salt: Uint8Array,
): Promise<CryptoKey> {
  const keyMaterial =
    await crypto.subtle.importKey(
      'raw',
      toArrayBuffer(
        textEncoder.encode(passphrase),
      ),
      'PBKDF2',
      false,
      ['deriveKey'],
    )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: toArrayBuffer(salt),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    [
      'encrypt',
      'decrypt',
    ],
  )
}

async function encryptText(
  plaintext: string,
  key: CryptoKey,
  aad: string,
): Promise<{
  iv: string
  ciphertext: string
}> {
  const iv =
    crypto.getRandomValues(
      new Uint8Array(IV_BYTES),
    )

  const encrypted =
    await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: toArrayBuffer(iv),
        additionalData:
          toArrayBuffer(
            textEncoder.encode(aad),
          ),
      },
      key,
      toArrayBuffer(
        textEncoder.encode(plaintext),
      ),
    )

  return {
    iv: bytesToBase64(iv),
    ciphertext:
      bytesToBase64(
        new Uint8Array(encrypted),
      ),
  }
}

async function decryptText(
  ciphertext: string,
  ivBase64: string,
  key: CryptoKey,
  aad: string,
): Promise<string> {
  const iv =
    base64ToBytes(ivBase64)

  const encrypted =
    base64ToBytes(ciphertext)

  const decrypted =
    await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: toArrayBuffer(iv),
        additionalData:
          toArrayBuffer(
            textEncoder.encode(aad),
          ),
      },
      key,
      toArrayBuffer(encrypted),
    )

  return textDecoder.decode(
    decrypted,
  )
}

function recordAad(
  id: string,
): string {
  return `MoneySaathiVault:v1:record:${id}`
}

export async function createVaultSecurity(
  passphrase: string,
): Promise<{
  config: VaultConfig
  key: CryptoKey
}> {
  if (
    passphrase.length <
    VAULT_MIN_PASSPHRASE_LENGTH
  ) {
    throw new Error(
      `Vault passphrase must contain at least ${VAULT_MIN_PASSPHRASE_LENGTH} characters.`,
    )
  }

  const salt =
    crypto.getRandomValues(
      new Uint8Array(SALT_BYTES),
    )

  const key =
    await deriveVaultKey(
      passphrase,
      salt,
    )

  const verifier =
    await encryptText(
      KEY_CHECK_PLAINTEXT,
      key,
      KEY_CHECK_AAD,
    )

  return {
    config: {
      version: VAULT_VERSION,
      salt: bytesToBase64(salt),
      verifierIv: verifier.iv,
      verifierCiphertext:
        verifier.ciphertext,
      createdAt: Date.now(),
    },
    key,
  }
}

export async function unlockVaultKey(
  passphrase: string,
  config: VaultConfig,
): Promise<CryptoKey> {
  if (
    config.version !== VAULT_VERSION
  ) {
    throw new Error(
      'This Money Vault version is not supported.',
    )
  }

  const key =
    await deriveVaultKey(
      passphrase,
      base64ToBytes(config.salt),
    )

  const verifier =
    await decryptText(
      config.verifierCiphertext,
      config.verifierIv,
      key,
      KEY_CHECK_AAD,
    )

  if (
    verifier !==
    KEY_CHECK_PLAINTEXT
  ) {
    throw new Error(
      'The Vault passphrase is incorrect.',
    )
  }

  return key
}

export async function encryptVaultEntry(
  entry: VaultEntry,
  key: CryptoKey,
): Promise<EncryptedVaultRecord> {
  if (!isValidVaultEntry(entry)) {
    throw new Error(
      'Vault entry is not valid.',
    )
  }

  const encrypted =
    await encryptText(
      JSON.stringify(entry),
      key,
      recordAad(entry.id),
    )

  return {
    id: entry.id,
    version: VAULT_VERSION,
    iv: encrypted.iv,
    ciphertext: encrypted.ciphertext,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  }
}

export async function decryptVaultRecord(
  record: EncryptedVaultRecord,
  key: CryptoKey,
): Promise<VaultEntry> {
  if (
    record.version !==
    VAULT_VERSION
  ) {
    throw new Error(
      'This Vault record version is not supported.',
    )
  }

  const plaintext =
    await decryptText(
      record.ciphertext,
      record.iv,
      key,
      recordAad(record.id),
    )

  const parsed: unknown =
    JSON.parse(plaintext)

  if (!isValidVaultEntry(parsed)) {
    throw new Error(
      'A Vault record is damaged or invalid.',
    )
  }

  if (parsed.id !== record.id) {
    throw new Error(
      'A Vault record identifier does not match its encrypted envelope.',
    )
  }

  return parsed
}