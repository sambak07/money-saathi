import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { categoryShares, monthTotals } from './reporting'
import { generateInsights } from './insights'
import type { Transaction } from './transactions'

const reportsView = readFileSync(new URL('../components/money-saathi/reports-view.tsx', import.meta.url), 'utf8')

function tx(id: string, type: 'income' | 'expense', categoryId: string, amountChetrum: number): Transaction {
  return { id, type, categoryId, amountChetrum, date: '2026-09-10', paymentMethod: 'Cash', note: '', isRecurring: false, createdAt: '2026-09-10T00:00:00.000Z', updatedAt: '2026-09-10T00:00:00.000Z' }
}

describe('Reports no longer exposes Essential vs Flexible classification', () => {
  it('does not render the classification breakdown component or its data', () => {
    expect(reportsView).not.toContain('ClassificationBreakdown')
    expect(reportsView).not.toContain('classificationShares')
    expect(reportsView).not.toContain('classification-breakdown')
    expect(reportsView).not.toMatch(/Essential vs flexible/i)
  })

  it('never surfaces a classification insight', () => {
    const items = [tx('t1', 'expense', 'food', 500000), tx('t2', 'expense', 'housing', 800000)]
    const insights = generateInsights(items, [], '2026-09')
    const kinds = insights.map(insight => String(insight.kind))
    expect(kinds).not.toContain('classification')
    expect(insights.some(insight => /flexible spending/i.test(insight.text))).toBe(false)
    expect(insights.some(insight => /essential/i.test(insight.text))).toBe(false)
  })

  it('keeps groceries in the normal category breakdown instead of labelling it flexible', () => {
    const items = [tx('t1', 'expense', 'food', 500000)]
    const shares = categoryShares(items, '2026-09')
    const food = shares.find(row => row.categoryId === 'food')
    expect(food).toBeDefined()
    expect(food?.amount).toBe(500000)
    expect(food?.percent).toBeCloseTo(100)
  })

  it('leaves core monthly totals unchanged', () => {
    const items = [tx('t1', 'expense', 'food', 500000), tx('t2', 'income', 'salary', 2000000)]
    const totals = monthTotals(items, '2026-09')
    expect(totals.income).toBe(2000000)
    expect(totals.expenses).toBe(500000)
    expect(totals.savings).toBe(1500000)
  })
})
