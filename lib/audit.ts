import { readStore, writeStore, type StoreName } from './db'

export type AuditEventType = 'transaction' | 'access' | 'backup' | 'settings'
export type AuditAction = 'create' | 'update' | 'delete' | 'export' | 'restore' | 'unlock' | 'lock' | 'logout' | 'change'

export type AuditEvent = {
  id: string
  eventType: AuditEventType
  action: AuditAction
  resourceType: string
  resourceId?: string
  occurredAt: string
  source: 'web' | 'offline'
  summary: string
  metadata?: Record<string, string | number | boolean | null>
}

const AUDIT_STORE: StoreName = 'audit'
const SECRET_KEYS = /pin|passcode|password|token|secret|credential|biometric|challenge|privatekey|accesskey/i

function sanitizeValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeValue)
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).filter(([key]) => !SECRET_KEYS.test(key)).map(([key, nested]) => [key, sanitizeValue(nested)]))
  if (typeof value === 'string' && SECRET_KEYS.test(value)) return '[redacted]'
  return value
}

export function sanitizeAuditMetadata(metadata: Record<string, unknown> | undefined) {
  return sanitizeValue(metadata || {}) as Record<string, string | number | boolean | null>
}

export function createAuditEvent(input: Omit<AuditEvent, 'id' | 'occurredAt' | 'source'> & { metadata?: Record<string, unknown> }): AuditEvent {
  return {
    ...input,
    id: crypto.randomUUID(),
    occurredAt: new Date().toISOString(),
    source: typeof navigator !== 'undefined' && navigator.onLine ? 'web' : 'offline',
    metadata: sanitizeAuditMetadata(input.metadata),
  }
}

export async function recordAuditEvent(input: Omit<AuditEvent, 'id' | 'occurredAt' | 'source'> & { metadata?: Record<string, unknown> }) {
  const event = createAuditEvent(input)
  await writeStore(AUDIT_STORE, event)
  return event
}

export async function listAuditEvents() {
  const events = await readStore<AuditEvent>(AUDIT_STORE)
  return events.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
}

export function auditEventsToJson(events: AuditEvent[]) {
  return JSON.stringify(events, null, 2)
}

export function auditEventsToCsv(events: AuditEvent[]) {
  const cell = (value: string) => /[",\n\r]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value
  const rows = [['Occurred at', 'Event type', 'Action', 'Resource', 'Summary', 'Source'], ...events.map(event => [event.occurredAt, event.eventType, event.action, event.resourceType, event.summary, event.source])]
  return `\ufeff${rows.map(row => row.map(cell).join(',')).join('\n')}`
}

export const AUDIT_STORE_NAME = AUDIT_STORE
