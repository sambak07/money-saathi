import { describe, expect, it } from 'vitest'
import { createFinancialAsset, financialAssetsRepository, financialTotals, sortFinancialAssets, totalByType, updateFinancialAsset, validAssetId, validateFinancialAssetRecord, validChetrum, validInterestRateBps, validOptionalDate, type FinancialAsset } from './financial-assets'
import { serializeBackup, validateBackup } from './finance'
import { currentBalance, monthlyExpenses, monthlyIncome, monthlySavings } from './analytics'
import { toChetrum } from './currency'
import type { Transaction } from './transactions'

const SAVINGS_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
const FD_ID = 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e'
const RD_ID = 'c3d4e5f6-a7b8-4c9d-8e0f-2a3b4c5d6e7f'

const savings: FinancialAsset = { id: SAVINGS_ID, type: 'savings-account', name: 'Druk PNB Savings', institution: 'Druk PNB Bank', currentValueChetrum: 12540000, createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-01T00:00:00.000Z' }
const fd: FinancialAsset = { id: FD_ID, type: 'fixed-deposit', name: '3-year FD', institution: 'Bank of Bhutan', currentValueChetrum: 10800000, principalChetrum: 10000000, interestRateBps: 750, startDate: '2025-03-12', maturityDate: '2028-03-12', createdAt: '2026-09-02T00:00:00.000Z', updatedAt: '2026-09-02T00:00:00.000Z' }
const rd: FinancialAsset = { id: RD_ID, type: 'recurring-deposit', name: 'Monthly RD', institution: 'BNB', currentValueChetrum: 12240000, monthlyContributionChetrum: 1000000, totalContributedChetrum: 12000000, startDate: '2025-01-01', maturityDate: '2027-01-01', createdAt: '2026-09-03T00:00:00.000Z', updatedAt: '2026-09-03T00:00:00.000Z' }

describe('financial asset id validation', () => {
  it('accepts only crypto.randomUUID()-shaped ids', () => {
    expect(validAssetId(crypto.randomUUID())).toBe(true)
    expect(validAssetId(SAVINGS_ID)).toBe(true)
    expect(validAssetId('s1')).toBe(false)
    expect(validAssetId('abc')).toBe(false)
    expect(validAssetId('123')).toBe(false)
    expect(validAssetId('')).toBe(false)
    expect(validAssetId(undefined)).toBe(false)
  })
  it('rejects records whose id is not a valid UUID even when every other field is valid', () => {
    expect(validateFinancialAssetRecord({ ...savings, id: 's1' })).toBe(false)
    expect(validateFinancialAssetRecord({ ...savings, id: 'abc' })).toBe(false)
    expect(validateFinancialAssetRecord({ ...savings, id: '123' })).toBe(false)
  })
})

describe('financial asset validation', () => {
  it('requires safe integer chetrum and rejects negatives and floats', () => { expect(validChetrum(0)).toBe(true); expect(validChetrum(12540000)).toBe(true); expect(validChetrum(-1)).toBe(false); expect(validChetrum(1.5)).toBe(false); expect(validChetrum(Number.MAX_SAFE_INTEGER + 2)).toBe(false) })
  it('accepts optional interest rate and valid calendar dates only', () => { expect(validInterestRateBps(undefined)).toBe(true); expect(validInterestRateBps(750)).toBe(true); expect(validInterestRateBps(-5)).toBe(false); expect(validOptionalDate(undefined)).toBe(true); expect(validOptionalDate('2028-03-12')).toBe(true); expect(validOptionalDate('2028-02-31')).toBe(false); expect(validOptionalDate('bad')).toBe(false) })
  it('enforces a 0%-100% interest-rate ceiling at the basis-point boundary', () => {
    expect(validInterestRateBps(0)).toBe(true)
    expect(validInterestRateBps(750)).toBe(true)
    expect(validInterestRateBps(10000)).toBe(true)
    expect(validInterestRateBps(10001)).toBe(false)
    expect(validInterestRateBps(-1)).toBe(false)
    expect(validInterestRateBps(50.5)).toBe(false)
  })
  it('validates each asset type and rejects malformed records', () => { expect(validateFinancialAssetRecord(savings)).toBe(true); expect(validateFinancialAssetRecord(fd)).toBe(true); expect(validateFinancialAssetRecord(rd)).toBe(true); expect(validateFinancialAssetRecord({ ...savings, currentValueChetrum: -1 })).toBe(false); expect(validateFinancialAssetRecord({ ...savings, name: '' })).toBe(false); expect(validateFinancialAssetRecord({ ...fd, maturityDate: '2028-02-31' })).toBe(false); expect(validateFinancialAssetRecord({ ...fd, interestRateBps: 10001 })).toBe(false); expect(validateFinancialAssetRecord({ ...rd, totalContributedChetrum: 1.2 })).toBe(false); expect(validateFinancialAssetRecord({ ...savings, type: 'loan' })).toBe(false); expect(validateFinancialAssetRecord({ ...savings, accountNumber: '123' })).toBe(false) })
})

describe('financial asset lifecycle', () => {
  it('creates records with generated identity and trimmed fields, pruning empty optionals', () => { const created = createFinancialAsset({ type: 'savings-account', name: '  Wallet  ', institution: '', currentValueChetrum: 5000 }); expect(created.name).toBe('Wallet'); expect(created).not.toHaveProperty('institution'); expect(validAssetId(created.id)).toBe(true); expect(created.createdAt).toBe(created.updatedAt) })
  it('preserves id and createdAt while updating updatedAt on edit', () => { const created = createFinancialAsset({ type: 'fixed-deposit', name: 'FD', institution: 'BoB', currentValueChetrum: 100, principalChetrum: 100, interestRateBps: 700 }); const next = updateFinancialAsset(created, { type: 'fixed-deposit', name: 'FD2', institution: 'BoB', currentValueChetrum: 200, principalChetrum: 100 }); expect(next.id).toBe(created.id); expect(next.createdAt).toBe(created.createdAt); expect(next.name).toBe('FD2'); expect(next).not.toHaveProperty('interestRateBps') })
})

describe('financial asset repository refuses invalid records', () => {
  it('throws instead of persisting a record with a non-UUID id, bypassing the UI', async () => {
    const malformed = { ...savings, id: 's1' } as unknown as FinancialAsset
    await expect(financialAssetsRepository.save(malformed)).rejects.toThrow('Invalid financial asset record')
    await expect(financialAssetsRepository.update(malformed)).rejects.toThrow('Invalid financial asset record')
  })
  it('throws instead of persisting a record with a negative value, bypassing the UI', async () => {
    const malformed = { ...savings, currentValueChetrum: -1 } as FinancialAsset
    await expect(financialAssetsRepository.save(malformed)).rejects.toThrow('Invalid financial asset record')
  })
  it('throws instead of persisting a record with an out-of-range interest rate, bypassing the UI', async () => {
    const malformed = { ...fd, interestRateBps: 10001 } as FinancialAsset
    await expect(financialAssetsRepository.update(malformed)).rejects.toThrow('Invalid financial asset record')
  })
})

describe('financial totals', () => {
  it('sums by type and produces tracked total without opening balance or transactions', () => { const assets = [savings, fd, rd]; expect(totalByType(assets, 'savings-account')).toBe(12540000); expect(financialTotals(assets)).toEqual({ savings: 12540000, fixedDeposits: 10800000, recurringDeposits: 12240000, total: 35580000 }); expect(financialTotals([])).toEqual({ savings: 0, fixedDeposits: 0, recurringDeposits: 0, total: 0 }) })
  it('orders assets by type then name', () => { expect(sortFinancialAssets([rd, fd, savings]).map(a => a.id)).toEqual([SAVINGS_ID, FD_ID, RD_ID]) })
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
  it('rejects financial asset records with a non-UUID id', () => { const bad = JSON.parse(serializeBackup({ transactions: [], settings: baseSettings, categories: [], budgets: [], recurring: [], financialAssets: [{ ...savings, id: 's1' }] })); expect(() => validateBackup(bad)).toThrow('financial assets') })
})
