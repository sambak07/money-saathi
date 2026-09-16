import { expenseCategories, categoryLabel } from './finance'
import { classificationBreakdown, monthlyCategorySpending, monthlyCommitments, monthlyRecurringIncome, type Budget, type RecurringItem } from './planning'
import { monthlyExpenses, monthlyIncome, monthlySavings, savingsRate } from './analytics'
import type { Transaction } from './transactions'

export type MonthTotals = { month: string; income: number; expenses: number; savings: number; savingsRate: number | null }
export type Comparison = { income: number; expenses: number; savings: number; hasPrevious: boolean }
export type CategoryShare = { categoryId: string; label: string; amount: number; percent: number }
export type BudgetPerformance = { budget: Budget; label: string; spent: number; remaining: number; usedPercent: number }

export function monthTotals(items: Transaction[], month: string): MonthTotals { return { month, income: monthlyIncome(items, month), expenses: monthlyExpenses(items, month), savings: monthlySavings(items, month), savingsRate: savingsRate(items, month) } }
export function previousMonth(month: string) { const [year, value] = month.split('-').map(Number); const date = new Date(year, value - 2, 1); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` }
export function previousMonthComparison(items: Transaction[], month: string): Comparison { const previous = previousMonth(month); const previousItems = items.filter(item => item.date.startsWith(previous)); return { income: monthTotals(items, month).income - monthlyIncome(items, previous), expenses: monthTotals(items, month).expenses - monthlyExpenses(items, previous), savings: monthTotals(items, month).savings - monthlySavings(items, previous), hasPrevious: previousItems.length > 0 } }
export function categoryShares(items: Transaction[], month: string): CategoryShare[] { const totals = monthlyCategorySpending(items, month); const total = monthlyExpenses(items, month); return Object.entries(totals).map(([categoryId, amount]) => ({ categoryId, label: categoryLabel(categoryId), amount, percent: total === 0 ? 0 : amount / total * 100 })).sort((a, b) => b.amount - a.amount) }
export function classificationShares(items: Transaction[], month: string) { const values = classificationBreakdown(items, month); const total = values.essential + values.flexible; return { ...values, essentialPercent: total ? values.essential / total * 100 : 0, flexiblePercent: total ? values.flexible / total * 100 : 0 } }
export function budgetPerformance(items: Transaction[], budgets: Budget[], month: string): BudgetPerformance[] { const spent = monthlyCategorySpending(items, month); return budgets.filter(item => item.month === month).map(budget => ({ budget, label: categoryLabel(budget.categoryId), spent: spent[budget.categoryId] || 0, remaining: budget.limitChetrum - (spent[budget.categoryId] || 0), usedPercent: budget.limitChetrum ? (spent[budget.categoryId] || 0) / budget.limitChetrum * 100 : 0 })).sort((a, b) => b.usedPercent - a.usedPercent) }
export function availableMonths(items: Transaction[]) { return [...new Set(items.map(item => item.date.slice(0, 7)))].sort().reverse() }
export function trendSeries(items: Transaction[], limit = 6): MonthTotals[] { return availableMonths(items).slice(0, limit).reverse().map(month => monthTotals(items, month)) }
export function commitmentMetrics(items: RecurringItem[]) { return { income: monthlyRecurringIncome(items), commitments: monthlyCommitments(items), ratio: monthlyRecurringIncome(items) ? monthlyCommitments(items) / monthlyRecurringIncome(items) * 100 : null } }
export { expenseCategories }
