export type LockRecord = { key: 'lock'; salt: string; verifier: string; iterations: number; enabled: boolean; autoLockMinutes: number }
const encoder = new TextEncoder()
function bytesToBase64(bytes: Uint8Array) { let binary = ''; bytes.forEach(byte => { binary += String.fromCharCode(byte) }); return btoa(binary) }
function base64ToBytes(value: string) { const binary = atob(value); return Uint8Array.from(binary, char => char.charCodeAt(0)) }
export function validPin(pin: string) { return /^\d{4,8}$/.test(pin) }
export async function deriveVerifier(pin: string, salt: Uint8Array, iterations = 210_000) { const material = await crypto.subtle.importKey('raw', encoder.encode(pin), 'PBKDF2', false, ['deriveBits']); const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, material, 256); return bytesToBase64(new Uint8Array(bits)) }
export async function createLockRecord(pin: string, autoLockMinutes = 5): Promise<LockRecord> { if (!validPin(pin)) throw new Error('PIN must be 4 to 8 digits.'); const salt = crypto.getRandomValues(new Uint8Array(16)); return { key: 'lock', salt: bytesToBase64(salt), verifier: await deriveVerifier(pin, salt), iterations: 210_000, enabled: true, autoLockMinutes } }
export async function verifyPassword(pin: string, record: LockRecord) { if (!validPin(pin)) return false; return (await deriveVerifier(pin, base64ToBytes(record.salt), record.iterations)) === record.verifier }
export function lockRecordFromUnknown(value: unknown): LockRecord | null { if (!value || typeof value !== 'object') return null; const item = value as Partial<LockRecord>; if (item.key !== 'lock' || typeof item.salt !== 'string' || typeof item.verifier !== 'string' || typeof item.iterations !== 'number' || typeof item.enabled !== 'boolean' || typeof item.autoLockMinutes !== 'number') return null; return item as LockRecord }
export function publicLockStatus(record: LockRecord | null) { return record?.enabled === true }
function equal(a: string, b: string) { return a.length === b.length && [...a].every((char, index) => char === b[index]) }
export { equal }

export function autoLockElapsed(lastActivityAt: number, now: number, timeoutMinutes: number) { return timeoutMinutes > 0 && now - lastActivityAt >= timeoutMinutes * 60_000 }
export function backgroundLockDecision(hiddenAt: number, visibleAt: number, timeoutMinutes: number) { return autoLockElapsed(hiddenAt, visibleAt, timeoutMinutes) }
