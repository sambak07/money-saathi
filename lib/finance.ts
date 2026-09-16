import type { Transaction } from './transactions'
export type { Transaction } from './transactions'

export const SCHEMA_VERSION = 1
export const PAYMENT_METHODS = ['Cash', 'Bank Account', 'Mobile Payment', 'Card', 'Other'] as const
export type PaymentMethod = typeof PAYMENT_METHODS[number]

export const incomeCategories = [
  { id: 'salary', label: 'Salary' },
  { id: 'rental', label: 'Rental income' },
  { id: 'business', label: 'Business' },
  { id: 'other-income', label: 'Other income' },
]
export const expenseCategories = [
  { id: 'food', label: 'Food & groceries' },
  { id: 'housing', label: 'Housing / EMI' },
  { id: 'transport', label: 'Fuel & transport' },
  { id: 'utilities', label: 'Utilities' },
  { id: 'health', label: 'Health' },
  { id: 'other', label: 'Other expense' },
]
export const allCategories = [...incomeCategories, ...expenseCategories]

export function sortedTransactions(items: Transaction[]) {
  return [...items].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
}

export type TransactionFilters = { query?: string; type?: '' | 'income' | 'expense'; categoryId?: string; paymentMethod?: string; period?: '' | 'this-month' | 'last-month' | 'custom'; from?: string; to?: string }
export function filterTransactions(items: Transaction[], filters: TransactionFilters, now = new Date()) {
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonth = `${previous.getFullYear()}-${String(previous.getMonth() + 1).padStart(2, '0')}`
  const query = filters.query?.trim().toLowerCase() || ''
  return sortedTransactions(items).filter(item => {
    const category = allCategories.find(entry => entry.id === item.categoryId)?.label || item.categoryId
    if (query && !`${item.note} ${category}`.toLowerCase().includes(query)) return false
    if (filters.type && item.type !== filters.type) return false
    if (filters.categoryId && item.categoryId !== filters.categoryId) return false
    if (filters.paymentMethod && item.paymentMethod !== filters.paymentMethod) return false
    if (filters.period === 'this-month' && !item.date.startsWith(month)) return false
    if (filters.period === 'last-month' && !item.date.startsWith(lastMonth)) return false
    if (filters.period === 'custom' && ((filters.from && item.date < filters.from) || (filters.to && item.date > filters.to))) return false
    return true
  })
}

function csvCell(value: string) { return /[",\n\r]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value }
export function transactionsToCsv(items: Transaction[]) {
  const rows = [['Date', 'Type', 'Category', 'Amount', 'Payment Method', 'Note'], ...sortedTransactions(items).map(item => [item.date, item.type, allCategories.find(entry => entry.id === item.categoryId)?.label || item.categoryId, (item.amountChetrum / 100).toFixed(2), item.paymentMethod, item.note])]
  return `\ufeff${rows.map(row => row.map(cell => csvCell(String(cell))).join(',')).join('\n')}`
}

export type Backup = { schemaVersion: number; exportedAt: string; transactions: Transaction[]; settings: unknown[]; categories: unknown[]; budgets: unknown[]; recurring: unknown[] }
export function serializeBackup(data: Omit<Backup, 'schemaVersion' | 'exportedAt'>): string { return JSON.stringify({ schemaVersion: SCHEMA_VERSION, exportedAt: new Date().toISOString(), ...data }, null, 2) }
function validDate(value: unknown) { return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) }
export function validateBackup(input: unknown): Backup {
  if (!input || typeof input !== 'object') throw new Error('Backup must be a JSON object.')
  const value = input as Partial<Backup>
  if (value.schemaVersion !== SCHEMA_VERSION) throw new Error('Unsupported backup version.')
  if (!Array.isArray(value.transactions) || !Array.isArray(value.settings) || !Array.isArray(value.categories) || !Array.isArray(value.budgets) || !Array.isArray(value.recurring)) throw new Error('Backup is missing required data.')
  const ids = new Set<string>()
  for (const item of value.transactions) {
    if (!item || typeof item !== 'object') throw new Error('Invalid transaction.')
    const transaction = item as Transaction
    if (!transaction.id || ids.has(transaction.id) || !['income', 'expense'].includes(transaction.type) || !Number.isInteger(transaction.amountChetrum) || transaction.amountChetrum <= 0 || !validDate(transaction.date) || typeof transaction.createdAt !== 'string' || typeof transaction.updatedAt !== 'string') throw new Error('Invalid transaction data.')
    ids.add(transaction.id)
  }
  return value as Backup
}

export function downloadFile(filename: string, content: string, type: string) { const blob = new Blob([content], { type }); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url) }
export function readFile(file: File) { return file.text() }

export function updatedTransaction(item: Transaction, input: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Transaction { return { ...item, ...input, updatedAt: new Date().toISOString() } }

export function categoryLabel(id: string) { return allCategories.find(category => category.id === id)?.label || id }
export function categoriesFor(type: Transaction['type']) { return type === 'income' ? incomeCategories : expenseCategories }
