import type {
  FinancialScheme,
  SchemeCategory,
  SchemeFrequency,
  SchemeStatus,
} from '../types/scheme'

const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER)

function safeBigIntToNumber(value: bigint): number {
  if (value > MAX_SAFE || value < -MAX_SAFE) {
    throw new Error('Calculated amount is too large to store safely.')
  }

  return Number(value)
}

export function getSchemeCategoryLabel(
  category: SchemeCategory,
): string {
  if (category === 'provident-fund') return 'Provident fund'
  if (category === 'annuity') return 'Annuity / retirement'
  if (category === 'endowment') return 'Endowment / savings plan'
  if (category === 'education') return 'Education / child plan'
  if (category === 'hybrid-insurance') {
    return 'Savings + protection'
  }

  return 'Other scheme'
}

export function getSchemeFrequencyLabel(
  frequency: SchemeFrequency,
): string {
  if (frequency === 'monthly') return 'Monthly'
  if (frequency === 'quarterly') return 'Quarterly'
  if (frequency === 'half-yearly') return 'Half-yearly'
  if (frequency === 'yearly') return 'Yearly'
  if (frequency === 'irregular') return 'Irregular'

  return 'No recurring contribution'
}

export function getSchemeStatusLabel(
  status: SchemeStatus,
): string {
  if (status === 'active') return 'Active'
  if (status === 'paused') return 'Paused'
  if (status === 'matured') return 'Matured'

  return 'Closed'
}

export function annualContributionChetrum(
  scheme: FinancialScheme,
): number {
  const multiplier =
    scheme.contributionFrequency === 'monthly'
      ? 12
      : scheme.contributionFrequency === 'quarterly'
        ? 4
        : scheme.contributionFrequency === 'half-yearly'
          ? 2
          : scheme.contributionFrequency === 'yearly'
            ? 1
            : 0

  return safeBigIntToNumber(
    BigInt(scheme.contributionChetrum) *
      BigInt(multiplier),
  )
}

export function formatSchemeDate(
  value: string,
): string {
  if (!value) return 'Not set'

  const [year, month, day] = value
    .split('-')
    .map(Number)

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(year, month - 1, day))
}
