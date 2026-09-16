export function toChetrum(value: string | number): number {
  const normalized = typeof value === 'number' ? value : Number(value.replace(/,/g, '').trim())
  if (!Number.isFinite(normalized) || normalized < 0) throw new Error('Amount must be a non-negative number')
  return Math.round(normalized * 100)
}

export function fromChetrum(value: number): number { return value / 100 }

export function formatCurrency(value: number): string {
  const fractionDigits = value % 100 === 0 ? 0 : 2
  return `Nu. ${fromChetrum(value).toLocaleString('en-IN', { minimumFractionDigits: fractionDigits, maximumFractionDigits: 2 })}`
}
