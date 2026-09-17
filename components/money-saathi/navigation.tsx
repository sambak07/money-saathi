'use client'

import { useState } from 'react'
import { BarChart3, Home, MoreHorizontal, PiggyBank, RotateCcw, Target, Wallet, WalletCards, type LucideIcon } from 'lucide-react'

type NavItem = { label: string; icon: LucideIcon }
export const navItems: NavItem[] = [
  { label: 'Home', icon: Home },
  { label: 'Transactions', icon: WalletCards },
  { label: 'My Money', icon: Wallet },
  { label: 'Reports', icon: BarChart3 },
  { label: 'Budget', icon: Target },
  { label: 'Goals', icon: PiggyBank },
  { label: 'Settings', icon: RotateCcw },
]

// Keep the mobile bottom bar to five targets. Everything else lives under "More".
export const mobilePrimaryItems = ['Home', 'Transactions', 'My Money', 'Budget']
export const mobileMoreItems = ['Reports', 'Goals', 'Settings']

type NavigationProps = {
  active: string
  onNavigate: (label: string) => void
  mobile?: boolean
}

export function Navigation({ active, onNavigate, mobile = false }: NavigationProps) {
  const [moreOpen, setMoreOpen] = useState(false)

  if (!mobile) {
    return <nav className="side-nav" aria-label="Primary navigation">{navItems.map(item => { const Icon = item.icon; return <button key={item.label} onClick={() => onNavigate(item.label)} className={active === item.label ? 'nav-item active' : 'nav-item'} aria-current={active === item.label ? 'page' : undefined}><Icon size={18}/><span>{item.label}</span></button> })}</nav>
  }

  const primary = navItems.filter(item => mobilePrimaryItems.includes(item.label))
  const moreItems = navItems.filter(item => mobileMoreItems.includes(item.label))
  const moreActive = mobileMoreItems.includes(active)
  const select = (label: string) => { setMoreOpen(false); onNavigate(label) }

  return <>
    <nav className="bottom-nav" aria-label="Mobile navigation">
      {primary.map(item => { const Icon = item.icon; return <button key={item.label} onClick={() => onNavigate(item.label)} className={active === item.label ? 'bottom-item active' : 'bottom-item'} aria-current={active === item.label ? 'page' : undefined}><Icon size={20}/><span>{item.label}</span></button> })}
      <button type="button" className={moreActive || moreOpen ? 'bottom-item active' : 'bottom-item'} onClick={() => setMoreOpen(true)} aria-haspopup="dialog" aria-expanded={moreOpen}><MoreHorizontal size={20}/><span>More</span></button>
    </nav>
    {moreOpen && <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setMoreOpen(false) }}>
      <div className="add-sheet more-sheet" role="dialog" aria-modal="true" aria-label="More destinations">
        <div className="sheet-header"><div><p className="eyebrow">Menu</p><h2>More</h2></div><button type="button" className="round-button small" onClick={() => setMoreOpen(false)} aria-label="Close">×</button></div>
        <div className="more-list">{moreItems.map(item => { const Icon = item.icon; return <button key={item.label} type="button" className={active === item.label ? 'more-item active' : 'more-item'} onClick={() => select(item.label)} aria-current={active === item.label ? 'page' : undefined}><Icon size={18}/><span>{item.label}</span></button> })}</div>
      </div>
    </div>}
  </>
}
