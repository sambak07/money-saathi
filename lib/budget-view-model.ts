import { safeToChetrum } from './currency'
import { budgetId } from './budgets'
import { expenseCategories, categoryLabel } from './finance'
import { budgetRemaining, budgetUsedPercent, commitmentRatio, monthlyCommitments, monthlyRecurringIncome, type Budget, type RecurringItem } from './planning'

// Presentation-only helpers for the Budget screen. These never change the
// underlying finance arithmetic — they only reshape existing calculations for
// display so the UI can stay declarative and remain unit-testable without a DOM.

export type BudgetRow = { budget: Budget; label: string; spent: number; remaining: number; overspent: boolean; barWidth: number }

// Only categories that actually have a budget for the selected month become
// rows. Unused categories are never rendered, so there is no long list of
// "No budget set" placeholders.
export function activeBudgetRows(monthBudgets: Budget[], spending: Record<string, number>): BudgetRow[] {
  return monthBudgets
    .map(budget => {
      const spent = spending[budget.categoryId] || 0
      const remaining = budgetRemaining(budget, spent)
      return { budget, label: categoryLabel(budget.categoryId), spent, remaining, overspent: remaining < 0, barWidth: budgetUsedPercent(budget, spent) }
    })
    .sort((a, b) => a.label.localeCompare(b.label))
}

export type MonthSummary = { budgeted: number; spent: number; moneyLeft: number; overBudget: boolean; overAmount: number }

// Money left never goes negative on screen: an overspent month is presented as
// "Over budget" instead of a confusing negative "Money left". This is display
// framing only; totalBudget/totalSpent are the untouched real numbers.
export function budgetMonthSummary(totalBudget: number, totalSpent: number): MonthSummary {
  const diff = totalBudget - totalSpent
  return { budgeted: totalBudget, spent: totalSpent, moneyLeft: diff > 0 ? diff : 0, overBudget: diff < 0, overAmount: diff < 0 ? -diff : 0 }
}

export type RegularSummary = { income: number; payments: number; ratio: number | null }

// Reuses the existing recurring calculations only; no new financial math.
export function regularMoneySummary(items: RecurringItem[]): RegularSummary {
  return { income: monthlyRecurringIncome(items), payments: monthlyCommitments(items), ratio: commitmentRatio(items) }
}

// Prefill values for the on-demand budget editor. Editing an existing budget
// yields its current category and rupee amount; a new budget defaults to the
// first expense category with an empty amount.
export function budgetFormValues(budget?: Budget | null): { category: string; amount: string } {
  return budget ? { category: budget.categoryId, amount: String(budget.limitChetrum / 100) } : { category: expenseCategories[0].id, amount: '' }
}

// Validation for a budget amount: rejects blank, zero, negative, non-numeric
// and unsafe values while preserving safeToChetrum semantics.
export function parseBudgetAmount(input: string): { value?: number; error?: string } {
  const parsed = safeToChetrum(input)
  if (parsed.value === undefined) return { error: parsed.error || 'Enter an amount greater than zero.' }
  if (parsed.value <= 0) return { error: 'Enter an amount greater than zero.' }
  return { value: parsed.value }
}

// Builds a budget record without changing the budget ID format (month:category)
// and preserving the original createdAt when editing.
export function buildBudgetRecord(month: string, categoryId: string, limitChetrum: number, existing?: Budget | null, now: Date = new Date()): Budget {
  return { id: budgetId(month, categoryId), month, categoryId, limitChetrum, createdAt: existing?.createdAt || now.toISOString(), updatedAt: now.toISOString() }
}
