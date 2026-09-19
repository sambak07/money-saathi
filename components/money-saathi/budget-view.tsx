'use client'
import { useMemo, useRef, useState, type FormEvent } from 'react'
import { Pencil, Play, Plus, Trash2, Pause } from 'lucide-react'
import { formatCurrency, safeToChetrum } from '@/lib/currency'
import { expenseCategories, incomeCategories, categoryLabel, PAYMENT_METHODS } from '@/lib/finance'
import { budgetId } from '@/lib/budgets'
import { updatedRecurring } from '@/lib/recurring'
import { usePlanning } from '@/hooks/use-planning'
import { dueRecurringItems, monthKey, monthlyCategorySpending, type Budget, type RecurringItem } from '@/lib/planning'
import { activeBudgetRows, budgetFormValues, budgetMonthSummary, buildBudgetRecord, parseBudgetAmount, regularMoneySummary, totalBudgetedSpent } from '@/lib/budget-view-model'
import type { Transaction } from '@/lib/transactions'
import { ConfirmDialog } from '@/components/money-saathi/dialogs/confirm-dialog'
import { AppDialog, DialogActions } from '@/components/money-saathi/dialogs/app-dialog'

type Props = { transactions: Transaction[]; onConfirmRecurring: (item: RecurringItem) => void; onPlanningChanged?: () => void; onPlanningAudit?: (input: { action: 'create' | 'update' | 'delete' | 'change'; resourceType: string; resourceId?: string; summary: string; metadata?: Record<string, unknown> }) => void }

