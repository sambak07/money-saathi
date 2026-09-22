export interface SavingsAccount {
  id: string
  name: string
  balanceChetrum: number
  note: string
  createdAt: number
  updatedAt: number
}

export interface FixedDeposit {
  id: string
  name: string
  principalChetrum: number
  annualRateBps: number
  tenureMonths: number
  startDate: string
  note: string
  createdAt: number
  updatedAt: number
}

export interface RecurringDeposit {
  id: string
  name: string
  installmentChetrum: number
  annualRateBps: number
  tenureMonths: number
  installmentsPaid: number
  startDate: string
  note: string
  createdAt: number
  updatedAt: number
}
