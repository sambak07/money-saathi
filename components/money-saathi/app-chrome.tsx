'use client'

import { useState } from 'react'
import { Navigation } from '@/components/money-saathi/navigation'

export function Sidebar({ active, onNavigate }: { active: string; onNavigate: (label: string) => void }) {
  const [showPrivacy, setShowPrivacy] = useState(false)
  return <aside className="sidebar"><div className="brand"><div className="brand-mark">M</div><span>Money <b>Saathi</b></span></div><div className="sidebar-rule"/><p className="eyebrow">Your money, simply</p><Navigation active={active} onNavigate={onNavigate}/><div className="sidebar-bottom"><div className="privacy-chip"><b>Private by design</b><small>Your data stays on this device.</small></div><button className="help-link" onClick={() => setShowPrivacy(true)}>Privacy details</button></div>{showPrivacy && <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setShowPrivacy(false) }}><div className="add-sheet"><div className="sheet-header"><div><p className="eyebrow">Privacy</p><h2>Private by design</h2></div><button type="button" className="round-button small" onClick={() => setShowPrivacy(false)} aria-label="Close">×</button></div><p className="subheading">Money Saathi stores finance records only in this browser. Backups are downloaded locally and never uploaded.</p></div></div>}</aside>
}

export function MobileHeader() { return <header className="topbar"><div className="mobile-brand"><div className="brand-mark">M</div><span>Money <b>Saathi</b></span></div><button className="profile" aria-label="Device-only app">S</button></header> }

export function MobileNavigation({ active, onNavigate }: { active: string; onNavigate: (label: string) => void }) { return <Navigation active={active} onNavigate={onNavigate} mobile/> }
