const MAX_SAFE =
  BigInt(Number.MAX_SAFE_INTEGER)

export interface FinancialSafetyPlan {
  targetMonths: number | null
  averageMonthlyExpenseChetrum: number
  potentiallyLiquidSavingsChetrum: number
  targetChetrum: number | null
  gapChetrum: number | null
  aboveTargetChetrum: number | null
  coverageMonthsTenths: number | null
}

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

export function calculateCoverageMonthsTenths(
  potentiallyLiquidSavingsChetrum: number,
  averageMonthlyExpenseChetrum: number,
): number | null {
  assertMoney(
    potentiallyLiquidSavingsChetrum,
    'Potentially liquid savings',
  )

  assertMoney(
    averageMonthlyExpenseChetrum,
    'Average monthly expense',
  )

  if (averageMonthlyExpenseChetrum === 0) {
    return null
  }

  const result =
    (
      BigInt(
        potentiallyLiquidSavingsChetrum,
      ) *
      10n
    ) /
    BigInt(
      averageMonthlyExpenseChetrum,
    )

  if (result > MAX_SAFE) {
    throw new Error(
      'Emergency coverage exceeds the supported range.',
    )
  }

  return Number(result)
}

export function buildFinancialSafetyPlan(
  averageMonthlyExpenseChetrum: number,
  potentiallyLiquidSavingsChetrum: number,
  targetMonths: number | null,
): FinancialSafetyPlan {
  assertMoney(
    averageMonthlyExpenseChetrum,
    'Average monthly expense',
  )

  assertMoney(
    potentiallyLiquidSavingsChetrum,
    'Potentially liquid savings',
  )

  if (
    targetMonths !== null &&
    (
      !Number.isSafeInteger(targetMonths) ||
      targetMonths <= 0 ||
      targetMonths > 24
    )
  ) {
    throw new Error(
      'Target months must be between 1 and 24.',
    )
  }

  const coverageMonthsTenths =
    calculateCoverageMonthsTenths(
      potentiallyLiquidSavingsChetrum,
      averageMonthlyExpenseChetrum,
    )

  if (
    targetMonths === null ||
    averageMonthlyExpenseChetrum === 0
  ) {
    return {
      targetMonths,
      averageMonthlyExpenseChetrum,
      potentiallyLiquidSavingsChetrum,
      targetChetrum: null,
      gapChetrum: null,
      aboveTargetChetrum: null,
      coverageMonthsTenths,
    }
  }

  const target =
    BigInt(
      averageMonthlyExpenseChetrum,
    ) *
    BigInt(targetMonths)

  if (target > MAX_SAFE) {
    throw new Error(
      'Emergency target exceeds the supported money range.',
    )
  }

  const savings =
    BigInt(
      potentiallyLiquidSavingsChetrum,
    )

  const gap =
    target > savings
      ? target - savings
      : 0n

  const above =
    savings > target
      ? savings - target
      : 0n

  return {
    targetMonths,
    averageMonthlyExpenseChetrum,
    potentiallyLiquidSavingsChetrum,
    targetChetrum: Number(target),
    gapChetrum: Number(gap),
    aboveTargetChetrum: Number(above),
    coverageMonthsTenths,
  }
}

export function formatCoverageTenths(
  tenths: number | null,
): string {
  if (tenths === null) {
    return 'Not enough expense history'
  }

  const whole =
    Math.trunc(tenths / 10)

  const fraction =
    tenths % 10

  return `${whole}.${fraction} months`
}
