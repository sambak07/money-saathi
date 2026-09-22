export type BusinessTransactionKind =
  | 'income'
  | 'expense'

export interface BusinessProfile {
  id: string
  name: string
  createdAt: number
  updatedAt: number
}

export interface BusinessTransaction {
  id: string
  businessId: string
  kind: BusinessTransactionKind
  amountChetrum: number
  category: string
  note: string
  date: string
  createdAt: number
  updatedAt: number
}
