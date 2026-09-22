export type MoneySignalKind =
  | 'today'
  | 'pattern'
  | 'safety'
  | 'debt'
  | 'goal'
  | 'income-rhythm'

export interface MoneySignal {
  id: string
  kind: MoneySignalKind
  title: string
  explanation: string
}

export interface ExplainMoneyInputs {
  recordedBalanceChetrum: number
  safeToSpendChetrum: number
  upcomingCommitmentsChetrum: number
  safetyBufferChetrum: number
  currentMonthIncomeChetrum: number
  currentMonthExpenseChetrum: number
  liquidSavingsChetrum: number
  averageMonthlyExpenseChetrum: number
  emergencyCoverageMonthsTenths: number | null
  outstandingLoanChetrum: number
  goalCount: number
  irregularIncomeSelected: boolean
}

const MAX_SAFE =
  BigInt(Number.MAX_SAFE_INTEGER)

function assertMoney(
  value: number,
  label: string,
): void {
  if (
    !Number.isSafeInteger(value) ||
    value < 0
  ) {
    throw new Error(
      `${label} must be a non-negative safe integer.`,
    )
  }
}

export function sumSafeChetrum(
  values: number[],
  label: string,
): number {
  let total = 0n

  for (const value of values) {
    assertMoney(value, label)

    total += BigInt(value)

    if (total > MAX_SAFE) {
      throw new Error(
        `${label} exceeds the supported money range.`,
      )
    }
  }

  return Number(total)
}

export function buildMoneySignals(
  inputs: ExplainMoneyInputs,
): MoneySignal[] {
  const nonNegativeMoney: Array<
    [string, number]
  > = [
    [
      'Safe to Spend',
      inputs.safeToSpendChetrum,
    ],
    [
      'Upcoming commitments',
      inputs.upcomingCommitmentsChetrum,
    ],
    [
      'Safety buffer',
      inputs.safetyBufferChetrum,
    ],
    [
      'Current month income',
      inputs.currentMonthIncomeChetrum,
    ],
    [
      'Current month expense',
      inputs.currentMonthExpenseChetrum,
    ],
    [
      'Liquid savings',
      inputs.liquidSavingsChetrum,
    ],
    [
      'Average monthly expense',
      inputs.averageMonthlyExpenseChetrum,
    ],
    [
      'Outstanding loan',
      inputs.outstandingLoanChetrum,
    ],
  ]

  for (const [label, value] of nonNegativeMoney) {
    assertMoney(value, label)
  }

  if (
    !Number.isSafeInteger(
      inputs.recordedBalanceChetrum,
    )
  ) {
    throw new Error(
      'Recorded balance must be a safe integer.',
    )
  }

  if (
    !Number.isSafeInteger(inputs.goalCount) ||
    inputs.goalCount < 0
  ) {
    throw new Error(
      'Goal count must be a non-negative safe integer.',
    )
  }

  const signals: MoneySignal[] = []

  signals.push({
    id: 'today-safe-to-spend',
    kind: 'today',
    title:
      inputs.upcomingCommitmentsChetrum > 0 ||
      inputs.safetyBufferChetrum > 0
        ? 'Your spendable amount is lower than your recorded balance for a reason'
        : 'Safe to Spend currently follows your recorded balance',
    explanation:
      inputs.upcomingCommitmentsChetrum > 0 ||
      inputs.safetyBufferChetrum > 0
        ? 'Money Saathi is keeping upcoming Regular Money expenses and your protected safety buffer outside Safe to Spend.'
        : 'There are no recorded upcoming commitments or protected buffer reducing Safe to Spend right now.',
  })

  if (
    inputs.currentMonthIncomeChetrum === 0 &&
    inputs.currentMonthExpenseChetrum === 0
  ) {
    signals.push({
      id: 'month-no-activity',
      kind: 'pattern',
      title:
        'There is no recorded money movement this month yet',
      explanation:
        'This can simply mean the month has not been recorded yet. Money Saathi does not treat missing records as zero real-world activity.',
    })
  } else if (
    inputs.currentMonthIncomeChetrum >=
    inputs.currentMonthExpenseChetrum
  ) {
    signals.push({
      id: 'month-positive',
      kind: 'pattern',
      title:
        'Recorded money in is at least as high as money out this month',
      explanation:
        'This describes recorded cash flow for the current calendar month only. It does not measure wealth or guarantee the same pattern next month.',
    })
  } else {
    signals.push({
      id: 'month-negative',
      kind: 'pattern',
      title:
        'Recorded money out is higher than money in this month',
      explanation:
        'One month can be unusual. Reviewing several months can help distinguish a temporary expense from a repeating pattern.',
    })
  }

  if (
    inputs.averageMonthlyExpenseChetrum === 0
  ) {
    signals.push({
      id: 'safety-history',
      kind: 'safety',
      title:
        'There is not enough recorded expense history to estimate emergency coverage',
      explanation:
        'Money Saathi avoids inventing a coverage number when recent recorded expenses are zero.',
    })
  } else if (
    inputs.emergencyCoverageMonthsTenths !== null
  ) {
    signals.push({
      id: 'safety-coverage',
      kind: 'safety',
      title:
        'Your Savings Account balances can be compared with recent recorded expenses',
      explanation:
        'This is potential liquidity only. Savings may already be reserved for education, family obligations or another purpose.',
    })
  }

  if (inputs.outstandingLoanChetrum > 0) {
    signals.push({
      id: 'loan-principal',
      kind: 'debt',
      title:
        'You have outstanding loan principal recorded',
      explanation:
        'Money Saathi treats the outstanding principal you entered as debt. It does not automatically reduce the balance from EMI payments because an EMI can contain both principal and interest.',
    })
  }

  if (inputs.goalCount > 0) {
    signals.push({
      id: 'goals',
      kind: 'goal',
      title:
        inputs.goalCount === 1
          ? 'You are tracking one financial goal'
          : `You are tracking ${inputs.goalCount} financial goals`,
      explanation:
        'Goal progress stays separate from tracked assets so the same money is not counted twice.',
    })
  }

  if (inputs.irregularIncomeSelected) {
    signals.push({
      id: 'irregular-income',
      kind: 'income-rhythm',
      title:
        'Your setup says income may be irregular',
      explanation:
        'Money Saathi can show historical income rhythm and your own planning floor, but it does not forecast future income or add expected income to Safe to Spend.',
    })
  }

  return signals
}

export function buildMoneyQuestions(
  inputs: ExplainMoneyInputs,
): string[] {
  const questions: string[] = []

  if (inputs.safetyBufferChetrum === 0) {
    questions.push(
      'Would protecting a small amount before spending make your plan feel safer?',
    )
  }

  if (
    inputs.currentMonthExpenseChetrum >
    inputs.currentMonthIncomeChetrum
  ) {
    questions.push(
      'Is this month unusually expensive, or is the same pattern appearing repeatedly?',
    )
  }

  if (
    inputs.averageMonthlyExpenseChetrum > 0 &&
    inputs.liquidSavingsChetrum === 0
  ) {
    questions.push(
      'Do you have liquid savings that have not yet been recorded in Money Saathi?',
    )
  }

  if (inputs.outstandingLoanChetrum > 0) {
    questions.push(
      'Is the outstanding principal on each recorded loan still up to date?',
    )
  }

  if (inputs.irregularIncomeSelected) {
    questions.push(
      'Would your own monthly planning floor help you plan during quieter income months?',
    )
  }

  if (questions.length === 0) {
    questions.push(
      'Are the balances and commitments in Money Saathi still current?',
    )
  }

  return questions
}
