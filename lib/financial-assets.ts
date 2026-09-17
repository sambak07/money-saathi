import { deleteFromStore, readStore, writeStore } from './db'

// My Money records describe a user-maintained financial POSITION. They are not
// transactions and must never change currentBalance, income, expenses, or budgets.
export type FinancialAssetType = 'savings-account' | 'fixed-deposit' | 'recurring-deposit'

type SharedFields = { id: string; type: FinancialAssetType; name: string; institution?: string; currentValueChetrum: number; createdAt: string; updatedAt: string }
export type SavingsAccountAsset = SharedFields & { type: 'savings-account' }
export type FixedDepositAsset = SharedFields & { type: 'fixed-deposit'; principalChetrum: number; interestRateBps?: number; startDate?: string; maturityDate?: string }
export type RecurringDepositAsset = SharedFields & { type: 'recurring-deposit'; monthlyContributionChetrum: number; totalContributedChetrum: number; startDate?: string; maturityDate?: string }
export type FinancialAsset = SavingsAccountAsset | FixedDepositAsset | RecurringDepositAsset

export type FinancialAssetInput =
  | Omit<SavingsAccountAsset, 'id' | 'createdAt' | 'updatedAt'>
  | Omit<FixedDepositAsset, 'id' | 'createdAt' | 'updatedAt'>
  | Omit<RecurringDepositAsset, 'id' | 'createdAt' | 'updatedAt'>

export const FINANCIAL_ASSET_TYPES: FinancialAssetType[] = ['savings-account', 'fixed-deposit', 'recurring-deposit']
export const financialAssetTypeLabels: Record<FinancialAssetType, string> = { 'savings-account': 'Savings account', 'fixed-deposit': 'Fixed deposit', 'recurring-deposit': 'Recurring deposit' }

// Matches the RFC 4122 v4 format produced by crypto.randomUUID(): 8-4-4-4-12 hex
// digits, version nibble 4, and an 8/9/a/b variant nibble.
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
export function validAssetId(value: unknown): value is string { return typeof value === 'string' && UUID_PATTERN.test(value) }

export function validChetrum(value: unknown): value is number { return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 }
// 0% to 100%, represented as 0 to 10,000 basis points.
export function validInterestRateBps(value: unknown) { return value === undefined || (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 10_000) }
export function validOptionalDate(value: unknown) { if (value === undefined) return true; if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false; const [year, month, day] = value.split('-').map(Number); const date = new Date(Date.UTC(year, month - 1, day)); return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day }
export function validIsoTimestamp(value: unknown) { return typeof value === 'string' && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString() === value }

function isRecord(value: unknown): value is Record<string, unknown> { return !!value && typeof value === 'object' && !Array.isArray(value) }

export function validateFinancialAssetRecord(input: unknown): input is FinancialAsset {
  if (!isRecord(input)) return false
  const value = input as Record<string, unknown>
  if (!validAssetId(value.id)) return false
  if (typeof value.name !== 'string' || !value.name.trim()) return false
  if (value.institution !== undefined && typeof value.institution !== 'string') return false
  if (!validChetrum(value.currentValueChetrum)) return false
  if (!validIsoTimestamp(value.createdAt) || !validIsoTimestamp(value.updatedAt)) return false
  if (value.type === 'savings-account') {
    return Object.keys(value).every(key => ['id', 'type', 'name', 'institution', 'currentValueChetrum', 'createdAt', 'updatedAt'].includes(key))
  }
  if (value.type === 'fixed-deposit') {
    if (!validChetrum(value.principalChetrum) || !validInterestRateBps(value.interestRateBps) || !validOptionalDate(value.startDate) || !validOptionalDate(value.maturityDate)) return false
    return Object.keys(value).every(key => ['id', 'type', 'name', 'institution', 'currentValueChetrum', 'principalChetrum', 'interestRateBps', 'startDate', 'maturityDate', 'createdAt', 'updatedAt'].includes(key))
  }
  if (value.type === 'recurring-deposit') {
    if (!validChetrum(value.monthlyContributionChetrum) || !validChetrum(value.totalContributedChetrum) || !validOptionalDate(value.startDate) || !validOptionalDate(value.maturityDate)) return false
    return Object.keys(value).every(key => ['id', 'type', 'name', 'institution', 'currentValueChetrum', 'monthlyContributionChetrum', 'totalContributedChetrum', 'startDate', 'maturityDate', 'createdAt', 'updatedAt'].includes(key))
  }
  return false
}

function pruneOptional<T extends Record<string, unknown>>(asset: T): T {
  const next = { ...asset }
  for (const key of ['institution', 'interestRateBps', 'startDate', 'maturityDate'] as const) {
    if ((next as Record<string, unknown>)[key] === undefined || (next as Record<string, unknown>)[key] === '') delete (next as Record<string, unknown>)[key]
  }
  return next
}

function normalizeInput(input: FinancialAssetInput): FinancialAssetInput {
  const base = { ...input, name: input.name.trim(), institution: input.institution?.trim() || undefined }
  return base as FinancialAssetInput
}

export function createFinancialAsset(input: FinancialAssetInput): FinancialAsset {
  const now = new Date().toISOString()
  return pruneOptional({ ...normalizeInput(input), id: crypto.randomUUID(), createdAt: now, updatedAt: now }) as FinancialAsset
}

export function updateFinancialAsset(asset: FinancialAsset, input: FinancialAssetInput): FinancialAsset {
  return pruneOptional({ ...normalizeInput(input), id: asset.id, createdAt: asset.createdAt, updatedAt: new Date().toISOString() }) as FinancialAsset
}

const typeOrder: Record<FinancialAssetType, number> = { 'savings-account': 0, 'fixed-deposit': 1, 'recurring-deposit': 2 }
export function sortFinancialAssets(assets: FinancialAsset[]) { return [...assets].sort((a, b) => typeOrder[a.type] - typeOrder[b.type] || a.name.localeCompare(b.name) || a.createdAt.localeCompare(b.createdAt)) }

export function totalByType(assets: FinancialAsset[], type: FinancialAssetType) { return assets.filter(asset => asset.type === type).reduce((sum, asset) => sum + asset.currentValueChetrum, 0) }
export function financialTotals(assets: FinancialAsset[]) {
  const savings = totalByType(assets, 'savings-account')
  const fixedDeposits = totalByType(assets, 'fixed-deposit')
  const recurringDeposits = totalByType(assets, 'recurring-deposit')
  return { savings, fixedDeposits, recurringDeposits, total: savings + fixedDeposits + recurringDeposits }
}

// Domain guard: even if a future caller bypasses the UI, an invalid record
// must never reach IndexedDB. This throws instead of writing.
function assertValidFinancialAsset(asset: FinancialAsset) {
  if (!validateFinancialAssetRecord(asset)) throw new Error('Invalid financial asset record; refusing to save.')
}

export const financialAssetsRepository = {
  list: () => readStore<FinancialAsset>('financialAssets'),
  save: async (asset: FinancialAsset) => { assertValidFinancialAsset(asset); return writeStore('financialAssets', asset) },
  update: async (asset: FinancialAsset) => { assertValidFinancialAsset(asset); return writeStore('financialAssets', asset) },
  remove: (id: string) => deleteFromStore('financialAssets', id),
}

export function formatAssetUpdated(value: string) { return `Updated ${new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(new Date(value))}` }
export function formatAssetDate(value?: string) { if (!value) return ''; const [year, month, day] = value.split('-'); return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(Number(year), Number(month) - 1, Number(day))) }
export function interestRatePercent(bps?: number) { return bps === undefined ? '' : `${(bps / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}%` }
