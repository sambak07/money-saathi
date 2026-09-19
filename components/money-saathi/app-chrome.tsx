'use client'

import { useState } from 'react'
import { ExternalLink, Lock, Settings } from 'lucide-react'
import { Navigation } from '@/components/money-saathi/navigation'
import { useModalDialog } from '@/components/money-saathi/dialogs/use-modal-dialog'

export function Sidebar({ active, onNavigate, lockEnabled, onExit }: { active: string; onNavigate: (label: string) => void; lockEnabled: boolean; onExit: () => void }) {
  const [showPrivacy, setShowPrivacy] = useState(false)
  const privacyRef = useModalDialog<HTMLDivElement>({ open: showPrivacy, onClose: () => setShowPrivacy(false) })
  return <aside className="sidebar"><div className="brand"><div className="brand-mark">M</div><span>Money <b>Saathi</b></span></div><div className="sidebar-rule"/><p className="eyebrow">Your money, simply</p><Navigation active={active} onNavigate={onNavigate}/><div className="sidebar-bottom"><div className="privacy-chip"><b>Private by design</b><small>Your data stays on this device.</small></div><button className="help-link" onClick={() => setShowPrivacy(true)}>Privacy details</button><button className="help-link" onClick={onExit}>{lockEnabled ? 'Lock & exit' : 'Exit to website'}</button></div>{showPrivacy && <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setShowPrivacy(false) }}><div className="add-sheet" role="dialog" aria-modal="true" aria-label="Private by design" ref={privacyRef}><div className="sheet-header"><div><p className="eyebrow">Privacy</p><h2>Private by design</h2></div><button type="button" className="round-button small" onClick={() => setShowPrivacy(false)} aria-label="Close">×</button></div><p className="subheading">Money Saathi stores finance records only in this browser. Backups are downloaded locally and never uploaded.</p></div></div>}</aside>
}

export function MobileHeader({ onNavigate, lockEnabled, onExit }: { onNavigate: (label: string) => void; lockEnabled: boolean; onExit: () => void }) {
  const [open, setOpen] = useState(false)
  const menuRef = useModalDialog<HTMLDivElement>({ open, onClose: () => setOpen(false) })
  return <header className="topbar"><div className="mobile-brand"><div className="brand-mark">M</div><span>Money <b>Saathi</b></span></div><button className="profile" aria-label="Account and device options" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>S</button>{open && <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setOpen(false) }}><div className="add-sheet more-sheet" role="dialog" aria-modal="true" aria-label="Account and device" ref={menuRef}><div className="sheet-header"><div><p className="eyebrow">Device</p><h2>Account</h2></div><button type="button" className="round-button small" onClick={() => setOpen(false)} aria-label="Close">×</button></div><div className="more-list"><button type="button" className="more-item" onClick={() => { setOpen(false); onNavigate('Settings') }}><Settings size={18}/><span>Settings</span></button><button type="button" className="more-item" onClick={() => { setOpen(false); onExit() }}>{lockEnabled ? <Lock size={18}/> : <ExternalLink size={18}/>}<span>{lockEnabled ? 'Lock & exit' : 'Exit to website'}</span></button></div></div></div>}</header>
}

export function MobileNavigation({ active, onNavigate }: { active: string; onNavigate: (label: string) => void }) { return <Navigation active={active} onNavigate={onNavigate} mobile/> }
