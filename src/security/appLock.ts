const LOCK_CONFIG_KEY = 'money-saathi:app-lock:v1'
const SESSION_UNLOCKED_KEY = 'money-saathi:app-lock:unlocked'
const SECURITY_EVENT = 'money-saathi-security-change'

const PBKDF2_ITERATIONS = 600_000
const SALT_BYTES = 16
const VERIFIER_BYTES = 32

interface StoredLockConfig {
  version: 1
  iterations: number
  salt: string
  verifier: string
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

function readConfig(): StoredLockConfig | null {
  const raw = localStorage.getItem(LOCK_CONFIG_KEY)

  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Partial<StoredLockConfig>

    if (
      parsed.version !== 1 ||
      parsed.iterations !== PBKDF2_ITERATIONS ||
      typeof parsed.salt !== 'string' ||
      typeof parsed.verifier !== 'string'
    ) {
      return null
    }

    return parsed as StoredLockConfig
  } catch {
    return null
  }
}

async function deriveVerifier(
  pin: string,
  salt: Uint8Array,
  iterations: number,
): Promise<Uint8Array> {
  const pinBytes = new TextEncoder().encode(pin)

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    pinBytes,
    'PBKDF2',
    false,
    ['deriveBits'],
  )

  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: toArrayBuffer(salt),
      iterations,
    },
    keyMaterial,
    VERIFIER_BYTES * 8,
  )

  return new Uint8Array(bits)
}

function equalBytes(
  left: Uint8Array,
  right: Uint8Array,
): boolean {
  if (left.length !== right.length) return false

  let difference = 0

  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index] ^ right[index]
  }

  return difference === 0
}

function notifySecurityChange(): void {
  window.dispatchEvent(new Event(SECURITY_EVENT))
}

export function isValidAppPin(pin: string): boolean {
  return /^\d{6}$/.test(pin)
}

export function isAppLockEnabled(): boolean {
  return readConfig() !== null
}

export function isSessionUnlocked(): boolean {
  return sessionStorage.getItem(SESSION_UNLOCKED_KEY) === '1'
}

export function getSecurityEventName(): string {
  return SECURITY_EVENT
}

export async function enableAppLock(
  pin: string,
): Promise<void> {
  if (!isValidAppPin(pin)) {
    throw new Error('PIN must contain exactly six digits.')
  }

  const salt = crypto.getRandomValues(
    new Uint8Array(SALT_BYTES),
  )

  const verifier = await deriveVerifier(
    pin,
    salt,
    PBKDF2_ITERATIONS,
  )

  const config: StoredLockConfig = {
    version: 1,
    iterations: PBKDF2_ITERATIONS,
    salt: bytesToBase64(salt),
    verifier: bytesToBase64(verifier),
  }

  localStorage.setItem(
    LOCK_CONFIG_KEY,
    JSON.stringify(config),
  )

  sessionStorage.setItem(
    SESSION_UNLOCKED_KEY,
    '1',
  )

  notifySecurityChange()
}

export async function verifyAppPin(
  pin: string,
): Promise<boolean> {
  if (!isValidAppPin(pin)) return false

  const config = readConfig()

  if (!config) return false

  const derived = await deriveVerifier(
    pin,
    base64ToBytes(config.salt),
    config.iterations,
  )

  return equalBytes(
    derived,
    base64ToBytes(config.verifier),
  )
}

export async function changeAppPin(
  currentPin: string,
  newPin: string,
): Promise<boolean> {
  if (!isValidAppPin(newPin)) return false

  const currentIsValid = await verifyAppPin(currentPin)

  if (!currentIsValid) return false

  await enableAppLock(newPin)
  return true
}

export async function disableAppLock(
  currentPin: string,
): Promise<boolean> {
  const currentIsValid = await verifyAppPin(currentPin)

  if (!currentIsValid) return false

  localStorage.removeItem(LOCK_CONFIG_KEY)
  sessionStorage.removeItem(SESSION_UNLOCKED_KEY)

  notifySecurityChange()
  return true
}

export function unlockSession(): void {
  sessionStorage.setItem(
    SESSION_UNLOCKED_KEY,
    '1',
  )

  notifySecurityChange()
}

export function lockSession(): void {
  sessionStorage.removeItem(SESSION_UNLOCKED_KEY)
  notifySecurityChange()
}

