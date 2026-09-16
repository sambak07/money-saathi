'use client'

import type { Reminder } from '@/lib/reminders'

export function ReminderPanel({ reminders, onDismiss, onGo }: { reminders: Reminder[]; onDismiss: (reminder: Reminder) => void; onGo: (page: 'Budget') => void }) {
  if (!reminders.length) return null
  return <section className="panel reminder-panel"><div className="panel-heading"><div><p className="eyebrow">Today</p><h2>Small money reminders</h2></div></div><div className="reminder-list">{reminders.map(reminder => <article key={`${reminder.kind}-${reminder.id}`} className={`reminder-item ${reminder.severity}`}><div><strong>{reminder.title}</strong><p>{reminder.body}</p></div><div className="reminder-actions"><button className="text-button" onClick={() => onGo(reminder.action)}>Review</button><button className="text-button" onClick={() => void onDismiss(reminder)}>Dismiss</button></div></article>)}</div></section>
}
