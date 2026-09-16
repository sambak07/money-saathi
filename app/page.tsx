'use client'

import { useMemo, useState } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  Bell,
  CalendarDays,
  ChevronRight,
  CircleHelp,
  FileDown,
  Home,
  MoreHorizontal,
  PieChart,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  WalletCards,
  X,
} from 'lucide-react'

type Transaction = {
  id: number
  title: string
  category: string
  date: string
  amount: number
  type: 'income' | 'expense'
  color: string
  icon: string
}

const initialTransactions: Transaction[] = [
  { id: 1, title: 'Monthly salary', category: 'Salary', date: 'Today', amount: 125000, type: 'income', color: 'sage', icon: '↗' },
  { id: 2, title: 'Groceries at Big Mart', category: 'Food & Groceries', date: 'Today', amount: 4850, type: 'expense', color: 'amber', icon: '⌁' },
  { id: 3, title: 'Apartment rent', category: 'Housing', date: 'Yesterday', amount: 18000, type: 'expense', color: 'lavender', icon: '⌂' },
  { id: 4, title: 'Fuel top up', category: 'Transport', date: '12 Sep', amount: 2400, type: 'expense', color: 'peach', icon: '↗' },
]

const navItems = [
  { label: 'Home', icon: Home },
  { label: 'Transactions', icon: WalletCards },
  { label: 'Reports', icon: BarChart3 },
  { label: 'Budget', icon: Target },
  { label: 'Settings', icon: Settings },
]

function formatNu(value: number) {
  return `Nu. ${value.toLocaleString('en-IN')}`
}

function StatCard({ label, value, note, positive, icon: Icon }: { label: string; value: string; note: string; positive?: boolean; icon: typeof ArrowDownLeft }) {
  return (
    <div className="stat-card">
      <div className="stat-card__top"><span>{label}</span><span className={`stat-icon ${positive ? 'stat-icon--positive' : ''}`}><Icon size={16} /></span></div>
      <strong>{value}</strong>
      <small className={positive ? 'positive' : ''}>{note}</small>
    </div>
  )
}

function TransactionRow({ transaction }: { transaction: Transaction }) {
  return (
    <div className="transaction-row">
      <div className={`transaction-avatar ${transaction.color}`}>{transaction.icon}</div>
      <div className="transaction-copy"><strong>{transaction.title}</strong><span>{transaction.category} · {transaction.date}</span></div>
      <strong className={transaction.type === 'income' ? 'amount-income' : ''}>{transaction.type === 'income' ? '+' : '-'}{formatNu(transaction.amount).replace('Nu. ', 'Nu. ')}</strong>
      <button className="icon-button" aria-label={`More options for ${transaction.title}`}><MoreHorizontal size={17} /></button>
    </div>
  )
}

