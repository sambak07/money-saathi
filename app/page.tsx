'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, BarChart3, Home, Plus, Target, WalletCards, X, Trash2 } from 'lucide-react'
import { currentBalance, monthlyExpenses, monthlyIncome, monthlySavings, savingsRate } from '@/lib/analytics'
import { formatCurrency, toChetrum } from '@/lib/currency'
import { getSettings, saveSettings } from '@/lib/settings'
import { createTransaction, todayLocal, transactionRepository, type Transaction } from '@/lib/transactions'

const categories = [{ id: 'salary', label: 'Salary' }, { id: 'rental', label: 'Rental income' }, { id: 'food', label: 'Food & groceries' }, { id: 'housing', label: 'Housing / EMI' }, { id: 'transport', label: 'Fuel & transport' }, { id: 'other', label: 'Other' }]
const navItems = [{ label: 'Home', icon: Home }, { label: 'Transactions', icon: WalletCards }, { label: 'Reports', icon: BarChart3 }, { label: 'Budget', icon: Target }]

export default function Page() {
  const [active, setActive] = useState('Home')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [openingBalance, setOpeningBalance] = useState(0)
  const [showAdd, setShowAdd] = useState(false)
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('food')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(todayLocal())
  const [loaded, setLoaded] = useState(false)
  const [storageError, setStorageError] = useState(false)

  async function loadPrivateData() {
    setLoaded(false)
    setStorageError(false)
    try {
      const [items, settings] = await Promise.all([transactionRepository.list(), getSettings()])
      setTransactions(items)
      setOpeningBalance(settings.openingBalanceChetrum)
      setLoaded(true)
    } catch {
      setStorageError(true)
    }
  }

  useEffect(() => {
    Promise.all([transactionRepository.list(), getSettings()]).then(([items, settings]) => {
      setTransactions(items)
      setOpeningBalance(settings.openingBalanceChetrum)
      setLoaded(true)
    }).catch(() => setStorageError(true))
  }, [])
  const income = useMemo(() => monthlyIncome(transactions), [transactions])
  const expenses = useMemo(() => monthlyExpenses(transactions), [transactions])
  const savings = useMemo(() => monthlySavings(transactions), [transactions])
  const rate = useMemo(() => savingsRate(transactions), [transactions])

  async function addTransaction(event: React.FormEvent) {
    event.preventDefault()
    if (!amount || Number(amount) <= 0) return
    const transaction = createTransaction({ type, amountChetrum: toChetrum(amount), categoryId, date, paymentMethod: 'Cash', note: note.trim(), isRecurring: false })
    try {
      await transactionRepository.save(transaction)
      setTransactions(current => [transaction, ...current]); setAmount(''); setNote(''); setShowAdd(false)
    } catch {
      setStorageError(true)
    }
  }
  async function removeTransaction(id: string) { if (window.confirm('Delete this transaction? This cannot be undone.')) { try { await transactionRepository.remove(id); setTransactions(current => current.filter(item => item.id !== id)) } catch { setStorageError(true) } } }
  async function changeOpeningBalance() { const value = window.prompt('Opening balance in Ngultrum', String(openingBalance / 100)); if (value !== null && Number(value) >= 0) { const next = toChetrum(value); try { await saveSettings({ key: 'app', openingBalanceChetrum: next, currency: 'BTN', sampleData: false }); setOpeningBalance(next) } catch { setStorageError(true) } } }

  if (storageError) return <main className="app-shell"><section className="content-area"><div className="page-content storage-error"><p className="eyebrow">Private storage unavailable</p><h1>Money Saathi could not access private storage on this device.</h1><p className="subheading">Your existing data has not been intentionally deleted.</p><button className="primary-button" onClick={() => void loadPrivateData()}>Retry</button></div></section></main>
  if (!loaded) return <main className="app-shell"><section className="content-area"><div className="page-content"><p className="subheading">Loading your private money data…</p></div></section></main>
  return <main className="app-shell">
    <aside className="sidebar"><div className="brand"><div className="brand-mark">M</div><span>Money <b>Saathi</b></span></div><div className="sidebar-rule"/><p className="eyebrow">Your money, simply</p><nav className="side-nav" aria-label="Primary navigation">{navItems.map(item => { const Icon = item.icon; return <button key={item.label} onClick={() => setActive(item.label)} className={active === item.label ? 'nav-item active' : 'nav-item'}><Icon size={18}/><span>{item.label}</span></button> })}</nav><div className="sidebar-bottom"><div className="privacy-chip"><span><b>Private by design</b><small>Your data stays on this device.</small></span></div><button className="help-link" onClick={() => window.alert('Money Saathi stores finance records only in this browser. There is no account or cloud sync in V1.')}>Privacy details</button></div></aside>
    <section className="content-area"><header className="topbar"><div className="mobile-brand"><div className="brand-mark">M</div><span>Money <b>Saathi</b></span></div><button className="profile" aria-label="Device-only app">S</button></header><div className="page-content">
      <div className="welcome-row"><div><p className="eyebrow">{new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p><h1>{active}</h1><p className="subheading">Your financial data is stored locally on this device.</p></div><button className="desktop-add" onClick={() => setShowAdd(true)}><Plus size={18}/> Add transaction</button></div>
      {active === 'Home' && <><section className="balance-card"><div><p className="card-label">Current balance</p><div className="balance-value">{formatCurrency(currentBalance(openingBalance, transactions))}</div><button className="balance-note" onClick={changeOpeningBalance}>Opening balance: {formatCurrency(openingBalance)} · Edit</button></div></section><div className="stats-grid"><Stat label="Income this month" value={formatCurrency(income)} icon={ArrowDownLeft}/><Stat label="Expenses this month" value={formatCurrency(expenses)} icon={ArrowUpRight}/><Stat label="Saved this month" value={formatCurrency(savings)} note={rate === null ? 'No income yet' : `${rate.toFixed(1)}% savings rate`} icon={Target}/></div><section className="panel transactions-panel"><div className="panel-heading"><div><p className="eyebrow">Latest activity</p><h2>Recent transactions</h2></div><button className="text-button" onClick={() => setActive('Transactions')}>View all</button></div><div className="transaction-list">{transactions.length === 0 ? <p className="subheading">No transactions yet. Add your first income or expense.</p> : transactions.slice(0, 6).map(item => <TransactionRow key={item.id} item={item} onDelete={removeTransaction}/>)}</div></section></>}
      {active === 'Transactions' && <section className="panel transactions-panel"><div className="panel-heading"><div><p className="eyebrow">Persistent local records</p><h2>All transactions</h2></div><button className="desktop-add" onClick={() => setShowAdd(true)}><Plus size={16}/> Add</button></div><div className="transaction-list">{transactions.map(item => <TransactionRow key={item.id} item={item} onDelete={removeTransaction}/>)}</div></section>}
      {active === 'Reports' && <section className="panel"><p className="eyebrow">Reconciled from transactions</p><h2>Monthly report</h2><div className="report-grid"><p>Income<strong>{formatCurrency(income)}</strong></p><p>Expenses<strong>{formatCurrency(expenses)}</strong></p><p>Savings<strong>{formatCurrency(savings)}</strong></p><p>Savings rate<strong>{rate === null ? '—' : `${rate.toFixed(1)}%`}</strong></p></div></section>}
      {active === 'Budget' && <section className="panel"><p className="eyebrow">Coming with your data model</p><h2>Budget</h2><p className="subheading">Budget records are ready for local persistence. Add transactions first to make your spending plan meaningful.</p></section>}
    </div></section><nav className="bottom-nav" aria-label="Mobile navigation">{navItems.map(item => { const Icon = item.icon; return <button key={item.label} onClick={() => setActive(item.label)} className={active === item.label ? 'bottom-item active' : 'bottom-item'}><Icon size={20}/><span>{item.label}</span></button> })}</nav><button className="floating-add" aria-label="Add transaction" onClick={() => setShowAdd(true)}><Plus size={24}/></button>
    {showAdd && <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setShowAdd(false) }}><form className="add-sheet" onSubmit={addTransaction}><div className="sheet-header"><div><p className="eyebrow">Quick entry</p><h2>Add a transaction</h2></div><button type="button" className="round-button small" onClick={() => setShowAdd(false)} aria-label="Close"><X size={17}/></button></div><div className="entry-toggle"><button type="button" className={type === 'expense' ? 'selected expense' : ''} onClick={() => setType('expense')}>Expense</button><button type="button" className={type === 'income' ? 'selected income' : ''} onClick={() => setType('income')}>Income</button></div><label>Amount in Ngultrum<input inputMode="decimal" value={amount} onChange={event => setAmount(event.target.value)} placeholder="0.00" required/></label><label>Category<select value={categoryId} onChange={event => setCategoryId(event.target.value)}>{categories.map(category => <option key={category.id} value={category.id}>{category.label}</option>)}</select></label><label>Date<input type="date" value={date} onChange={event => setDate(event.target.value)} required/></label><label>Note<input value={note} onChange={event => setNote(event.target.value)} placeholder="Optional note"/></label><button className="primary-button submit-button" type="submit">Save transaction</button></form></div>}
  </main>
}

function Stat({ label, value, note, icon: Icon }: { label: string; value: string; note?: string; icon: typeof ArrowDownLeft }) { return <div className="stat-card"><div className="stat-card__top"><span>{label}</span><span className="stat-icon"><Icon size={16}/></span></div><strong>{value}</strong><small>{note || 'This month'}</small></div> }
function TransactionRow({ item, onDelete }: { item: Transaction; onDelete: (id: string) => void }) { const category = categories.find(entry => entry.id === item.categoryId)?.label || 'Other'; return <div className="transaction-row"><div className={`transaction-avatar ${item.type === 'income' ? 'sage' : 'peach'}`}>{item.type === 'income' ? '↗' : '⌁'}</div><div className="transaction-copy"><strong>{item.note || category}</strong><span>{category} · {item.date}</span></div><strong className={item.type === 'income' ? 'amount-income' : ''}>{item.type === 'income' ? '+' : '-'}{formatCurrency(item.amountChetrum)}</strong><button className="icon-button" aria-label={`Delete ${item.note || category}`} onClick={() => onDelete(item.id)}><Trash2 size={16}/></button></div> }
