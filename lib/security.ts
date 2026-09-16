export type LockRecord = {
  key: 'lock'
  salt: string
  verifier: string
  iterations: number
  enabled: boolean
  autoLockMinutes: number
}

const encoder = new TextEncoder()
const decoder = new TextDecoder()

function bytesToBase64(bytes: Uint8Array) {
  let binary = ''
  bytes.forEach(byte => { binary += String.fromCharCode(byte) })
  return btoa(binary)
}

function base64ToBytes(value: string) {
  const binary = atob(value)
  return Uint8Array.from(binary, char => char.charCodeAt(0))
}

export async function deriveVerifier(password: string, salt: Uint8Array, iterations = 210_000) {
  const material = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, material, 256)
  return bytesToBase64(new Uint8Array(bits))
}

export async function createLockRecord(password: string, autoLockMinutes = 15): Promise<LockRecord> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  return { key: 'lock', salt: bytesToBase64(salt), verifier: await deriveVerifier(password, salt), iterations: 210_000, enabled: true, autoLockMinutes }
}

export async function verifyPassword(password: string, record: LockRecord) {
  return (await deriveVerifier(password, base64ToBytes(record.salt), record.iterations)) === record.verifier
}

export function lockRecordFromUnknown(value: unknown): LockRecord | null {
  if (!value || typeof value !== 'object') return null
  const item = value as Partial<LockRecord>
  if (item.key !== 'lock' || typeof item.salt !== 'string' || typeof item.verifier !== 'string' || typeof item.iterations !== 'number' || typeof item.enabled !== 'boolean' || typeof item.autoLockMinutes !== 'number') return null
  return item as LockRecord
}

export { decoder }
