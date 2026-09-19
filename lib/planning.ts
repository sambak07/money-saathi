import type { Transaction } from './transactions'
import { expenseCategories, incomeCategories, categoryLabel } from './finance'

export type Budget = { id: string; month: string; categoryId: string; limitChetrum: number; createdAt: string; updatedAt: string }
export type RecurringItem = { id: string; name: string; type: 'income' | 'expense'; amountChetrum: number; categoryId: string; paymentMethod: string; frequency: 'monthly'; dayOfMonth: number; classification: 'essential' | 'flexible'; isCommitment: boolean; active: boolean; lastConfirmedMonth?: string; createdAt: string; updatedAt: string }
export type Classification = RecurringItem['classification']
export const expenseClassification: Record<string, Classification> = { housing: 'essential', utilities: 'essential', health: 'essential', food: 'flexible', transport: 'flexible', other: 'flexible' }
export const classificationForCategory = (categoryId: string): Classification => expenseClassification[categoryId] || 'flexible'
export const monthKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
export const daysInMonth = (month: string) => { const [year, value] = month.split('-').map(Number); return new Date(year, value, 0).getDate() }
export const monthlyCategorySpending = (transactions: Transaction[], month: string) => transactions.filter(item => item.type === 'expense' && item.date.startsWith(month)).reduce<Record<string, number>>((totals, item) => ({ ...totals, [item.categoryId]: (totals[item.categoryId] || 0) + item.amountChetrum }), {})
export const budgetRemaining = (budget: Budget, spent: number) => budget.limitChetrum - spent
export const budgetUsedPercent = (budget: Budget, spent: number) => budget.limitChetrum === 0 ? 0 : Math.min(100, (spent / budget.limitChetrum) * 100)
export const essentialSpending = (transactions: Transaction[], month: string) => transactions.filter(item => item.type === 'expense' && item.date.startsWith(month) && classificationForCategory(item.categoryId) === 'essential').reduce((sum, item) => sum + item.amountChetrum, 0)
export const flexibleSpending = (transactions: Transaction[], month: string) => transactions.filter(item => item.type === 'expense' && item.date.startsWith(month) && classificationForCategory(item.categoryId) === 'flexible').reduce((sum, item) => sum + item.amountChetrum, 0)
export const classificationBreakdown = (transactions: Transaction[], month: string) => ({ essential: essentialSpending(transactions, month), flexible: flexibleSpending(transactions, month) })
export const monthlyCommitments = (items: RecurringItem[]) => items.filter(item => item.active && item.type === 'expense' && item.isCommitment).reduce((sum, item) => sum + item.amountChetrum, 0)
export const monthlyRecurringIncome = (items: RecurringItem[]) => items.filter(item => item.active && item.type === 'income').reduce((sum, item) => sum + item.amountChetrum, 0)
// All active recurring expense items, whether or not they are marked as commitments.
// This is what "Regular payments" means to a user, unlike monthlyCommitments which is commitment-only.
export const monthlyRecurringExpense = (items: RecurringItem[]) => items.filter(item => item.active && item.type === 'expense').reduce((sum, item) => sum + item.amountChetrum, 0)
export const commitmentRatio = (items: RecurringItem[]) => { const income = monthlyRecurringIncome(items); return income === 0 ? null : (monthlyCommitments(items) / income) * 100 }
export function dueRecurringItems(items: RecurringItem[], month = monthKey(), currentDate: Date | number = new Date()) { const date = typeof currentDate === 'number' ? new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1, currentDate) : currentDate; const currentMonth = monthKey(date); if (month !== currentMonth) return []; const day = date.getDate(); const lastDay = daysInMonth(currentMonth); return items.filter(item => item.active && item.frequency === 'monthly' && Math.min(item.dayOfMonth, lastDay) <= day && item.lastConfirmedMonth !== currentMonth) }
export const expenseCategoryOptions = expenseCategories.map(category => ({ id: category.id, label: category.label }))
export const incomeCategoryOptions = incomeCategories.map(category => ({ id: category.id, label: category.label }))
export { categoryLabel }
