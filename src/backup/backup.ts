import type {
  MoneySaathiDatabaseSnapshot,
} from '../storage/db'

export const BACKUP_FORMAT = 'MoneySaathiBackup'
export const BACKUP_VERSION = 1
export const BACKUP_AAD = 'MoneySaathiBackup:v1'
export const BACKUP_MAX_BYTES = 10 * 1024 * 1024

const PBKDF2_ITERATIONS = 600_000
const SALT_BYTES = 16
const IV_BYTES = 12

export interface MoneySaathiBackupPayload {
  format: typeof BACKUP_FORMAT
  version: typeof BACKUP_VERSION
  exportedAt: string
  data: MoneySaathiDatabaseSnapshot
}

export interface EncryptedBackupEnvelope {
  format: typeof BACKUP_FORMAT
  version: typeof BACKUP_VERSION
  encryption: {
    algorithm: 'AES-GCM-256'
    kdf: 'PBKDF2-SHA-256'
    iterations: number
    salt: string
    iv: string
    aad: typeof BACKUP_AAD
  }
  ciphertext: string
}

export interface BackupSummary {
  exportedAt: string
  totalRecords: number
  transactions: number
  budgets: number
  regularMoney: number
  goals: number
  goalContributions: number
  savingsAccounts: number
  fixedDeposits: number
  recurringDeposits: number
  loans: number
  financialSchemes: number
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(buffer).set(bytes)
  return buffer
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''

  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary)
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return bytes
}

async function deriveKey(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    'raw',
    toArrayBuffer(new TextEncoder().encode(password)),
    'PBKDF2',
    false,
    ['deriveKey'],
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: toArrayBuffer(salt),
      iterations,
    },
    material,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['encrypt', 'decrypt'],
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

function hasSnapshotArrays(
  value: unknown,
): value is MoneySaathiDatabaseSnapshot {
  if (!isRecord(value)) return false

  const keys = [
    'transactions',
    'budgets',
    'regularMoney',
    'goals',
    'goalContributions',
    'savingsAccounts',
    'fixedDeposits',
    'recurringDeposits',
    'loans',
    'financialSchemes',
  ]

  return keys.every((key) => Array.isArray(value[key]))
}

export function isValidBackupPayload(
  value: unknown,
): value is MoneySaathiBackupPayload {
  if (!isRecord(value)) return false

  return (
    value.format === BACKUP_FORMAT &&
    value.version === BACKUP_VERSION &&
    typeof value.exportedAt === 'string' &&
    hasSnapshotArrays(value.data)
  )
}

export function isValidEncryptedEnvelope(
  value: unknown,
): value is EncryptedBackupEnvelope {
  if (!isRecord(value)) return false
  if (!isRecord(value.encryption)) return false

  return (
    value.format === BACKUP_FORMAT &&
    value.version === BACKUP_VERSION &&
    value.encryption.algorithm === 'AES-GCM-256' &&
    value.encryption.kdf === 'PBKDF2-SHA-256' &&
    value.encryption.iterations === PBKDF2_ITERATIONS &&
    typeof value.encryption.salt === 'string' &&
    typeof value.encryption.iv === 'string' &&
    value.encryption.aad === BACKUP_AAD &&
    typeof value.ciphertext === 'string'
  )
}

export function buildBackupSummary(
  payload: MoneySaathiBackupPayload,
): BackupSummary {
  const data = payload.data

  const counts = {
    transactions: data.transactions.length,
    budgets: data.budgets.length,
    regularMoney: data.regularMoney.length,
    goals: data.goals.length,
    goalContributions: data.goalContributions.length,
    savingsAccounts: data.savingsAccounts.length,
    fixedDeposits: data.fixedDeposits.length,
    recurringDeposits: data.recurringDeposits.length,
    loans: data.loans.length,
    financialSchemes: data.financialSchemes.length,
  }

  return {
    exportedAt: payload.exportedAt,
    totalRecords: Object.values(counts).reduce(
      (sum, count) => sum + count,
      0,
    ),
    ...counts,
  }
}

export async function encryptBackupPayload(
  payload: MoneySaathiBackupPayload,
  password: string,
): Promise<EncryptedBackupEnvelope> {
  if (password.length < 8) {
    throw new Error(
      'Backup password must contain at least eight characters.',
    )
  }

  const salt = crypto.getRandomValues(
    new Uint8Array(SALT_BYTES),
  )

  const iv = crypto.getRandomValues(
    new Uint8Array(IV_BYTES),
  )

  const key = await deriveKey(
    password,
    salt,
    PBKDF2_ITERATIONS,
  )

  const plaintext = new TextEncoder().encode(
    JSON.stringify(payload),
  )

  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: toArrayBuffer(iv),
      additionalData: toArrayBuffer(
        new TextEncoder().encode(BACKUP_AAD),
      ),
    },
    key,
    toArrayBuffer(plaintext),
  )

  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    encryption: {
      algorithm: 'AES-GCM-256',
      kdf: 'PBKDF2-SHA-256',
      iterations: PBKDF2_ITERATIONS,
      salt: bytesToBase64(salt),
      iv: bytesToBase64(iv),
      aad: BACKUP_AAD,
    },
    ciphertext: bytesToBase64(
      new Uint8Array(encrypted),
    ),
  }
}

export async function decryptBackupEnvelope(
  envelope: EncryptedBackupEnvelope,
  password: string,
): Promise<MoneySaathiBackupPayload> {
  const salt = base64ToBytes(envelope.encryption.salt)
  const iv = base64ToBytes(envelope.encryption.iv)
  const ciphertext = base64ToBytes(envelope.ciphertext)

  const key = await deriveKey(
    password,
    salt,
    envelope.encryption.iterations,
  )

  const plaintext = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: toArrayBuffer(iv),
      additionalData: toArrayBuffer(
        new TextEncoder().encode(BACKUP_AAD),
      ),
    },
    key,
    toArrayBuffer(ciphertext),
  )

  const parsed: unknown = JSON.parse(
    new TextDecoder().decode(plaintext),
  )

  if (!isValidBackupPayload(parsed)) {
    throw new Error(
      'The decrypted file is not a valid Money Saathi backup.',
    )
  }

  return parsed
}

export function parseEncryptedBackupText(
  text: string,
): EncryptedBackupEnvelope {
  const parsed: unknown = JSON.parse(text)

  if (!isValidEncryptedEnvelope(parsed)) {
    throw new Error(
      'This is not a supported Money Saathi encrypted backup.',
    )
  }

  return parsed
}
