import type { TransactionKind } from './transaction'

export type RegularFrequency = 'weekly' | 'monthly' | 'yearly'

export interface RegularMoney {
  id: string
  name: string
  kind: TransactionKind
  amountChetrum: number
  category: string
  frequency: RegularFrequency
  startDate: string
  endDate: string
  note: string
  createdAt: number
  updatedAt: number
}
