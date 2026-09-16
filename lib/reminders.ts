import type { Budget, RecurringItem } from './planning'

export type ReminderSettings = { key: 'reminders'; enabled: boolean; budgetThresholdPercent: number; recurringDaysAhead: number; browserNotifications: boolean }
export type Reminder = { id: string; kind: 'budget' | 'recurring'; title: string; body: string; severity: 'info' | 'warning'; action: 'Budget' }

export const defaultReminderSettings: ReminderSettings = { key: 'reminders', enabled: true, budgetThresholdPercent: 80, recurringDaysAhead: 3, browserNotifications: false }

export function reminderKey(reminder: Reminder, month: string) { return `${month}:${reminder.kind}:${reminder.id}` }

export function buildReminders(budgets: Budget[], recurring: RecurringItem[], spending: Record<string, number>, month: string, today = new Date()) {
  const reminders: Reminder[] = []
  for (const budget of budgets) {
    if (budget.month !== month) continue
    const percent = budget.limitChetrum ? (spending[budget.categoryId] || 0) / budget.limitChetrum * 100 : 0
    if (percent >= 100) reminders.push({ id: budget.id, kind: 'budget', title: 'Budget exceeded', body: `${budget.categoryId} is over its monthly limit.`, severity: 'warning', action: 'Budget' })
    else if (percent >= 80) reminders.push({ id: budget.id, kind: 'budget', title: 'Budget nearly reached', body: `${budget.categoryId} has used ${Math.round(percent)}% of its monthly limit.`, severity: 'warning', action: 'Budget' })
  }
  const current = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  for (const item of recurring.filter(entry => entry.active && entry.lastConfirmedMonth !== month)) {
    const due = new Date(today.getFullYear(), today.getMonth(), Math.min(item.dayOfMonth, new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()))
    const days = Math.ceil((due.getTime() - current.getTime()) / 86400000)
    if (days >= 0 && days <= 3) reminders.push({ id: item.id, kind: 'recurring', title: 'Recurring payment due', body: `${item.name} is due in ${days} day${days === 1 ? '' : 's'}.`, severity: 'info', action: 'Budget' })
  }
  return reminders
}
