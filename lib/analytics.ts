import type { Transaction } from './transactions'

export function totalIncome(items: Transaction[]) { return items.filter(item => item.type === 'income').reduce((sum, item) => sum + item.amountChetrum, 0) }
export function totalExpenses(items: Transaction[]) { return items.filter(item => item.type === 'expense').reduce((sum, item) => sum + item.amountChetrum, 0) }
export function currentBalance(openingBalance: number, items: Transaction[]) { return openingBalance + totalIncome(items) - totalExpenses(items) }
export function monthlyItems(items: Transaction[], month = new Date().toISOString().slice(0, 7)) { return items.filter(item => item.date.startsWith(month)) }
export function monthlyIncome(items: Transaction[], month?: string) { return totalIncome(monthlyItems(items, month)) }
export function monthlyExpenses(items: Transaction[], month?: string) { return totalExpenses(monthlyItems(items, month)) }
export function monthlySavings(items: Transaction[], month?: string) { return monthlyIncome(items, month) - monthlyExpenses(items, month) }
export function savingsRate(items: Transaction[], month?: string) { const income = monthlyIncome(items, month); return income === 0 ? null : (monthlySavings(items, month) / income) * 100 }
export function categoryTotals(items: Transaction[]) { return items.filter(item => item.type === 'expense').reduce<Record<string, number>>((out, item) => { out[item.categoryId] = (out[item.categoryId] || 0) + item.amountChetrum; return out }, {}) }
export function monthlyCashFlow(items: Transaction[]) { return items.reduce<Record<string, { income: number; expenses: number }>>((out, item) => { const month = item.date.slice(0, 7); out[month] ||= { income: 0, expenses: 0 }; out[month][item.type === 'income' ? 'income' : 'expenses'] += item.amountChetrum; return out }, {}) }
