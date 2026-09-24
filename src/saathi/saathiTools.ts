import type {
  SavingsAccount,
} from '../types/asset'
import type {
  Loan,
} from '../types/loan'
import type {
  MoneyTransaction,
} from '../types/transaction'

const MAX_SAFE =
  BigInt(
    Number.MAX_SAFE_INTEGER,
  )

export interface AffordabilityResult {
  amountChetrum: number
  safeToSpendChetrum: number
  remainingChetrum: number
  status:
    | 'within'
    | 'above'
    | 'none'
}

export interface MonthMovement {
  month: string
  incomeChetrum: number
  expenseChetrum: number
  netChetrum: number
}

export interface MonthComparison {
  current: MonthMovement
  previous: MonthMovement
  incomeChangeChetrum: number
  expenseChangeChetrum: number
  netChangeChetrum: number
}

export interface DebtSnapshot {
  loanCount: number
  outstandingPrincipalChetrum: number
  monthlyEmiChetrum: number
  liquidSavingsChetrum: number
  principalLessLiquidSavingsChetrum: number
}

export interface AttentionInput {
  safeToSpendChetrum: number
  upcomingCommitmentsChetrum: number
  safetyBufferChetrum: number
  currentMonthIncomeChetrum: number
  currentMonthExpenseChetrum: number
  outstandingLoanChetrum: number
  transactionCount: number
}

export interface AttentionItem {
  id: string
  priority:
    | 'attention'
    | 'review'
    | 'info'
  title: string
  explanation: string
}

function assertMoney(
  value: number,
  label: string,
): void {
  if (
    !Number.isSafeInteger(
      value,
    )
  ) {
    throw new Error(
      `${label} must be a safe integer.`,
    )
  }
}

function addNonNegativeMoney(
  total: bigint,
  value: number,
  label: string,
): bigint {
  assertMoney(
    value,
    label,
  )

  if (
    value < 0
  ) {
    throw new Error(
      `${label} cannot be negative.`,
    )
  }

  const next =
    total +
    BigInt(value)

  if (
    next >
    MAX_SAFE
  ) {
    throw new Error(
      `${label} total exceeds the supported money range.`,
    )
  }

  return next
}

export function assessAffordability(
  amountChetrum: number,
  safeToSpendChetrum: number,
): AffordabilityResult {
  assertMoney(
    amountChetrum,
    'Scenario amount',
  )

  assertMoney(
    safeToSpendChetrum,
    'Safe to Spend',
  )

  if (
    amountChetrum < 0 ||
    safeToSpendChetrum < 0
  ) {
    throw new Error(
      'Affordability values cannot be negative.',
    )
  }

  if (
    safeToSpendChetrum === 0
  ) {
    return {
      amountChetrum,
      safeToSpendChetrum,
      remainingChetrum: 0,
      status: 'none',
    }
  }

  const remaining =
    BigInt(
      safeToSpendChetrum,
    ) -
    BigInt(
      amountChetrum,
    )

  if (
    remaining < 0n
  ) {
    return {
      amountChetrum,
      safeToSpendChetrum,
      remainingChetrum:
        Number(remaining),
      status: 'above',
    }
  }

  return {
    amountChetrum,
    safeToSpendChetrum,
    remainingChetrum:
      Number(remaining),
    status: 'within',
  }
}

function previousMonth(
  month: string,
): string {
  const [
    year,
    monthNumber,
  ] =
    month
      .split('-')
      .map(Number)

  const date =
    new Date(
      Date.UTC(
        year,
        monthNumber - 2,
        1,
      ),
    )

  return date
    .toISOString()
    .slice(0, 7)
}

function summarizeMonth(
  month: string,
  transactions: MoneyTransaction[],
): MonthMovement {
  let income = 0n
  let expense = 0n

  for (
    const transaction of transactions
  ) {
    if (
      transaction.date.slice(
        0,
        7,
      ) !== month
    ) {
      continue
    }

    if (
      transaction.kind ===
      'income'
    ) {
      income =
        addNonNegativeMoney(
          income,
          transaction.amountChetrum,
          'Monthly income',
        )
    } else {
      expense =
        addNonNegativeMoney(
          expense,
          transaction.amountChetrum,
          'Monthly expense',
        )
    }
  }

  return {
    month,
    incomeChetrum:
      Number(income),
    expenseChetrum:
      Number(expense),
    netChetrum:
      Number(
        income -
        expense,
      ),
  }
}

