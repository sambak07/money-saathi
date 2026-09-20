'use client'
import { formatCurrency } from '@/lib/currency'
import type { MonthTotals, Comparison } from '@/lib/reporting'
export function MonthlySummary({ totals, comparison }: { totals: MonthTotals; comparison: Comparison }) {
  const delta = (value: number) => comparison.hasPrevious ? `${value >= 0 ? '+' : '-'}${formatCurrency(Math.abs(value))} vs previous month` : 'No previous-month comparison'
  return <section className="panel"><div className="summary-grid">
    <div className="summary-metric"><p className="summary-label">Income</p><p className="summary-value">{formatCurrency(totals.income)}</p><p className="summary-context">{delta(comparison.income)}</p></div>
    <div className="summary-metric"><p className="summary-label">Expenses</p><p className="summary-value">{formatCurrency(totals.expenses)}</p><p className="summary-context">{delta(comparison.expenses)}</p></div>
    <div className="summary-metric"><p className="summary-label">Left after spending</p><p className="summary-value">{formatCurrency(totals.savings)}</p><p className="summary-context">Income minus expenses this month</p></div>
    <div className="summary-metric"><p className="summary-label">Share of income left</p><p className="summary-value">{totals.savingsRate === null ? '—' : `${totals.savingsRate.toFixed(1)}%`}</p><p className="summary-context">Income minus expenses, as a share of income</p></div>
  </div></section>
}
