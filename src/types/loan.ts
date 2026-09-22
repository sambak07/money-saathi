export interface Loan {
  id: string
  name: string
  lender: string
  originalPrincipalChetrum: number
  outstandingPrincipalChetrum: number
  annualRateBps: number
  emiChetrum: number
  tenureMonths: number
  startDate: string
  note: string
  createdAt: number
  updatedAt: number
}
