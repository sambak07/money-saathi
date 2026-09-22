export type SchemeCategory =
  | 'provident-fund'
  | 'annuity'
  | 'endowment'
  | 'education'
  | 'hybrid-insurance'
  | 'other'

export type SchemeFrequency =
  | 'monthly'
  | 'quarterly'
  | 'half-yearly'
  | 'yearly'
  | 'irregular'
  | 'none'

export type SchemeStatus =
  | 'active'
  | 'paused'
  | 'matured'
  | 'closed'

export interface FinancialScheme {
  id: string
  name: string
  provider: string
  category: SchemeCategory
  status: SchemeStatus
  contributionChetrum: number
  contributionFrequency: SchemeFrequency
  currentValueChetrum: number
  protectionCoverChetrum: number
  futureBenefitChetrum: number
  startDate: string
  nextContributionDate: string
  maturityDate: string
  note: string
  createdAt: number
  updatedAt: number
}
