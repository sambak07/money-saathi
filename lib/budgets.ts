import { deleteFromStore, readStore, writeStore } from './db'
import type { Budget } from './planning'
export const budgetRepository = { list: () => readStore<Budget>('budgets'), save: (item: Budget) => writeStore('budgets', item), update: (item: Budget) => writeStore('budgets', { ...item, updatedAt: new Date().toISOString() }), remove: (id: string) => deleteFromStore('budgets', id) }
export const budgetId = (month: string, categoryId: string) => `${month}:${categoryId}`
