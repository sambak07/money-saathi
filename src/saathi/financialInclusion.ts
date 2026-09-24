import type {
  MoneyNeed,
} from '../profile/userProfile'

export interface SaathiInclusionSnapshot {
  needs: MoneyNeed[]
  transactionCount: number
  recordedBalanceChetrum: number
  safeToSpendChetrum: number
  upcomingCommitmentsChetrum: number
  safetyBufferChetrum: number
  currentMonthIncomeChetrum: number
  currentMonthExpenseChetrum: number
  liquidSavingsChetrum: number
  outstandingLoanChetrum: number
  goalCount: number
  nextExpectedIncomeDate: string | null
  horizonDate: string
}

export type SaathiGuidanceKind =
  | 'understand'
  | 'plan'
  | 'learn'
  | 'protect'

export interface SaathiGuidance {
  id: string
  kind: SaathiGuidanceKind
  title: string
  explanation: string
  action?: string
}

function hasNeed(
  snapshot: SaathiInclusionSnapshot,
  need: MoneyNeed,
): boolean {
  return snapshot.needs.includes(need)
}

export function buildSaathiGuidance(
  snapshot: SaathiInclusionSnapshot,
): SaathiGuidance[] {
  const guidance: SaathiGuidance[] = []

  if (snapshot.transactionCount === 0) {
    guidance.push({
      id: 'start-recording',
      kind: 'understand',
      title: 'Start with what actually happens',
      explanation:
        'Record a few days of real money in and money out before trying to optimize anything. Guidance becomes more useful when it is based on your own records.',
      action:
        'Start with one week. You do not need to build a perfect history.',
    })
  }

  if (snapshot.safeToSpendChetrum === 0) {
    guidance.push({
      id: 'safe-to-spend-zero',
      kind: 'plan',
      title: 'Protect essentials before adding new spending',
      explanation:
        'After the commitments and safety buffer currently recorded in Money Saathi, there is no positive Safe to Spend amount for this planning window.',
      action:
        'Review upcoming commitments and the safety buffer before taking on optional spending.',
    })
  } else {
    guidance.push({
      id: 'safe-to-spend-positive',
      kind: 'understand',
      title: 'Safe to Spend is your planning room, not your bank balance',
      explanation:
        'Money Saathi separates your recorded balance from the amount left after upcoming commitments and your chosen safety buffer.',
      action:
        'Use Safe to Spend for optional decisions instead of treating the full recorded balance as available.',
    })
  }

  if (
    snapshot.upcomingCommitmentsChetrum > 0
  ) {
    guidance.push({
      id: 'commitments-coming',
      kind: 'plan',
      title: 'Money is already spoken for',
      explanation:
        'Some recorded regular expenses fall inside the current planning horizon. Money Saathi keeps them out of Safe to Spend even before they are recorded as paid.',
      action:
        'Check Upcoming before making a large discretionary purchase.',
    })
  }

  if (
    snapshot.safetyBufferChetrum === 0
  ) {
    guidance.push({
      id: 'no-safety-buffer',
      kind: 'learn',
      title: 'A safety buffer does not need to start large',
      explanation:
        'A buffer is simply money you decide not to treat as available for everyday spending. It can begin small and grow with your situation.',
      action:
        'Choose a realistic first buffer rather than copying a fixed percentage.',
    })
  }

  if (
    hasNeed(
      snapshot,
      'student',
    )
  ) {
    guidance.push({
      id: 'student-first-money',
      kind: 'learn',
      title: 'Learn with small real amounts',
      explanation:
        'You do not need a high income to build money skills. Tracking a small allowance, scholarship, stipend or first salary can teach the same core habits.',
      action:
        'Focus first on essentials, a small reserve and avoiding expensive borrowing.',
    })

    guidance.push({
      id: 'student-digital-safety',
      kind: 'protect',
      title: 'Treat OTPs and payment credentials as secrets',
      explanation:
        'Money Saathi will never need your card PIN, CVV, OTP, banking password, seed phrase or recovery code to help you understand money.',
      action:
        'If anyone asks for those details to “help” with an account or payment, stop and verify independently.',
    })
  }

  if (
    hasNeed(
      snapshot,
      'irregular-income',
    )
  ) {
    guidance.push({
      id: 'irregular-income-reality',
      kind: 'plan',
      title: 'Do not budget from income that has not arrived',
      explanation:
        'When income is uneven, future earnings can be uncertain. Money Saathi should plan from recorded money and known commitments first.',
      action:
        'Use stronger buffers in good months instead of assuming every month will repeat them.',
    })
  }

  if (
    hasNeed(
      snapshot,
      'salary',
    ) &&
    snapshot.nextExpectedIncomeDate
  ) {
    guidance.push({
      id: 'salary-horizon',
      kind: 'plan',
      title: 'Plan until the next expected income',
      explanation:
        'Your Safe to Spend horizon ends at the next expected regular income currently recorded in Money Saathi.',
      action:
        'Check whether all major expenses due before that date are represented.',
    })
  }

  if (
    hasNeed(
      snapshot,
      'small-business',
    )
  ) {
    guidance.push({
      id: 'business-separation',
      kind: 'protect',
      title: 'Keep business and household money separate',
      explanation:
        'Business cash coming in is not automatically personal income, and positive business cash flow is not automatically accounting profit.',
      action:
        'Use the Business workspace for business money and move only deliberate personal amounts into household planning.',
    })
  }

  if (
    hasNeed(
      snapshot,
      'retirement',
    )
  ) {
    guidance.push({
      id: 'retirement-liquidity',
      kind: 'plan',
      title: 'Liquidity matters as much as total assets',
      explanation:
        'Deposits, pensions and long-term assets may support your financial position, but everyday commitments are paid from money that is actually available when needed.',
      action:
        'Keep near-term living costs and known commitments visible separately from longer-term assets.',
    })
  }

  if (
    snapshot.outstandingLoanChetrum > 0
  ) {
    guidance.push({
      id: 'loan-balance',
      kind: 'understand',
      title: 'Debt deserves its own view',
      explanation:
        'Outstanding loan principal is part of your financial position, but Money Saathi does not assume that paying debt faster is always the right move.',
      action:
        'Compare debt cost, emergency cash and upcoming commitments before deciding on prepayment.',
    })
  }

  if (
    snapshot.currentMonthExpenseChetrum >
    snapshot.currentMonthIncomeChetrum &&
    snapshot.currentMonthIncomeChetrum > 0
  ) {
    guidance.push({
      id: 'month-outflow',
      kind: 'understand',
      title: 'This month has recorded more outflow than inflow',
      explanation:
        'That can happen for many legitimate reasons. The useful question is whether it reflects a one-off event, timing difference or a pattern that needs attention.',
      action:
        'Review the largest expenses before cutting small essentials automatically.',
    })
  }

  if (
    snapshot.liquidSavingsChetrum === 0
  ) {
    guidance.push({
      id: 'savings-not-recorded',
      kind: 'learn',
      title: 'Recorded savings improve the picture',
      explanation:
        'Money Saathi currently has no Savings Account balance available to this guidance snapshot. That does not mean you have no savings outside the app.',
      action:
        'Add savings only if you want them included in your financial picture.',
    })
  }

  guidance.push({
    id: 'scam-rule',
    kind: 'protect',
    title: 'Urgency is not proof',
    explanation:
      'Fraud often uses urgency, fear or promises of easy money. A message can look professional and still be false.',
    action:
      'Verify payment requests through a trusted channel you already know before sending money or sharing credentials.',
  })

  return guidance
}

