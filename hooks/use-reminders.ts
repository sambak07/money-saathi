'use client'

import { useEffect, useMemo, useState } from 'react'
import { readStore, writeStore } from '@/lib/db'
import { monthKey, monthlyCategorySpending, type Budget, type RecurringItem } from '@/lib/planning'
import { buildReminders, defaultReminderSettings, type Reminder, type ReminderSettings, reminderKey } from '@/lib/reminders'
import type { Transaction } from '@/lib/transactions'

export function useReminders(transactions: Transaction[], budgets: Budget[], recurring: RecurringItem[]) {
  const [settings, setSettings] = useState<ReminderSettings>(defaultReminderSettings)
  const [dismissed, setDismissed] = useState<string[]>([])
  const month = monthKey()
  const reminders = useMemo(() => buildReminders(budgets, recurring, monthlyCategorySpending(transactions, month), month, settings), [budgets, recurring, transactions, month, settings])
  useEffect(() => { void Promise.all([readStore<ReminderSettings>('reminders'), readStore<{ id: string }>('reminderDismissals')]).then(([rows, dismissedRows]) => { if (rows[0]) setSettings({ ...rows[0], browserNotifications: false }); setDismissed(dismissedRows.map(item => item.id)) }) }, [])
  async function updateSettings(next: ReminderSettings) { await writeStore('reminders', next); setSettings(next) }
  async function dismiss(reminder: Reminder) { const next = [...new Set([...dismissed, reminderKey(reminder, month)])]; await Promise.all(next.map(id => writeStore('reminderDismissals', { id }))); setDismissed(next) }
  return { settings, reminders: settings.enabled ? reminders.filter(item => !dismissed.includes(reminderKey(item, month))) : [], updateSettings, dismiss }
}
