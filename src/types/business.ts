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

export type BusinessPartyRole =
  | 'customer'
  | 'supplier'
  | 'both'

export interface BusinessParty {
  id: string
  businessId: string
  name: string
  role: BusinessPartyRole
  phone: string
  note: string
  createdAt: number
  updatedAt: number
}

export type BusinessOpenItemDirection =
  | 'receivable'
  | 'payable'

export interface BusinessOpenItem {
  id: string
  businessId: string
  partyId: string
  direction: BusinessOpenItemDirection
  originalAmountChetrum: number
  outstandingAmountChetrum: number
  date: string
  dueDate: string
  reference: string
  note: string
  createdAt: number
  updatedAt: number
}
