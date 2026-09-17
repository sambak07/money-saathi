const MAX_SAFE_CHETRUM = Number.MAX_SAFE_INTEGER

export function toChetrum(value: string | number): number {
  const text = typeof value === 'number' ? String(value) : value.trim()
  const validGrouping = /^(?:\d+|\d{1,3}(?:,\d{2})*,\d{3}|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(text)
  if (!validGrouping) throw new Error('Enter a valid amount with up to two decimal places.')
  const normalized = text.replaceAll(',', '')
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) throw new Error('Enter a valid amount with up to two decimal places.')
  const [whole, fraction = ''] = normalized.split('.')
  const chetrum = Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
  if (!Number.isSafeInteger(chetrum) || chetrum < 0 || chetrum > MAX_SAFE_CHETRUM) throw new Error('Amount is too large.')
  return chetrum
}

export function safeToChetrum(value: string | number): { value?: number; error?: string } {
  try { return { value: toChetrum(value) } } catch (error) { return { error: error instanceof Error ? error.message : 'Enter a valid amount.' } }
}

export function fromChetrum(value: number): number { return value / 100 }

export function formatCurrency(value: number): string {
  const fractionDigits = value % 100 === 0 ? 0 : 2
  return `Nu. ${fromChetrum(value).toLocaleString('en-IN', { minimumFractionDigits: fractionDigits, maximumFractionDigits: 2 })}`
}
