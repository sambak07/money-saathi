import { deleteFromStore, readStore, writeStore } from './db'
import type { RecurringItem } from './planning'
export const recurringRepository = { list: () => readStore<RecurringItem>('recurring'), save: (item: RecurringItem) => writeStore('recurring', item), update: (item: RecurringItem) => writeStore('recurring', { ...item, updatedAt: new Date().toISOString() }), remove: (id: string) => deleteFromStore('recurring', id) }
export function updatedRecurring(item: RecurringItem, changes: Partial<Omit<RecurringItem, 'id' | 'createdAt'>>): RecurringItem { return { ...item, ...changes, isCommitment: changes.type === 'income' ? false : changes.isCommitment ?? item.isCommitment, updatedAt: new Date().toISOString() } }
