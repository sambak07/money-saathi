import { deleteFromStore, readStore, writeStore } from './db'
import type { RecurringItem } from './planning'
export const recurringRepository = { list: () => readStore<RecurringItem>('recurring'), save: (item: RecurringItem) => writeStore('recurring', item), update: (item: RecurringItem) => writeStore('recurring', { ...item, updatedAt: new Date().toISOString() }), remove: (id: string) => deleteFromStore('recurring', id) }
