import { deleteFromStore, readStore, writeStore, type StoreName } from './db'

export type AuditEventType = 'transaction' | 'backup' | 'settings' | 'planning' | 'financial'
export type AuditAction = 'create' | 'update' | 'delete' | 'export' | 'restore' | 'change' | 'reset' | 'pause' | 'resume'
export type AuditMetadata = Record<string, string | number | boolean | null>
export type AuditEvent = { id: string; eventType: AuditEventType; action: AuditAction; resourceType: string; resourceId?: string; occurredAt: string; source: 'web' | 'offline'; summary: string; metadata: AuditMetadata }
export type AuditInput = Omit<AuditEvent, 'id' | 'occurredAt' | 'source' | 'metadata'> & { metadata?: Record<string, unknown> }

const AUDIT_STORE: StoreName = 'audit'
export const AUDIT_RETENTION_LIMIT = 1000
const ALLOWED_KEYS = new Set(['type', 'amountChetrum', 'categoryId', 'count', 'format'])
const SECRET_KEYS = /pin|passcode|password|token|secret|credential|biometric|challenge|private|accesskey|note|content|ciphertext/i

export function sanitizeAuditMetadata(metadata: Record<string, unknown> = {}): AuditMetadata {
  return Object.fromEntries(Object.entries(metadata).filter(([key, value]) => ALLOWED_KEYS.has(key) && !SECRET_KEYS.test(key) && (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null)).map(([key, value]) => [key, typeof value === 'string' && SECRET_KEYS.test(value) ? '[redacted]' : value])) as AuditMetadata
}

export function createAuditEvent(input: AuditInput, now = new Date(), online = typeof navigator !== 'undefined' ? navigator.onLine : true): AuditEvent {
  return { ...input, id: crypto.randomUUID(), occurredAt: now.toISOString(), source: online ? 'web' : 'offline', metadata: sanitizeAuditMetadata(input.metadata) }
}

export async function recordAuditEvent(input: AuditInput): Promise<AuditEvent> {
  const event = createAuditEvent(input)
  await writeStore(AUDIT_STORE, event)
  const events = await readStore<AuditEvent>(AUDIT_STORE)
  for (const stale of events.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)).slice(AUDIT_RETENTION_LIMIT)) await deleteFromStore(AUDIT_STORE, stale.id)
  return event
}

export async function listAuditEvents() { return (await readStore<AuditEvent>(AUDIT_STORE)).sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)).slice(0, AUDIT_RETENTION_LIMIT) }
export function auditEventsToJson(events: AuditEvent[]) { return JSON.stringify(events.slice(0, AUDIT_RETENTION_LIMIT), null, 2) }
export function auditEventsToCsv(events: AuditEvent[]) { const cell = (value: string) => /[",\n\r]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value; const rows = [['Occurred at', 'Event type', 'Action', 'Resource', 'Summary', 'Source'], ...events.slice(0, AUDIT_RETENTION_LIMIT).map(event => [event.occurredAt, event.eventType, event.action, event.resourceType, event.summary, event.source])]; return `\ufeff${rows.map(row => row.map(cell).join(',')).join('\n')}` }
export const AUDIT_STORE_NAME = AUDIT_STORE
