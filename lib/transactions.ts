import { deleteFromStore, readStore, writeStore } from './db'

export type Transaction = { id: string; type: 'income' | 'expense'; amountChetrum: number; categoryId: string; date: string; paymentMethod: string; note: string; isRecurring: boolean; createdAt: string; updatedAt: string }
export const transactionRepository = {
  list: () => readStore<Transaction>('transactions'),
  save: (transaction: Transaction) => writeStore('transactions', transaction),
  update: (transaction: Transaction) => writeStore('transactions', { ...transaction, updatedAt: new Date().toISOString() }),
  remove: (id: string) => deleteFromStore('transactions', id),
}
export function todayLocal() { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` }
export function createTransaction(input: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Transaction { const now = new Date().toISOString(); return { ...input, id: crypto.randomUUID(), createdAt: now, updatedAt: now } }
