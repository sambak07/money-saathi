'use client'

import { Plus } from 'lucide-react'

export function PageHeader({ active, onAdd }: { active: string; onAdd: () => void }) {
  return <div className="welcome-row"><div><p className="eyebrow">{new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p><h1>{active}</h1><p className="subheading">Your financial data is stored locally on this device.</p></div><button className="desktop-add" onClick={onAdd}><Plus size={18}/> Add transaction</button></div>
}
