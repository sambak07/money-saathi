'use client'

import { BarChart3, Home, RotateCcw, Target, WalletCards, type LucideIcon } from 'lucide-react'

export const navItems: Array<{ label: string; icon: LucideIcon }> = [{ label: 'Home', icon: Home }, { label: 'Transactions', icon: WalletCards }, { label: 'Reports', icon: BarChart3 }, { label: 'Budget', icon: Target }, { label: 'Goals', icon: Target }, { label: 'Settings', icon: RotateCcw }]

type NavigationProps = {
  active: string
  onNavigate: (label: string) => void
  mobile?: boolean
}

export function Navigation({ active, onNavigate, mobile = false }: NavigationProps) {
  return <nav className={mobile ? 'bottom-nav' : 'side-nav'} aria-label={mobile ? 'Mobile navigation' : 'Primary navigation'}>{navItems.filter(item => !mobile || item.label !== 'Goals').map(item => { const Icon = item.icon; return <button key={item.label} onClick={() => onNavigate(item.label)} className={active === item.label ? (mobile ? 'bottom-item active' : 'nav-item active') : (mobile ? 'bottom-item' : 'nav-item')}><Icon size={mobile ? 20 : 18}/><span>{item.label}</span></button> })}</nav>
}
