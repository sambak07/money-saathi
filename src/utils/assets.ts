const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER)

function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate()
}

function safeBigIntToNumber(value: bigint): number {
  if (value > MAX_SAFE || value < -MAX_SAFE) {
    throw new Error('Calculated amount is too large to store safely.')
  }

  return Number(value)
}

export function parsePercentToBasisPoints(
  value: string,
): number | null {
  const cleaned = value.trim()

  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) {
    return null
  }

  const [wholePart, decimalPart = ''] = cleaned.split('.')
  const whole = Number(wholePart)

  if (!Number.isSafeInteger(whole) || whole > 100) {
    return null
  }

  const decimals = Number(decimalPart.padEnd(2, '0') || '0')
  const basisPoints = whole * 100 + decimals

  if (!Number.isSafeInteger(basisPoints) || basisPoints > 10_000) {
    return null
  }

  return basisPoints
}

export function formatRateBps(rateBps: number): string {
  const whole = Math.floor(rateBps / 100)
  const decimals = String(rateBps % 100).padStart(2, '0')
  return `${whole}.${decimals}%`
}

export function calculateMaturityDate(
  startDate: string,
  tenureMonths: number,
): string {
  const anchor = parseLocalDate(startDate)
  const targetMonthIndex = anchor.getMonth() + tenureMonths

  const year =
    anchor.getFullYear() + Math.floor(targetMonthIndex / 12)

  const month = ((targetMonthIndex % 12) + 12) % 12

  const day = Math.min(
    anchor.getDate(),
    daysInMonth(year, month),
  )

  return formatLocalDate(new Date(year, month, day))
}

export function estimateSimpleFdInterestChetrum(
  principalChetrum: number,
  annualRateBps: number,
  tenureMonths: number,
): number {
  const numerator =
    BigInt(principalChetrum) *
    BigInt(annualRateBps) *
    BigInt(tenureMonths)

  const denominator = 120_000n

  const rounded =
    (numerator + denominator / 2n) /
    denominator

  return safeBigIntToNumber(rounded)
}

export function multiplyChetrum(
  amountChetrum: number,
  count: number,
): number {
  return safeBigIntToNumber(
    BigInt(amountChetrum) * BigInt(count),
  )
}

export function formatAssetDate(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parseLocalDate(value))
}
