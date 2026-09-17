import { describe, expect, it } from 'vitest'
import { createFinancialAsset, financialTotals, sortFinancialAssets, totalByType, updateFinancialAsset, validateFinancialAssetRecord, validChetrum, validInterestRateBps, validOptionalDate, type FinancialAsset } from './financial-assets'
import { serializeBackup, validateBackup } from './finance'
import { currentBalance, monthlyExpenses, monthlyIncome, monthlySavings } from './analytics'
import { toChetrum } from './currency'
import type { Transaction } from './transactions'

const savings: FinancialAsset = { id: 's1', type: 'savings-account', name: 'Druk PNB Savings', institution: 'Druk PNB Bank', currentValueChetrum: 12540000, createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-01T00:00:00.000Z' }
const fd: FinancialAsset = { id: 'f1', type: 'fixed-deposit', name: '3-year FD', institution: 'Bank of Bhutan', currentValueChetrum: 10800000, principalChetrum: 10000000, interestRateBps: 750, startDate: '2025-03-12', maturityDate: '2028-03-12', createdAt: '2026-09-02T00:00:00.000Z', updatedAt: '2026-09-02T00:00:00.000Z' }
const rd: FinancialAsset = { id: 'r1', type: 'recurring-deposit', name: 'Monthly RD', institution: 'BNB', currentValueChetrum: 12240000, monthlyContributionChetrum: 1000000, totalContributedChetrum: 12000000, startDate: '2025-01-01', maturityDate: '2027-01-01', createdAt: '2026-09-03T00:00:00.000Z', updatedAt: '2026-09-03T00:00:00.000Z' }

describe('financial asset validation', () => {
  it('requires safe integer chetrum and rejects negatives and floats', () => { expect(validChetrum(0)).toBe(true); expect(validChetrum(12540000)).toBe(true); expect(validChetrum(-1)).toBe(false); expect(validChetrum(1.5)).toBe(false); expect(validChetrum(Number.MAX_SAFE_INTEGER + 2)).toBe(false) })
  it('accepts optional interest rate and valid calendar dates only', () => { expect(validInterestRateBps(undefined)).toBe(true); expect(validInterestRateBps(750)).toBe(true); expect(validInterestRateBps(-5)).toBe(false); expect(validOptionalDate(undefined)).toBe(true); expect(validOptionalDate('2028-03-12')).toBe(true); expect(validOptionalDate('2028-02-31')).toBe(false); expect(validOptionalDate('bad')).toBe(false) })
  it('validates each asset type and rejects malformed records', () => { expect(validateFinancialAssetRecord(savings)).toBe(true); expect(validateFinancialAssetRecord(fd)).toBe(true); expect(validateFinancialAssetRecord(rd)).toBe(true); expect(validateFinancialAssetRecord({ ...savings, currentValueChetrum: -1 })).toBe(false); expect(validateFinancialAssetRecord({ ...savings, name: '' })).toBe(false); expect(validateFinancialAssetRecord({ ...fd, maturityDate: '2028-02-31' })).toBe(false); expect(validateFinancialAssetRecord({ ...rd, totalContributedChetrum: 1.2 })).toBe(false); expect(validateFinancialAssetRecord({ ...savings, type: 'loan' })).toBe(false); expect(validateFinancialAssetRecord({ ...savings, accountNumber: '123' })).toBe(false) })
})

describe('financial asset lifecycle', () => {
  it('creates records with generated identity and trimmed fields, pruning empty optionals', () => { const created = createFinancialAsset({ type: 'savings-account', name: '  Wallet  ', institution: '', currentValueChetrum: 5000 }); expect(created.name).toBe('Wallet'); expect(created).not.toHaveProperty('institution'); expect(created.id).toMatch(/[0-9a-f-]{36}/); expect(created.createdAt).toBe(created.updatedAt) })
  it('preserves id and createdAt while updating updatedAt on edit', () => { const created = createFinancialAsset({ type: 'fixed-deposit', name: 'FD', institution: 'BoB', currentValueChetrum: 100, principalChetrum: 100, interestRateBps: 700 }); const next = updateFinancialAsset(created, { type: 'fixed-deposit', name: 'FD2', institution: 'BoB', currentValueChetrum: 200, principalChetrum: 100 }); expect(next.id).toBe(created.id); expect(next.createdAt).toBe(created.createdAt); expect(next.name).toBe('FD2'); expect(next).not.toHaveProperty('interestRateBps') })
})

describe('financial totals', () => {
  it('sums by type and produces tracked total without opening balance or transactions', () => { const assets = [savings, fd, rd]; expect(totalByType(assets, 'savings-account')).toBe(12540000); expect(financialTotals(assets)).toEqual({ savings: 12540000, fixedDeposits: 10800000, recurringDeposits: 12240000, total: 35580000 }); expect(financialTotals([])).toEqual({ savings: 0, fixedDeposits: 0, recurringDeposits: 0, total: 0 }) })
  it('orders assets by type then name', () => { expect(sortFinancialAssets([rd, fd, savings]).map(a => a.id)).toEqual(['s1', 'f1', 'r1']) })
})

describe('financial assets never affect cash-flow math', () => {
  it('leaves currentBalance, income, expenses, and savings unchanged', () => { const transactions: Transaction[] = [{ id: 't1', type: 'income', amountChetrum: toChetrum(1000), categoryId: 'salary', date: '2026-09-01', paymentMethod: 'Cash', note: '', isRecurring: false, createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-01T00:00:00.000Z' }, { id: 't2', type: 'expense', amountChetrum: toChetrum(200), categoryId: 'food', date: '2026-09-02', paymentMethod: 'Cash', note: '', isRecurring: false, createdAt: '2026-09-02T00:00:00.000Z', updatedAt: '2026-09-02T00:00:00.000Z' }]
    const before = { balance: currentBalance(toChetrum(50000), transactions), income: monthlyIncome(transactions, '2026-09'), expenses: monthlyExpenses(transactions, '2026-09'), savings: monthlySavings(transactions, '2026-09'), count: transactions.length }
    createFinancialAsset({ type: 'savings-account', name: 'A', currentValueChetrum: 999999 }); updateFinancialAsset(fd, { type: 'fixed-deposit', name: 'B', currentValueChetrum: 111, principalChetrum: 111 }); financialTotals([savings, fd, rd])
    expect({ balance: currentBalance(toChetrum(50000), transactions), income: monthlyIncome(transactions, '2026-09'), expenses: monthlyExpenses(transactions, '2026-09'), savings: monthlySavings(transactions, '2026-09'), count: transactions.length }).toEqual(before) })
})

describe('backup compatibility for financial assets', () => {
  const baseSettings = [{ key: 'app', currency: 'BTN', openingBalanceChetrum: 0, sampleData: false }]
  it('serializes and restores financial assets', () => { const backup = JSON.parse(serializeBackup({ transactions: [], settings: baseSettings, categories: [], budgets: [], recurring: [], financialAssets: [savings, fd, rd] })); expect(validateBackup(backup).financialAssets).toEqual([savings, fd, rd]) })
  it('restores legacy backups without a financialAssets field as an empty list', () => { const legacy = JSON.parse(serializeBackup({ transactions: [], settings: baseSettings, categories: [], budgets: [], recurring: [] })); expect(legacy).not.toHaveProperty('financialAssets'); expect(validateBackup(legacy).financialAssets).toEqual([]) })
  it('rejects malformed financial asset records and duplicate ids', () => { const bad = JSON.parse(serializeBackup({ transactions: [], settings: baseSettings, categories: [], budgets: [], recurring: [], financialAssets: [{ ...savings, currentValueChetrum: -1 }] })); expect(() => validateBackup(bad)).toThrow('financial assets'); const dupes = JSON.parse(serializeBackup({ transactions: [], settings: baseSettings, categories: [], budgets: [], recurring: [], financialAssets: [savings, savings] })); expect(() => validateBackup(dupes)).toThrow('financial assets') })
})
