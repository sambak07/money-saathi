'use client'

import { RotateCcw } from 'lucide-react'
import type { AuditEvent } from '@/lib/audit'

export function AuditPanel({ events, onExport }: { events: AuditEvent[]; onExport: (kind: 'json' | 'csv') => void }) {
  const formatWhen = (iso: string) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(iso))
  return <section className="panel audit-panel"><div className="section-heading"><div><p className="eyebrow">Local activity history</p><h2>Activity history</h2><p className="muted">Important Money Saathi actions are recorded locally on this device.</p></div><div className="button-row"><button className="secondary-button" type="button" onClick={() => onExport('csv')}>Export CSV</button><button className="secondary-button" type="button" onClick={() => onExport('json')}>Export JSON</button></div></div>{events.length === 0 ? <div className="empty-state"><RotateCcw size={20} /><p>No activity recorded yet.</p></div> : <div className="audit-list">{events.map(event => <article className="audit-row" key={event.id} title={`${event.eventType} · ${event.action} · ${event.source}`}><div><strong>{event.summary}</strong></div><time dateTime={event.occurredAt}>{formatWhen(event.occurredAt)}</time></article>)}</div>}</section>
}

