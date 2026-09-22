export function parseNuToChetrum(value: string): number | null {
  const cleaned = value.replace(/,/g, '').trim()

  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) {
    return null
  }

  const numericValue = Number(cleaned)

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return null
  }

  const chetrum = Math.round(numericValue * 100)

  if (!Number.isSafeInteger(chetrum)) {
    return null
  }

  return chetrum
}

export function formatNu(amountChetrum: number): string {
  const ngultrum = amountChetrum / 100

  return `Nu. ${ngultrum.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function getLocalToday(): string {
  const now = new Date()

  const localDate = new Date(
    now.getTime() - now.getTimezoneOffset() * 60_000,
  )

  return localDate.toISOString().slice(0, 10)
}

export function isCurrentMonth(date: string): boolean {
  const today = getLocalToday()

  return date.slice(0, 7) === today.slice(0, 7)
}
