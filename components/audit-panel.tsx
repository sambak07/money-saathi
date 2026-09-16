'use client'

import { RotateCcw } from 'lucide-react'
import type { AuditEvent } from '@/lib/audit'

export function AuditPanel({ events, onExport }: { events: AuditEvent[]; onExport: (kind: 'json' | 'csv') => void }) {
  return <section className="panel audit-panel"><div className="section-heading"><div><p className="eyebrow">Local activity history</p><h2>Activity history</h2><p className="muted">Important Money Saathi actions are recorded locally on this device.</p></div><div className="button-row"><button className="secondary-button" type="button" onClick={() => onExport('csv')}>Export CSV</button><button className="secondary-button" type="button" onClick={() => onExport('json')}>Export JSON</button></div></div>{events.length === 0 ? <div className="empty-state"><RotateCcw size={20} /><p>No activity recorded yet.</p></div> : <div className="audit-list">{events.map(event => <article className="audit-row" key={event.id}><div><strong>{event.summary}</strong><p className="muted">{event.eventType} · {event.action} · {event.source}</p></div><time dateTime={event.occurredAt}>{new Date(event.occurredAt).toLocaleString('en-IN')}</time></article>)}</div>}</section>
}

