export type TransactionKind = 'income' | 'expense'

export interface MoneyTransaction {
  id: string
  kind: TransactionKind
  amountChetrum: number
  category: string
  note: string
  date: string
  createdAt: number
  updatedAt: number
  recurringSourceId?: string
  scheduledFor?: string
}
