import { describe, expect, it } from 'vitest'
import { currentBalance, monthlyExpenses, monthlyIncome, monthlySavings, savingsRate, categoryTotals, totalExpenses, totalIncome } from './analytics'
import { formatCurrency, toChetrum } from './currency'
import type { Transaction } from './transactions'

const items: Transaction[] = [
  { id: '1', type: 'income', amountChetrum: toChetrum(100000), categoryId: 'salary', date: '2026-09-01', paymentMethod: 'Bank', note: '', isRecurring: false, createdAt: '', updatedAt: '' },
  { id: '2', type: 'income', amountChetrum: toChetrum(25000), categoryId: 'rental', date: '2026-09-02', paymentMethod: 'Bank', note: '', isRecurring: false, createdAt: '', updatedAt: '' },
  { id: '3', type: 'expense', amountChetrum: toChetrum(5000), categoryId: 'food', date: '2026-09-03', paymentMethod: 'Cash', note: '', isRecurring: false, createdAt: '', updatedAt: '' },
  { id: '4', type: 'expense', amountChetrum: toChetrum(18000), categoryId: 'housing', date: '2026-09-04', paymentMethod: 'Bank', note: '', isRecurring: false, createdAt: '', updatedAt: '' },
  { id: '5', type: 'expense', amountChetrum: toChetrum(3000), categoryId: 'transport', date: '2026-09-05', paymentMethod: 'Cash', note: '', isRecurring: false, createdAt: '', updatedAt: '' },
]

describe('Money Saathi finance model', () => {
  it('converts and formats chetrum precisely', () => { expect(toChetrum('100.50')).toBe(10050); expect(formatCurrency(10050)).toBe('Nu. 100.50') })
  it('reconciles acceptance totals', () => { expect(totalIncome(items)).toBe(12500000); expect(totalExpenses(items)).toBe(2600000); expect(monthlySavings(items, '2026-09')).toBe(9900000); expect(savingsRate(items, '2026-09')).toBeCloseTo(79.2); expect(currentBalance(toChetrum(50000), items)).toBe(toChetrum(149000)) })
  it('groups by month and category', () => { expect(monthlyIncome(items, '2026-09')).toBe(12500000); expect(monthlyExpenses(items, '2026-09')).toBe(2600000); expect(categoryTotals(items).food).toBe(500000) })
  it('returns null for zero-income savings rate', () => { expect(savingsRate([], '2026-09')).toBeNull() })
})