export function compareRecordedMonths(
  currentMonth: string,
  transactions: MoneyTransaction[],
): MonthComparison {
  const current =
    summarizeMonth(
      currentMonth,
      transactions,
    )

  const previous =
    summarizeMonth(
      previousMonth(
        currentMonth,
      ),
      transactions,
    )

  return {
    current,
    previous,
    incomeChangeChetrum:
      current.incomeChetrum -
      previous.incomeChetrum,
    expenseChangeChetrum:
      current.expenseChetrum -
      previous.expenseChetrum,
    netChangeChetrum:
      current.netChetrum -
      previous.netChetrum,
  }
}

export function buildDebtSnapshot(
  loans: Loan[],
  savingsAccounts: SavingsAccount[],
): DebtSnapshot {
  let principal = 0n
  let emi = 0n
  let savings = 0n

  for (
    const loan of loans
  ) {
    principal =
      addNonNegativeMoney(
        principal,
        loan.outstandingPrincipalChetrum,
        'Outstanding loan principal',
      )

    emi =
      addNonNegativeMoney(
        emi,
        loan.emiChetrum,
        'Loan EMI',
      )
  }

  for (
    const account of savingsAccounts
  ) {
    savings =
      addNonNegativeMoney(
        savings,
        account.balanceChetrum,
        'Savings balance',
      )
  }

  const principalLessSavings =
    principal -
    savings

  if (
    principalLessSavings >
      MAX_SAFE ||
    principalLessSavings <
      -MAX_SAFE
  ) {
    throw new Error(
      'Debt comparison exceeds the supported money range.',
    )
  }

  return {
    loanCount:
      loans.length,
    outstandingPrincipalChetrum:
      Number(principal),
    monthlyEmiChetrum:
      Number(emi),
    liquidSavingsChetrum:
      Number(savings),
    principalLessLiquidSavingsChetrum:
      Number(
        principalLessSavings,
      ),
  }
}

export function buildAttentionItems(
  input: AttentionInput,
): AttentionItem[] {
  const items:
    AttentionItem[] = []

  if (
    input.transactionCount ===
    0
  ) {
    items.push({
      id: 'no-transactions',
      priority: 'info',
      title:
        'There are not enough recorded transactions yet',
      explanation:
        'Money Saathi can only reason from the information you record. Add real money activity before relying on trends.',
    })
  }

  if (
    input.safeToSpendChetrum ===
    0
  ) {
    items.push({
      id: 'no-safe-room',
      priority: 'attention',
      title:
        'No positive Safe to Spend is currently recorded',
      explanation:
        'Known commitments and the safety buffer currently use the available planning room. Review them before optional spending.',
    })
  }

  if (
    input.upcomingCommitmentsChetrum >
    0
  ) {
    items.push({
      id: 'commitments',
      priority: 'review',
      title:
        'Upcoming commitments need room',
      explanation:
        'Regular expenses are due inside the current Safe to Spend planning horizon.',
    })
  }

  if (
    input.safetyBufferChetrum ===
    0
  ) {
    items.push({
      id: 'no-buffer',
      priority: 'review',
      title:
        'No safety buffer is currently set',
      explanation:
        'A buffer does not need to start large, but setting one helps keep emergency money out of everyday spending.',
    })
  }

  if (
    input.currentMonthIncomeChetrum >
      0 &&
    input.currentMonthExpenseChetrum >
      input.currentMonthIncomeChetrum
  ) {
    items.push({
      id: 'outflow-above-inflow',
      priority: 'review',
      title:
        'Recorded expenses are above recorded income this month',
      explanation:
        'This may be timing or a one-off event. Review the largest expenses before treating it as a long-term pattern.',
    })
  }

  if (
    input.outstandingLoanChetrum >
    0
  ) {
    items.push({
      id: 'debt-visible',
      priority: 'info',
      title:
        'Recorded debt is part of the current picture',
      explanation:
        'Loan balances matter alongside cash, savings and upcoming commitments. Money Saathi does not assume that faster repayment is always best.',
    })
  }

  if (
    items.length === 0
  ) {
    items.push({
      id: 'nothing-urgent',
      priority: 'info',
      title:
        'No obvious local warning is visible from these records',
      explanation:
        'That does not guarantee everything is covered. Missing or outdated records can change the picture.',
    })
  }

  return items
}