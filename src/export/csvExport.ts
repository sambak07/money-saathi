import type {
  BusinessProfile,
  BusinessTransaction,
} from '../types/business'
import type {
  MoneyTransaction,
} from '../types/transaction'

const UTF8_BOM = '\uFEFF'

function assertMoney(
  value: number,
): void {
  if (
    !Number.isSafeInteger(value) ||
    value < 0
  ) {
    throw new Error(
      'CSV money value must be a non-negative safe integer.',
    )
  }
}

export function chetrumToNuText(
  amountChetrum: number,
): string {
  assertMoney(amountChetrum)

  const amount =
    BigInt(amountChetrum)

  const whole =
    amount / 100n

  const fraction =
    (amount % 100n)
      .toString()
      .padStart(2, '0')

  return `${whole.toString()}.${fraction}`
}

function protectSpreadsheetText(
  value: string,
): string {
  let index = 0

  while (
    index < value.length &&
    value.charCodeAt(index) <= 0x20
  ) {
    index += 1
  }

  const firstVisible =
    value[index] ?? ''

  if (
    firstVisible === '=' ||
    firstVisible === '+' ||
    firstVisible === '-' ||
    firstVisible === '@'
  ) {
    return `'${value}`
  }

  return value
}

export function escapeCsvCell(
  value: string | number,
  protectFormula = false,
): string {
  const raw =
    typeof value === 'number'
      ? String(value)
      : protectFormula
        ? protectSpreadsheetText(value)
        : value

  if (
    raw.includes(',') ||
    raw.includes('"') ||
    raw.includes('\n') ||
    raw.includes('\r')
  ) {
    return `"${raw.replace(/"/g, '""')}"`
  }

  return raw
}

function row(
  values: Array<{
    value: string | number
    protectFormula?: boolean
  }>,
): string {
  return values
    .map((item) =>
      escapeCsvCell(
        item.value,
        item.protectFormula ?? false,
      ),
    )
    .join(',')
}

export function buildPersonalTransactionsCsv(
  transactions: MoneyTransaction[],
): string {
  const lines = [
    row([
      { value: 'Date' },
      { value: 'Type' },
      { value: 'Amount (Nu.)' },
      { value: 'Category' },
      { value: 'Note' },
      { value: 'Recurring source ID' },
      { value: 'Scheduled for' },
    ]),
  ]

  for (const transaction of transactions) {
    lines.push(
      row([
        {
          value: transaction.date,
        },
        {
          value: transaction.kind,
        },
        {
          value: chetrumToNuText(
            transaction.amountChetrum,
          ),
        },
        {
          value: transaction.category,
          protectFormula: true,
        },
        {
          value: transaction.note,
          protectFormula: true,
        },
        {
          value:
            transaction.recurringSourceId ?? '',
          protectFormula: true,
        },
        {
          value:
            transaction.scheduledFor ?? '',
        },
      ]),
    )
  }

  return UTF8_BOM + lines.join('\r\n')
}

export function buildBusinessTransactionsCsv(
  business: BusinessProfile,
  transactions: BusinessTransaction[],
): string {
  const lines = [
    row([
      { value: 'Business' },
      { value: 'Date' },
      { value: 'Type' },
      { value: 'Amount (Nu.)' },
      { value: 'Category' },
      { value: 'Note' },
    ]),
  ]

  for (const transaction of transactions) {
    lines.push(
      row([
        {
          value: business.name,
          protectFormula: true,
        },
        {
          value: transaction.date,
        },
        {
          value: transaction.kind,
        },
        {
          value: chetrumToNuText(
            transaction.amountChetrum,
          ),
        },
        {
          value: transaction.category,
          protectFormula: true,
        },
        {
          value: transaction.note,
          protectFormula: true,
        },
      ]),
    )
  }

  return UTF8_BOM + lines.join('\r\n')
}

export function safeExportFileName(
  prefix: string,
  dateText: string,
): string {
  const safePrefix =
    prefix
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) ||
    'money-saathi'

  const safeDate =
    /^\d{4}-\d{2}-\d{2}$/.test(
      dateText,
    )
      ? dateText
      : 'export'

  return `${safePrefix}-${safeDate}.csv`
}
