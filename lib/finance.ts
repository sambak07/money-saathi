import type { Transaction } from './transactions'
import { validateGoalRecord, type Goal } from './goals'
import { validateFinancialAssetRecord, type FinancialAsset } from './financial-assets'
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

// Standard CSV field quoting: wrap in double quotes and double any embedded quote.
function csvQuote(value: string) { return /[",\n\r]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value }
// Spreadsheet formula-injection guard. Excel/Sheets/LibreOffice execute a cell
// whose text begins with =, +, -, or @ — including after leading whitespace or
// control characters, or when the cell opens with a tab/carriage return. Exported
// user text is untrusted, so such cells are prefixed with a single quote (the
// OWASP-recommended neutralization) which importers treat as a literal-text marker.
// The value stored in Money Saathi is never changed — this applies only to the
// exported string, and only to text columns so numeric amount/date columns are untouched.
export function neutralizeCsvFormula(value: string): string {
  if (value !== '' && (/^[=+\-@\t\r]/.test(value) || /^[\s\u0000-\u001f]+[=+\-@]/.test(value))) return `'${value}`
  return value
}
function csvText(value: string) { return csvQuote(neutralizeCsvFormula(value)) }
export function transactionsToCsv(items: Transaction[]) {
  const header = ['Date', 'Type', 'Category', 'Amount', 'Payment Method', 'Note'].map(csvQuote).join(',')
  const lines = sortedTransactions(items).map(item => {
    const category = allCategories.find(entry => entry.id === item.categoryId)?.label || item.categoryId
    // Date and Amount are app-generated structured values (never formula-prefixed),
    // so they are only quoted. Type/Category/Payment Method/Note are neutralized.
    return [csvQuote(item.date), csvText(item.type), csvText(category), csvQuote((item.amountChetrum / 100).toFixed(2)), csvText(item.paymentMethod), csvText(item.note)].join(',')
  })
  return `\ufeff${[header, ...lines].join('\n')}`
}

export type Backup = { schemaVersion: number; exportedAt: string; transactions: Transaction[]; settings: unknown[]; categories: unknown[]; budgets: unknown[]; recurring: unknown[]; goals?: Goal[]; financialAssets?: FinancialAsset[] }
export function serializeBackup(data: Omit<Backup, 'schemaVersion' | 'exportedAt'> & { goals?: Goal[]; financialAssets?: FinancialAsset[] }): string { return JSON.stringify({ schemaVersion: SCHEMA_VERSION, exportedAt: new Date().toISOString(), ...data }, null, 2) }
function validDate(value: unknown) { if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false; const [year, month, day] = value.split('-').map(Number); const date = new Date(Date.UTC(year, month - 1, day)); return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day }
function validIso(value: unknown) { return typeof value === 'string' && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString() === value }
function isRecord(value: unknown): value is Record<string, unknown> { return !!value && typeof value === 'object' && !Array.isArray(value) }
export function validateBackup(input: unknown): Backup {
  if (!isRecord(input)) throw new Error('Backup must be a JSON object.')
  if (input.schemaVersion !== SCHEMA_VERSION || typeof input.exportedAt !== 'string' || !validIso(input.exportedAt)) throw new Error('Unsupported or malformed backup version.')
  const keySet = new Set(Object.keys(input)); for (const optional of ['goals', 'financialAssets']) keySet.delete(optional); const keys = [...keySet].sort().join(','); if (keys !== 'budgets,categories,exportedAt,recurring,schemaVersion,settings,transactions') throw new Error('Backup contains unknown fields.')
  const arrays = ['transactions', 'settings', 'categories', 'budgets', 'recurring'] as const
  for (const key of arrays) if (!Array.isArray(input[key])) throw new Error('Backup is missing required data.')
  const transactions = input.transactions as unknown[]
  const settingsList = input.settings as unknown[]
  const ids = new Set<string>()
  for (const item of transactions) {
    if (!isRecord(item) || Object.keys(item).sort().join(',') !== 'amountChetrum,categoryId,createdAt,date,id,isRecurring,note,paymentMethod,type,updatedAt') throw new Error('Invalid transaction data.')
    const transaction = item as unknown as Transaction
    if (typeof transaction.id !== 'string' || !transaction.id || ids.has(transaction.id) || !['income', 'expense'].includes(transaction.type) || !Number.isSafeInteger(transaction.amountChetrum) || transaction.amountChetrum <= 0 || typeof transaction.categoryId !== 'string' || !allCategories.some(category => category.id === transaction.categoryId) || !validDate(transaction.date) || !PAYMENT_METHODS.includes(transaction.paymentMethod as PaymentMethod) || typeof transaction.note !== 'string' || typeof transaction.isRecurring !== 'boolean' || !validIso(transaction.createdAt) || !validIso(transaction.updatedAt)) throw new Error('Invalid transaction data.')
    ids.add(transaction.id)
  }
  if (settingsList.length !== 1 || !isRecord(settingsList[0])) throw new Error('Invalid settings data.')
  const settings = settingsList[0] as Record<string, unknown>; const settingKeys = Object.keys(settings).sort().join(','); const allowedSettings = ['currency,key,openingBalanceChetrum,sampleData', 'currency,key,openingBalanceChetrum,sampleData,onboardingComplete', 'currency,key,openingBalanceChetrum,sampleData,displayName', 'currency,key,openingBalanceChetrum,sampleData,displayName,onboardingComplete']; if (!allowedSettings.includes(settingKeys) || settings.key !== 'app' || settings.currency !== 'BTN' || !Number.isSafeInteger(settings.openingBalanceChetrum) || (settings.openingBalanceChetrum as number) < 0 || typeof settings.sampleData !== 'boolean' || (settings.displayName !== undefined && (typeof settings.displayName !== 'string' || settings.displayName.length > 50)) || (settings.onboardingComplete !== undefined && typeof settings.onboardingComplete !== 'boolean')) throw new Error('Invalid settings data.')
  for (const item of input.categories as unknown[]) if (!isRecord(item)) throw new Error('Invalid categories data.')
  const budgetIds = new Set<string>(); const budgetKeys = new Set<string>(); for (const item of input.budgets as unknown[]) { const limit = isRecord(item) ? item.limitChetrum : undefined; const key = isRecord(item) && typeof item.month === 'string' && typeof item.categoryId === 'string' ? `${item.month}:${item.categoryId}` : ''; if (!isRecord(item) || typeof item.id !== 'string' || budgetIds.has(item.id) || typeof item.month !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(item.month) || typeof item.categoryId !== 'string' || !expenseCategories.some(category => category.id === item.categoryId) || typeof limit !== 'number' || !Number.isSafeInteger(limit) || limit <= 0 || budgetKeys.has(key) || !validIso(item.createdAt) || !validIso(item.updatedAt)) throw new Error('Invalid budgets data.'); budgetKeys.add(key); budgetIds.add(item.id) }
  const goalItems = Array.isArray(input.goals) ? input.goals as unknown[] : []; const goalIds = new Set<string>(); for (const item of goalItems) { if (!validateGoalRecord(item) || goalIds.has(item.id)) throw new Error('Invalid goals data.'); goalIds.add(item.id) }
  const assetItems = Array.isArray(input.financialAssets) ? input.financialAssets as unknown[] : []; const assetIds = new Set<string>(); for (const item of assetItems) { if (!validateFinancialAssetRecord(item) || assetIds.has(item.id)) throw new Error('Invalid financial assets data.'); assetIds.add(item.id) }
  const recurringIds = new Set<string>(); for (const item of input.recurring as unknown[]) { const amount = isRecord(item) ? item.amountChetrum : undefined; const day = isRecord(item) ? item.dayOfMonth : undefined; const type = isRecord(item) ? item.type : undefined; const categories = type === 'income' ? incomeCategories : expenseCategories; if (!isRecord(item) || typeof item.id !== 'string' || recurringIds.has(item.id) || typeof item.name !== 'string' || !['income', 'expense'].includes(type as string) || typeof amount !== 'number' || !Number.isSafeInteger(amount) || amount <= 0 || typeof item.categoryId !== 'string' || !categories.some(category => category.id === item.categoryId) || !PAYMENT_METHODS.includes(item.paymentMethod as PaymentMethod) || item.frequency !== 'monthly' || typeof day !== 'number' || !Number.isInteger(day) || day < 1 || day > 31 || !['essential', 'flexible'].includes(item.classification as string) || typeof item.isCommitment !== 'boolean' || (type === 'income' && item.isCommitment) || typeof item.active !== 'boolean' || !validIso(item.createdAt) || !validIso(item.updatedAt) || (item.lastConfirmedMonth !== undefined && (typeof item.lastConfirmedMonth !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(item.lastConfirmedMonth)))) throw new Error('Invalid recurring data.'); recurringIds.add(item.id) }
  return { ...input, goals: goalItems, financialAssets: assetItems } as unknown as Backup
}

export function downloadFile(filename: string, content: string, type: string) { const blob = new Blob([content], { type }); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url) }
export function readFile(file: File) { return file.text() }

export function updatedTransaction(item: Transaction, input: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Transaction { return { ...item, ...input, updatedAt: new Date().toISOString() } }

export function categoryLabel(id: string) { return allCategories.find(category => category.id === id)?.label || id }
export function categoriesFor(type: Transaction['type']) { return type === 'income' ? incomeCategories : expenseCategories }
