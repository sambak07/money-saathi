'use client'

import { useCallback, useState } from 'react'
import { todayLocal, type Transaction } from '@/lib/transactions'
import type { TransactionFilters } from '@/lib/finance'

export type MoneySaathiView = 'Home' | 'Transactions' | 'My Money' | 'Reports' | 'Budget' | 'Goals' | 'Learn' | 'Settings'
export type FormState = { type: Transaction['type']; amount: string; categoryId: string; date: string; paymentMethod: string; note: string }

export const emptyFilters: TransactionFilters = { query: '', type: '', categoryId: '', paymentMethod: '', period: '' }
export const blankForm: FormState = { type: 'expense', amount: '', categoryId: 'food', date: todayLocal(), paymentMethod: 'Cash', note: '' }

export function useMoneySaathi() {
  const [active, setActive] = useState<MoneySaathiView>('Home')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [form, setForm] = useState<FormState>(blankForm)
  const [filters, setFilters] = useState<TransactionFilters>(emptyFilters)

  const navigate = useCallback((view: string) => setActive(view as MoneySaathiView), [])
  const openAdd = useCallback(() => {
    setEditing(null)
    setForm({ ...blankForm, date: todayLocal() })
    setShowForm(true)
  }, [])
  const openEdit = useCallback((item: Transaction) => {
    setEditing(item)
    setForm({ type: item.type, amount: (item.amountChetrum / 100).toFixed(2), categoryId: item.categoryId, date: item.date, paymentMethod: item.paymentMethod, note: item.note })
    setShowForm(true)
  }, [])

  return { active, navigate, showForm, setShowForm, editing, setEditing, form, setForm, filters, setFilters, openAdd, openEdit }
}
