'use client'
import { useMemo } from 'react'
import { formatCurrency } from '@/lib/currency'
import { usePlanning } from '@/hooks/use-planning'
import { monthKey, monthlyCategorySpending, budgetRemaining, monthlyCommitments } from '@/lib/planning'
import type { Transaction } from '@/lib/transactions'
export function PlanningSummary({ transactions }: { transactions: Transaction[] }) { const { budgets, recurring, loading } = usePlanning(); const month = monthKey(); const spent = useMemo(() => monthlyCategorySpending(transactions, month), [transactions, month]); const remaining = budgets.filter(item => item.month === month).reduce((sum, item) => sum + budgetRemaining(item, spent[item.categoryId] || 0), 0); const commitments = monthlyCommitments(recurring); if (loading) return null; return <section className="panel planning-summary"><div><p className="eyebrow">Monthly plan</p><h2>Planning snapshot</h2></div>{budgets.length === 0 && commitments === 0 ? <p className="subheading">Set a budget or add a recurring commitment to see your plan here.</p> : <div className="planning-summary-grid"><div><span>Budget remaining</span><strong>{formatCurrency(remaining)}</strong></div><div><span>Commitments</span><strong>{formatCurrency(commitments)}</strong></div></div>}</section> }
