const MAX_SAFE_CHETRUM = Number.MAX_SAFE_INTEGER

export function toChetrum(value: string | number): number {
  const text = typeof value === 'number' ? String(value) : value.replace(/,/g, '').trim()
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) throw new Error('Enter a valid amount with up to two decimal places.')
  const [whole, fraction = ''] = text.split('.')
  const chetrum = Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
  if (!Number.isSafeInteger(chetrum) || chetrum < 0 || chetrum > MAX_SAFE_CHETRUM) throw new Error('Amount is too large.')
  return chetrum
}

export function fromChetrum(value: number): number { return value / 100 }

export function formatCurrency(value: number): string {
  const fractionDigits = value % 100 === 0 ? 0 : 2
  return `Nu. ${fromChetrum(value).toLocaleString('en-IN', { minimumFractionDigits: fractionDigits, maximumFractionDigits: 2 })}`
}
