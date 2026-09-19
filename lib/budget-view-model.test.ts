import { describe, expect, it } from 'vitest'
import { activeBudgetRows, budgetFormValues, budgetMonthSummary, buildBudgetRecord, parseBudgetAmount, regularMoneySummary } from './budget-view-model'
import type { Budget, RecurringItem } from './planning'

function budget(categoryId: string, limitChetrum: number, month = '2026-09', overrides: Partial<Budget> = {}): Budget {
  return { id: `${month}:${categoryId}`, month, categoryId, limitChetrum, createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-01T00:00:00.000Z', ...overrides }
}

function recurring(overrides: Partial<RecurringItem>): RecurringItem {
  return { id: crypto.randomUUID(), name: 'Item', type: 'expense', amountChetrum: 10000, categoryId: 'food', paymentMethod: 'Cash', frequency: 'monthly', dayOfMonth: 1, classification: 'flexible', isCommitment: false, active: true, createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-01T00:00:00.000Z', ...overrides }
}

describe('activeBudgetRows', () => {
  it('renders only categories that have a budget, sorted by label', () => {
    const rows = activeBudgetRows([budget('transport', 500000), budget('food', 1000000)], { food: 750000, transport: 0, health: 999999 })
    expect(rows.map(row => row.budget.categoryId)).toEqual(['food', 'transport'])
    expect(rows).toHaveLength(2)
    // The unbudgeted "health" spending never becomes a row.
    expect(rows.some(row => row.budget.categoryId === 'health')).toBe(false)
  })

  it('computes spent, remaining and overspent state', () => {
    const [food] = activeBudgetRows([budget('food', 1000000)], { food: 750000 })
    expect(food.spent).toBe(750000)
    expect(food.remaining).toBe(250000)
    expect(food.overspent).toBe(false)
  })

  it('flags overspending and caps the progress bar at 100%', () => {
    const [food] = activeBudgetRows([budget('food', 1000000)], { food: 1500000 })
    expect(food.overspent).toBe(true)
    expect(food.remaining).toBe(-500000)
    expect(food.barWidth).toBeLessThanOrEqual(100)
  })

  it('reflects only the budgets passed in, so switching months shows the right rows', () => {
    const september = activeBudgetRows([budget('food', 1000000, '2026-09')], { food: 100000 })
    const october = activeBudgetRows([budget('transport', 300000, '2026-10')], { transport: 100000 })
    expect(september.map(row => row.budget.categoryId)).toEqual(['food'])
    expect(october.map(row => row.budget.categoryId)).toEqual(['transport'])
  })
})

describe('budgetMonthSummary', () => {
  it('shows positive money left when under budget', () => {
    const summary = budgetMonthSummary(1000000, 600000)
    expect(summary.overBudget).toBe(false)
    expect(summary.moneyLeft).toBe(400000)
    expect(summary.overAmount).toBe(0)
  })

  it('never shows a negative money left when over budget', () => {
    const summary = budgetMonthSummary(1000000, 1300000)
    expect(summary.overBudget).toBe(true)
    expect(summary.moneyLeft).toBe(0)
    expect(summary.overAmount).toBe(300000)
  })

  it('treats an exactly-spent month as not over budget', () => {
    const summary = budgetMonthSummary(1000000, 1000000)
    expect(summary.overBudget).toBe(false)
    expect(summary.moneyLeft).toBe(0)
    expect(summary.overAmount).toBe(0)
  })
})

describe('regularMoneySummary', () => {
  it('uses existing recurring calculations for income, payments and ratio', () => {
    const items = [recurring({ type: 'income', amountChetrum: 5000000 }), recurring({ type: 'expense', isCommitment: true, amountChetrum: 1500000 }), recurring({ type: 'expense', isCommitment: false, amountChetrum: 900000 })]
    const summary = regularMoneySummary(items)
    expect(summary.income).toBe(5000000)
    expect(summary.payments).toBe(1500000)
    expect(summary.ratio).toBeCloseTo(30, 5)
  })

  it('returns a null ratio when there is no recurring income', () => {
    expect(regularMoneySummary([recurring({ type: 'expense', isCommitment: true })]).ratio).toBeNull()
  })
})

describe('budgetFormValues', () => {
  it('prefills category and rupee amount from an existing budget', () => {
    expect(budgetFormValues(budget('transport', 750000))).toEqual({ category: 'transport', amount: '7500' })
  })

  it('defaults to the first expense category and an empty amount for a new budget', () => {
    expect(budgetFormValues()).toEqual({ category: 'food', amount: '' })
  })
})

describe('parseBudgetAmount', () => {
  it('accepts a valid amount', () => {
    expect(parseBudgetAmount('1500')).toEqual({ value: 150000 })
  })

  it('rejects blank, zero, negative and invalid input', () => {
    expect(parseBudgetAmount('').error).toBeTruthy()
    expect(parseBudgetAmount('0').error).toBeTruthy()
    expect(parseBudgetAmount('-5').error).toBeTruthy()
    expect(parseBudgetAmount('abc').error).toBeTruthy()
  })
})

describe('buildBudgetRecord', () => {
  it('keeps the month:category id format and preserves createdAt when editing', () => {
    const existing = budget('food', 1000000)
    const now = new Date('2026-09-15T10:00:00.000Z')
    const record = buildBudgetRecord('2026-09', 'food', 1200000, existing, now)
    expect(record.id).toBe('2026-09:food')
    expect(record.createdAt).toBe(existing.createdAt)
    expect(record.updatedAt).toBe('2026-09-15T10:00:00.000Z')
    expect(record.limitChetrum).toBe(1200000)
  })

  it('stamps createdAt for a brand new budget', () => {
    const now = new Date('2026-09-15T10:00:00.000Z')
    const record = buildBudgetRecord('2026-09', 'transport', 300000, null, now)
    expect(record.id).toBe('2026-09:transport')
    expect(record.createdAt).toBe('2026-09-15T10:00:00.000Z')
  })
})
