export interface Goal {
  id: string
  name: string
  targetChetrum: number
  targetDate: string
  note: string
  createdAt: number
  updatedAt: number
}

export interface GoalContribution {
  id: string
  goalId: string
  amountChetrum: number
  date: string
  note: string
  createdAt: number
}
