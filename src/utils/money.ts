const MAX_SAFE_MONEY = BigInt(Number.MAX_SAFE_INTEGER)

function parseMoneyString(
  value: string,
  allowZero: boolean,
): number | null {
  const cleaned = value.replace(/,/g, '').trim()

  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) {
    return null
  }

  const [wholePart, decimalPart = ''] = cleaned.split('.')

  const wholeChetrum = BigInt(wholePart) * 100n

  const decimalChetrum = BigInt(
    decimalPart.padEnd(2, '0') || '0',
  )

  const total = wholeChetrum + decimalChetrum

  if (total > MAX_SAFE_MONEY) {
    return null
  }

  if (!allowZero && total === 0n) {
    return null
  }

  return Number(total)
}

export function parseNuToChetrum(
  value: string,
): number | null {
  return parseMoneyString(value, false)
}

export function parseNuToChetrumAllowZero(
  value: string,
): number | null {
  return parseMoneyString(value, true)
}

export function formatNu(
  amountChetrum: number,
): string {
  if (!Number.isSafeInteger(amountChetrum)) {
    return 'Nu. —'
  }

  const negative = amountChetrum < 0
  const absolute = Math.abs(amountChetrum)

  const whole = Math.floor(absolute / 100)
  const decimals = String(absolute % 100).padStart(2, '0')

  return `Nu. ${negative ? '-' : ''}${whole.toLocaleString(
    'en-IN',
  )}.${decimals}`
}

export function formatChetrumForInput(
  amountChetrum: number,
): string {
  if (!Number.isSafeInteger(amountChetrum)) {
    return ''
  }

  const negative = amountChetrum < 0
  const absolute = Math.abs(amountChetrum)

  const whole = Math.floor(absolute / 100)
  const decimals = String(absolute % 100).padStart(2, '0')

  return `${negative ? '-' : ''}${whole}.${decimals}`
}

export function getLocalToday(): string {
  const now = new Date()

  const localDate = new Date(
    now.getTime() - now.getTimezoneOffset() * 60_000,
  )

  return localDate.toISOString().slice(0, 10)
}

export function isCurrentMonth(
  date: string,
): boolean {
  return date.slice(0, 7) === getLocalToday().slice(0, 7)
}