export function BudgetView({ transactions, onConfirmRecurring, onPlanningAudit, onPlanningChanged }: Props) {
  const { budgets, recurring, loading, saveBudget, removeBudget, saveRecurring, removeRecurring } = usePlanning(onPlanningChanged)
  const [month, setMonth] = useState(monthKey())
  const [budgetCategory, setBudgetCategory] = useState('food'); const [budgetAmount, setBudgetAmount] = useState(''); const [editingBudget, setEditingBudget] = useState<Budget | null>(null); const [showBudgetEditor, setShowBudgetEditor] = useState(false)
  const budgetSavingRef = useRef(false); const recurringSavingRef = useRef(false); const [pendingBudget, setPendingBudget] = useState<Budget | null>(null); const [pendingRecurring, setPendingRecurring] = useState<RecurringItem | null>(null); const [budgetSaving, setBudgetSaving] = useState(false); const [recurringSaving, setRecurringSaving] = useState(false); const [budgetError, setBudgetError] = useState(''); const [recurringError, setRecurringError] = useState(''); const [deleteBusy, setDeleteBusy] = useState(false)
  const [showRecurring, setShowRecurring] = useState(false); const [editingRecurring, setEditingRecurring] = useState<RecurringItem | null>(null); const [name, setName] = useState(''); const [recurringAmount, setRecurringAmount] = useState(''); const [recurringType, setRecurringType] = useState<'income' | 'expense'>('expense'); const [recurringCategory, setRecurringCategory] = useState('food'); const [paymentMethod, setPaymentMethod] = useState<string>(PAYMENT_METHODS[0]); const [dayOfMonth, setDayOfMonth] = useState('1'); const [classification, setClassification] = useState<'essential' | 'flexible'>('flexible'); const [isCommitment, setIsCommitment] = useState(false); const [skipped, setSkipped] = useState<string[]>([])

  const spending = useMemo(() => monthlyCategorySpending(transactions, month), [transactions, month])
  const monthBudgets = useMemo(() => budgets.filter(item => item.month === month), [budgets, month])
  const rows = useMemo(() => activeBudgetRows(monthBudgets, spending), [monthBudgets, spending])
  const totalBudget = monthBudgets.reduce((sum, item) => sum + item.limitChetrum, 0)
  const summary = budgetMonthSummary(totalBudget, totalBudgetedSpent(rows))
  const regular = regularMoneySummary(recurring)
  const dueItems = dueRecurringItems(recurring).filter(item => !skipped.includes(item.id))
  const overlayOpen = showBudgetEditor || showRecurring

  function openBudgetEditor(budget?: Budget) { const values = budgetFormValues(budget); setEditingBudget(budget || null); setBudgetCategory(values.category); setBudgetAmount(values.amount); setBudgetError(''); setShowBudgetEditor(true) }
  function closeBudgetEditor() { if (budgetSaving) return; setShowBudgetEditor(false); setBudgetError('') }
  function resetRecurring() { setEditingRecurring(null); setName(''); setRecurringAmount(''); setRecurringType('expense'); setRecurringCategory('food'); setPaymentMethod(PAYMENT_METHODS[0]); setDayOfMonth('1'); setClassification('flexible'); setIsCommitment(false) }
  function openRecurring(item?: RecurringItem) { setRecurringError(''); if (item) { setEditingRecurring(item); setName(item.name); setRecurringAmount(String(item.amountChetrum / 100)); setRecurringType(item.type); setRecurringCategory(item.categoryId); setPaymentMethod(item.paymentMethod); setDayOfMonth(String(item.dayOfMonth)); setClassification(item.classification); setIsCommitment(item.isCommitment) } else resetRecurring(); setShowRecurring(true) }

  async function submitBudget(event: FormEvent) {
    event.preventDefault()
    if (budgetSaving || budgetSavingRef.current) return
    const parsed = parseBudgetAmount(budgetAmount)
    if (parsed.value === undefined) { setBudgetError(parsed.error || 'Enter an amount greater than zero.'); return }
    const value = parsed.value
    setBudgetError(''); budgetSavingRef.current = true; setBudgetSaving(true)
    const existing = monthBudgets.find(item => item.id === budgetId(month, budgetCategory))
    const next = buildBudgetRecord(month, budgetCategory, value, existing)
    try {
      await saveBudget(next)
      onPlanningAudit?.({ action: existing ? 'update' : 'create', resourceType: 'budget', resourceId: next.id, summary: existing ? 'Budget updated' : 'Budget created', metadata: { amountChetrum: value, categoryId: budgetCategory } })
      setShowBudgetEditor(false); setBudgetAmount(''); setEditingBudget(null)
    } catch { setBudgetError('Could not save this budget. Try again.') }
    finally { setBudgetSaving(false); budgetSavingRef.current = false }
  }

  async function submitRecurring(event: FormEvent) {
    event.preventDefault()
    if (recurringSaving || recurringSavingRef.current) return
    const parsed = safeToChetrum(recurringAmount)
    if (parsed.value === undefined || parsed.value <= 0) { setRecurringError(parsed.error || 'Enter an amount greater than zero.'); return }
    const value = parsed.value; const day = Number(dayOfMonth)
    if (!name.trim() || !Number.isInteger(day) || day < 1 || day > 31) { setRecurringError('Enter a name and a day from 1 to 31.'); return }
    setRecurringError(''); recurringSavingRef.current = true; setRecurringSaving(true)
    const now = new Date().toISOString()
    const category = (recurringType === 'income' ? incomeCategories : expenseCategories).some(item => item.id === recurringCategory) ? recurringCategory : (recurringType === 'income' ? 'salary' : 'food')
    const next: RecurringItem = editingRecurring ? updatedRecurring(editingRecurring, { name: name.trim(), type: recurringType, amountChetrum: value, categoryId: category, paymentMethod, dayOfMonth: day, classification, isCommitment: recurringType === 'expense' && isCommitment, active: editingRecurring.active }) : { id: crypto.randomUUID(), name: name.trim(), type: recurringType, amountChetrum: value, categoryId: category, paymentMethod, frequency: 'monthly', dayOfMonth: day, classification, isCommitment: recurringType === 'expense' && isCommitment, active: true, createdAt: now, updatedAt: now }
    try {
      await saveRecurring(next)
      onPlanningAudit?.({ action: editingRecurring ? 'update' : 'create', resourceType: 'recurring', resourceId: next.id, summary: editingRecurring ? 'Recurring item updated' : 'Recurring item created', metadata: { type: next.type, amountChetrum: next.amountChetrum, categoryId: next.categoryId } })
      setShowRecurring(false); resetRecurring()
    } catch { setRecurringError('Could not save this recurring item. Try again.') }
    finally { setRecurringSaving(false); recurringSavingRef.current = false }
  }

  async function confirmRecurringDelete() { if (!pendingRecurring || deleteBusy) return; setDeleteBusy(true); try { await removeRecurring(pendingRecurring.id); onPlanningAudit?.({ action: 'delete', resourceType: 'recurring', resourceId: pendingRecurring.id, summary: 'Recurring item deleted' }); setPendingRecurring(null) } catch { setRecurringError('Could not delete this recurring item. Try again.') } finally { setDeleteBusy(false) } }
  async function confirmBudgetDelete() { if (!pendingBudget || deleteBusy) return; setDeleteBusy(true); try { await removeBudget(pendingBudget.id); onPlanningAudit?.({ action: 'delete', resourceType: 'budget', resourceId: pendingBudget.id, summary: 'Budget deleted', metadata: { categoryId: pendingBudget.categoryId, month: pendingBudget.month } }); setPendingBudget(null) } catch { setBudgetError('Could not delete this budget. Try again.') } finally { setDeleteBusy(false) } }
  async function toggleRecurring(item: RecurringItem) { const next = updatedRecurring(item, { active: !item.active }); await saveRecurring(next); onPlanningAudit?.({ action: 'change', resourceType: 'recurring', resourceId: item.id, summary: next.active ? 'Recurring item resumed' : 'Recurring item paused' }) }

  if (loading) return <section className="panel"><p className="subheading">Loading your private planning data…</p></section>

  return <>
    <div className="form-error budget-alert" aria-live="polite">{overlayOpen ? '' : budgetError || recurringError}</div>
    <ConfirmDialog open={Boolean(pendingRecurring)} title="Delete this regular item?" description={pendingRecurring ? `${pendingRecurring.name} · ${formatCurrency(pendingRecurring.amountChetrum)}. Transactions you already confirmed will stay.` : ''} confirmLabel="Delete item" onCancel={() => setPendingRecurring(null)} onConfirm={confirmRecurringDelete} busy={deleteBusy}/>
    <ConfirmDialog open={Boolean(pendingBudget)} title="Delete this budget?" description={pendingBudget ? `${categoryLabel(pendingBudget.categoryId)} · ${formatCurrency(pendingBudget.limitChetrum)}. Deleting the budget does not delete any transactions.` : ''} confirmLabel="Delete budget" onCancel={() => setPendingBudget(null)} onConfirm={confirmBudgetDelete} busy={deleteBusy}/>

    <section className="planning-page budget-page">
      <header className="budget-header">
        <div><h1>Budget</h1><p className="subheading">Plan how much you want to spend this month.</p></div>
        <button className="primary-button budget-set" onClick={() => openBudgetEditor()}><Plus size={16}/> Set budget</button>
      </header>

      <label className="month-field budget-month">Month<input type="month" value={month} onChange={event => setMonth(event.target.value)}/></label>

      <div className="budget-summary">
        <div className="budget-summary-card"><span>Budgeted</span><strong>{formatCurrency(summary.budgeted)}</strong></div>
        <div className="budget-summary-card"><span>Spent</span><strong>{formatCurrency(summary.spent)}</strong></div>
        <div className="budget-summary-card"><span>{summary.overBudget ? 'Over budget' : 'Money left'}</span><strong className={summary.overBudget ? 'is-over' : ''}>{formatCurrency(summary.overBudget ? summary.overAmount : summary.moneyLeft)}</strong></div>
      </div>

      {rows.length === 0 ? <div className="panel budget-empty"><h2>Plan this month your way.</h2><p>Set spending limits for the areas that matter to you.</p><button className="primary-button" onClick={() => openBudgetEditor()}>Set your first budget</button></div> : <section className="panel budget-panel"><div className="panel-heading"><h2>Your budgets</h2></div><div className="budget-list">{rows.map(({ budget, label, spent, remaining, overspent, barWidth }) => <article className="budget-row" key={budget.id}><div className="budget-row-top"><b>{label}</b><span className="budget-spent">{formatCurrency(spent)} of {formatCurrency(budget.limitChetrum)} spent</span></div><span className="budget-progress"><i className={overspent ? 'is-over' : ''} style={{ width: `${barWidth}%` }}/></span><div className="budget-row-bottom"><span className={overspent ? 'budget-left is-over' : 'budget-left'}>{overspent ? `${formatCurrency(-remaining)} over` : `${formatCurrency(remaining)} left`}</span><div className="budget-actions"><button className="text-button" onClick={() => openBudgetEditor(budget)}><Pencil size={14}/> Edit</button><button className="icon-button" aria-label={`Delete ${label} budget`} onClick={() => setPendingBudget(budget)}><Trash2 size={15}/></button></div></div></article>)}</div><button className="text-button budget-add-more" onClick={() => openBudgetEditor()}><Plus size={14}/> Set another budget</button></section>}

      <section className="panel regular-panel">
        <div className="panel-heading"><div><h2>Regular money</h2><p className="subheading">Income and payments that happen every month.</p></div><button className="primary-button" onClick={() => openRecurring()}><Plus size={15}/> Add regular item</button></div>
        <div className="budget-summary regular-summary"><div className="budget-summary-card"><span>Regular income</span><strong>{formatCurrency(regular.income)}</strong></div><div className="budget-summary-card"><span>Regular payments</span><strong>{formatCurrency(regular.payments)}</strong>{regular.ratio !== null && <small>{regular.ratio.toFixed(0)}% of regular income</small>}</div></div>
        {dueItems.length > 0 && <div className="due-card"><p className="eyebrow">Due this month</p><div className="regular-list">{dueItems.map(item => <div className="regular-row due-row" key={`due-${item.id}`}><div><b>{item.name}</b><small>{formatCurrency(item.amountChetrum)}</small></div><div className="regular-actions"><button className="primary-button" onClick={() => onConfirmRecurring(item)}>Confirm</button><button className="text-button" onClick={() => setSkipped(current => [...current, item.id])}>Not now</button></div></div>)}</div></div>}
        {recurring.length === 0 ? <div className="regular-empty"><p><b>Nothing regular added yet.</b></p><p>Add salary, rent, EMI or another monthly amount once and Money Saathi will remember it.</p><button className="primary-button" onClick={() => openRecurring()}>Add regular item</button></div> : <div className="regular-list">{recurring.map(item => <div className="regular-row" key={item.id}><div><b>{item.name}</b><small>{item.type === 'income' ? 'Income' : 'Payment'} · {formatCurrency(item.amountChetrum)} · day {item.dayOfMonth}{item.active ? '' : ' · Paused'}</small></div><div className="regular-actions"><button className="text-button" onClick={() => openRecurring(item)}><Pencil size={14}/> Edit</button><button className="icon-button" aria-label={item.active ? `Pause ${item.name}` : `Resume ${item.name}`} onClick={() => void toggleRecurring(item)}>{item.active ? <Pause size={15}/> : <Play size={15}/>}</button><button className="icon-button" aria-label={`Delete ${item.name}`} onClick={() => setPendingRecurring(item)}><Trash2 size={15}/></button></div></div>)}</div>}
      </section>
    </section>

    <AppDialog open={showBudgetEditor} title={editingBudget ? 'Edit budget' : 'Set a budget'} description={editingBudget ? 'Update how much you plan to spend here.' : 'Choose an area and set how much you plan to spend.'} onClose={closeBudgetEditor}>
      <form className="budget-editor-form" onSubmit={submitBudget}>
        <label>Category{editingBudget ? <input className="readonly-field" value={categoryLabel(budgetCategory)} readOnly aria-readonly="true"/> : <select value={budgetCategory} onChange={event => setBudgetCategory(event.target.value)}>{expenseCategories.map(category => <option key={category.id} value={category.id}>{category.label}</option>)}</select>}</label>
        <label>Amount<input inputMode="decimal" placeholder="Nu. amount" value={budgetAmount} onChange={event => setBudgetAmount(event.target.value)}/></label>
        {budgetError && <p className="form-error" role="alert">{budgetError}</p>}
        <DialogActions><button type="button" className="secondary-button" onClick={closeBudgetEditor} disabled={budgetSaving}>Cancel</button><button type="submit" className="primary-button" disabled={budgetSaving}>{budgetSaving ? 'Saving…' : editingBudget ? 'Save changes' : 'Set budget'}</button></DialogActions>
      </form>
    </AppDialog>

    {showRecurring && <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setShowRecurring(false) }}><form className="add-sheet recurring-form" role="dialog" aria-modal="true" aria-label={editingRecurring ? 'Edit regular item' : 'Add regular item'} onSubmit={submitRecurring}><div className="sheet-header"><div><p className="eyebrow">Regular money</p><h2>{editingRecurring ? 'Edit regular item' : 'Add regular item'}</h2></div><button type="button" className="round-button small" onClick={() => setShowRecurring(false)} aria-label="Close">×</button></div><label>Name<input value={name} onChange={event => setName(event.target.value)} required/></label><div className="form-grid"><label>Type<select value={recurringType} onChange={event => { const value = event.target.value as 'income' | 'expense'; setRecurringType(value); setRecurringCategory(value === 'income' ? 'salary' : 'food'); setIsCommitment(false) }}><option value="expense">Payment</option><option value="income">Income</option></select></label><label>Amount<input inputMode="decimal" value={recurringAmount} onChange={event => setRecurringAmount(event.target.value)} required/></label><label>Category<select value={recurringCategory} onChange={event => setRecurringCategory(event.target.value)}>{(recurringType === 'income' ? incomeCategories : expenseCategories).map(category => <option key={category.id} value={category.id}>{category.label}</option>)}</select></label><label>Payment method<select value={paymentMethod} onChange={event => setPaymentMethod(event.target.value)}>{PAYMENT_METHODS.map(method => <option key={method}>{method}</option>)}</select></label><label>Day of month<input type="number" min="1" max="31" step="1" value={dayOfMonth} onChange={event => setDayOfMonth(event.target.value)} required/></label><label>Kind<select value={classification} onChange={event => setClassification(event.target.value as 'essential' | 'flexible')}><option value="essential">Essential</option><option value="flexible">Flexible</option></select></label></div>{recurringType === 'expense' && <label className="check-row"><input type="checkbox" checked={isCommitment} onChange={event => setIsCommitment(event.target.checked)}/> Treat as a fixed monthly payment</label>}{recurringError && <p className="form-error" role="alert">{recurringError}</p>}<button className="primary-button" type="submit" disabled={recurringSaving}>{recurringSaving ? 'Saving…' : editingRecurring ? 'Save changes' : 'Add regular item'}</button></form></div>}
  </>
}
