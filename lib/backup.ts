import { validateBackup, type Backup } from './finance'

export const MAX_BACKUP_BYTES = 10 * 1024 * 1024
export const BACKUP_AAD = 'MoneySaathiBackup:v1'
export const PBKDF2_ITERATIONS = 600_000

type EncryptedBackup = { format: 'money-saathi-encrypted-backup'; version: 1; kdf: 'PBKDF2-SHA-256'; iterations: number; salt: string; iv: string; ciphertext: string }
const encoder = new TextEncoder()
const decoder = new TextDecoder()
const bytesToBase64 = (bytes: Uint8Array) => { let binary = ''; for (const byte of bytes) binary += String.fromCharCode(byte); return btoa(binary) }
const base64ToBytes = (value: string) => {
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(value) || value.length % 4 !== 0) throw new Error('invalid base64')
  const binary = atob(value)
  return Uint8Array.from(binary, char => char.charCodeAt(0))
}
export const isBackupWithinSizeLimit = (size: number) => Number.isSafeInteger(size) && size >= 0 && size <= MAX_BACKUP_BYTES
async function deriveKey(password: string, salt: Uint8Array) { const material = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']); return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']) }
export async function encryptBackup(plaintext: string, password: string): Promise<string> { if (!password) throw new Error('Enter a backup password.'); const salt = crypto.getRandomValues(new Uint8Array(16)); const iv = crypto.getRandomValues(new Uint8Array(12)); const key = await deriveKey(password, salt); const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: encoder.encode(BACKUP_AAD) }, key, encoder.encode(plaintext)); const payload: EncryptedBackup = { format: 'money-saathi-encrypted-backup', version: 1, kdf: 'PBKDF2-SHA-256', iterations: PBKDF2_ITERATIONS, salt: bytesToBase64(salt), iv: bytesToBase64(iv), ciphertext: bytesToBase64(new Uint8Array(ciphertext)) }; return JSON.stringify(payload, null, 2) }
export async function decryptBackup(serialized: string, password: string): Promise<Backup> { try { const payload = JSON.parse(serialized) as Partial<EncryptedBackup>; if (payload.format !== 'money-saathi-encrypted-backup' || payload.version !== 1 || payload.kdf !== 'PBKDF2-SHA-256' || payload.iterations !== PBKDF2_ITERATIONS || typeof payload.salt !== 'string' || typeof payload.iv !== 'string' || typeof payload.ciphertext !== 'string') throw new Error('invalid'); const key = await deriveKey(password, base64ToBytes(payload.salt)); const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: base64ToBytes(payload.iv), additionalData: encoder.encode(BACKUP_AAD) }, key, base64ToBytes(payload.ciphertext)); return validateBackup(JSON.parse(decoder.decode(plaintext))) } catch { throw new Error('Could not decrypt this backup. Check the password or file.') } }
export const backupJson = (data: Backup) => JSON.stringify(data, null, 2)
export const isEncryptedBackup = (serialized: string) => { try { return (JSON.parse(serialized) as Partial<EncryptedBackup>).format === 'money-saathi-encrypted-backup' } catch { return false } }
export const passwordMatches = (first: string, second: string) => first.length > 0 && first === second