export const SAATHI_LEARNING_TOPICS = [
  {
    id: 'budget',
    title: 'Budget',
    explanation:
      'A plan for where money should go. It is not a punishment and does not need to be perfect.',
  },
  {
    id: 'buffer',
    title: 'Safety buffer',
    explanation:
      'Money deliberately kept outside everyday spending so one surprise does not immediately become debt.',
  },
  {
    id: 'emi',
    title: 'EMI',
    explanation:
      'A regular loan payment. The payment amount is not the same thing as the remaining loan balance.',
  },
  {
    id: 'interest',
    title: 'Interest',
    explanation:
      'The price of borrowing money or the return paid on some savings. Rate, time and calculation method all matter.',
  },
  {
    id: 'insurance',
    title: 'Insurance',
    explanation:
      'Protection against specified financial risks. Premium paid is not the same thing as savings or investment value.',
  },
  {
    id: 'fd',
    title: 'Fixed deposit',
    explanation:
      'Money placed for an agreed period at stated terms. Early closure can change the interest actually received.',
  },
  {
    id: 'diversification',
    title: 'Diversification',
    explanation:
      'Not relying on one asset, investment or income source for everything. It reduces concentration, not all risk.',
  },
  {
    id: 'digital-safety',
    title: 'Digital money safety',
    explanation:
      'OTP, PIN, CVV, password, seed phrase and recovery code are authentication secrets. Money Saathi does not need them.',
  },
] as const