export default function Page() {
  const [active, setActive] = useState('Home')
  const [showAdd, setShowAdd] = useState(false)
  const [entryType, setEntryType] = useState<'income' | 'expense'>('expense')
  const [transactions, setTransactions] = useState(initialTransactions)
  const [amount, setAmount] = useState('')
  const [title, setTitle] = useState('')

  const totals = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
    const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
    return { income, expenses, saved: income - expenses }
  }, [transactions])

  function addTransaction(event: React.FormEvent) {
    event.preventDefault()
    const parsed = Number(amount)
    if (!parsed || parsed <= 0) return
    setTransactions(current => [{ id: Date.now(), title: title || (entryType === 'income' ? 'New income' : 'New expense'), category: entryType === 'income' ? 'Other income' : 'Other', date: 'Today', amount: parsed, type: entryType, color: entryType === 'income' ? 'sage' : 'peach', icon: entryType === 'income' ? '↗' : '⌁' }, ...current])
    setAmount(''); setTitle(''); setShowAdd(false)
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">M</div><span>Money <b>Saathi</b></span></div>
        <div className="sidebar-rule" />
        <p className="eyebrow">Your money, simply</p>
        <nav className="side-nav" aria-label="Primary navigation">
          {navItems.map(item => { const Icon = item.icon; return <button key={item.label} onClick={() => setActive(item.label)} className={active === item.label ? 'nav-item active' : 'nav-item'}><Icon size={18} /><span>{item.label}</span>{item.label === 'Budget' && <span className="nav-dot" />}</button> })}
        </nav>
        <div className="sidebar-bottom"><div className="privacy-chip"><ShieldCheck size={17} /><span><b>Private by design</b><small>Your data stays on this device.</small></span></div><button className="help-link"><CircleHelp size={16} /> Help & guidance</button></div>
      </aside>

      <section className="content-area">
        <header className="topbar"><div className="mobile-brand"><div className="brand-mark">M</div><span>Money <b>Saathi</b></span></div><div className="top-actions"><button className="round-button" aria-label="Notifications"><Bell size={18} /><i /></button><button className="profile">S</button></div></header>
        <div className="page-content">
          {active === 'Home' ? <>
            <div className="welcome-row"><div><p className="eyebrow">Monday, 16 September 2026</p><h1>Good evening</h1><p className="subheading">Here is where your money stands.</p></div><button className="desktop-add" onClick={() => { setEntryType('expense'); setShowAdd(true) }}><Plus size={18} /> Add transaction</button></div>
            <section className="balance-card"><div><p className="card-label">Current balance <span className="mini-info">i</span></p><div className="balance-value">{formatNu(84250)}</div><p className="balance-note"><span className="trend-up">↗ 12.4%</span> from last month</p></div><div className="balance-orbit"><WalletCards size={24} /><span>On track</span></div></section>
            <div className="stats-grid"><StatCard label="Income this month" value={formatNu(totals.income)} note="↗ 8.2% from last month" positive icon={ArrowDownLeft} /><StatCard label="Expenses this month" value={formatNu(totals.expenses)} note="↘ 4.6% from last month" positive icon={ArrowUpRight} /><StatCard label="Saved this month" value={formatNu(totals.saved)} note="37.3% savings rate" positive icon={Sparkles} /></div>
            <div className="dashboard-grid"><section className="panel cashflow-panel"><div className="panel-heading"><div><p className="eyebrow">Your rhythm</p><h2>Cash flow</h2></div><button className="select-button">Last 6 months <ChevronRight size={15} /></button></div><div className="chart-legend"><span><i className="legend-income" /> Income</span><span><i className="legend-expense" /> Expenses</span></div><div className="bar-chart" aria-label="Income and expenses over the last six months"><div className="axis-labels"><span>150k</span><span>100k</span><span>50k</span><span>0</span></div>{[['Apr',72,38],['May',64,44],['Jun',80,42],['Jul',68,48],['Aug',88,52],['Sep',96,55]].map(([month,income,expense]) => <div className="bar-group" key={month as string}><div className="bars"><i style={{height: `${income}%`}} /><i style={{height: `${expense}%`}} /></div><span>{month}</span></div>)}</div></section><section className="panel spending-panel"><div className="panel-heading"><div><p className="eyebrow">This month</p><h2>Where it went</h2></div><button className="round-button small"><MoreHorizontal size={17} /></button></div><div className="donut-wrap"><div className="donut"><div><strong>Nu. 78k</strong><span>spent</span></div></div><div className="category-list"><span><i className="dot food" />Food <b>32%</b></span><span><i className="dot housing" />Housing <b>27%</b></span><span><i className="dot transport" />Transport <b>18%</b></span><span><i className="dot other" />Other <b>23%</b></span></div></div></section></div>
            <div className="lower-grid"><section className="panel transactions-panel"><div className="panel-heading"><div><p className="eyebrow">Latest activity</p><h2>Recent transactions</h2></div><button className="text-button" onClick={() => setActive('Transactions')}>View all <ChevronRight size={15} /></button></div><div className="transaction-list">{transactions.slice(0, 4).map(t => <TransactionRow key={t.id} transaction={t} />)}</div></section><section className="insight-card"><div className="insight-icon"><Sparkles size={19} /></div><p className="eyebrow">A little insight</p><h2>You&apos;re spending less on transport</h2><p>Your transport spending is down 18% compared with last month. That&apos;s a good habit worth keeping.</p><button className="insight-link">See your reports <ChevronRight size={15} /></button></section></div>
          </> : <section className="page-placeholder"><div className="placeholder-icon">{active === 'Transactions' ? <WalletCards /> : active === 'Reports' ? <BarChart3 /> : active === 'Budget' ? <Target /> : <Settings />}</div><p className="eyebrow">Money Saathi</p><h1>{active}</h1><p>Everything you need to feel more confident about your money will live here.</p><button className="primary-button" onClick={() => setActive('Home')}>Back to home</button></section>}
        </div>
      </section>

      <nav className="bottom-nav" aria-label="Mobile navigation">{navItems.map(item => { const Icon = item.icon; return <button key={item.label} onClick={() => setActive(item.label)} className={active === item.label ? 'bottom-item active' : 'bottom-item'}><Icon size={20} /><span>{item.label}</span></button> })}</nav>
      <button className="floating-add" aria-label="Add transaction" onClick={() => { setEntryType('expense'); setShowAdd(true) }}><Plus size={24} /></button>

      {showAdd && <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setShowAdd(false) }}><form className="add-sheet" onSubmit={addTransaction}><div className="sheet-handle" /><div className="sheet-header"><div><p className="eyebrow">Quick entry</p><h2>Add a transaction</h2></div><button type="button" className="round-button small" onClick={() => setShowAdd(false)} aria-label="Close"><X size={17} /></button></div><div className="entry-toggle"><button type="button" className={entryType === 'expense' ? 'selected expense' : ''} onClick={() => setEntryType('expense')}><ArrowUpRight size={16} /> Expense</button><button type="button" className={entryType === 'income' ? 'selected income' : ''} onClick={() => setEntryType('income')}><ArrowDownLeft size={16} /> Income</button></div><label>Amount<input autoFocus inputMode="decimal" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} required /></label><label>What was this for?<input placeholder={entryType === 'income' ? 'e.g. Monthly salary' : 'e.g. Lunch with friends'} value={title} onChange={e => setTitle(e.target.value)} /></label><div className="form-row"><label>Category<select><option>{entryType === 'income' ? 'Salary' : 'Food & Groceries'}</option><option>Housing</option><option>Transport</option><option>Other</option></select></label><label>Date<div className="date-input"><CalendarDays size={15} /> Today</div></label></div><button className="primary-button submit-button" type="submit">Save transaction</button></form></div>}
    </main>
  )
}
