'use client'

import { ArrowDownLeft, RotateCcw, Trash2 } from 'lucide-react'
import { categoryLabel } from '@/lib/finance'
import { formatCurrency } from '@/lib/currency'
import type { Transaction } from '@/lib/transactions'

export function Stat({ label, value, note, icon: Icon }: { label: string; value: string; note?: string; icon: typeof ArrowDownLeft }) {
  return <div className="stat-card"><div className="stat-card__top"><span>{label}</span><span className="stat-icon"><Icon size={16}/></span></div><strong>{value}</strong><small>{note || 'This month'}</small></div>
}

export function TransactionRow({ item, onDelete, onEdit }: { item: Transaction; onDelete: (id: string) => void; onEdit: (item: Transaction) => void }) {
  return <div className="transaction-row"><div className={`transaction-avatar ${item.type === 'income' ? 'sage' : 'peach'}`}>{item.type === 'income' ? '↗' : '⌁'}</div><div className="transaction-copy"><strong>{item.note || categoryLabel(item.categoryId)}</strong><span>{categoryLabel(item.categoryId)} · {item.paymentMethod} · {item.date}</span></div><strong className={item.type === 'income' ? 'amount-income' : ''}>{item.type === 'income' ? '+' : '-'}{formatCurrency(item.amountChetrum)}</strong><button className="icon-button" aria-label={`Edit ${item.note || categoryLabel(item.categoryId)}`} onClick={() => onEdit(item)}><RotateCcw size={16}/></button><button className="icon-button" aria-label={`Delete ${item.note || categoryLabel(item.categoryId)}`} onClick={() => onDelete(item.id)}><Trash2 size={16}/></button></div>
}
export { categoryLabel }
export type { Transaction }

