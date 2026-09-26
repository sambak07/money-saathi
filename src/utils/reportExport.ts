import type {
  MoneyTransaction,
} from '../types/transaction'

function assertSafeChetrum(
  value: number,
): void {
  if (
    !Number.isSafeInteger(
      value,
    ) ||
    value <
      0
  ) {
    throw new Error(
      'CSV money amount must be a non-negative safe integer.',
    )
  }
}

export function formatChetrumForCsv(
  amountChetrum: number,
): string {
  assertSafeChetrum(
    amountChetrum,
  )

  const whole =
    Math.floor(
      amountChetrum /
        100,
    )

  const cents =
    String(
      amountChetrum %
        100,
    ).padStart(
      2,
      '0',
    )

  return `${whole}.${cents}`
}

function protectSpreadsheetCell(
  value: string,
): string {
  return /^[=+\-@]/.test(
    value,
  )
    ? `'${value}`
    : value
}

function csvCell(
  value: string,
): string {
  const protectedValue =
    protectSpreadsheetCell(
      value,
    )

  return `"${protectedValue.replace(
    /"/g,
    '""',
  )}"`
}

export function buildMonthlyTransactionsCsv(
  transactions: MoneyTransaction[],
): string {
  const rows = [
    [
      'Date',
      'Type',
      'Category',
      'Amount (Nu.)',
      'Note',
    ].map(csvCell).join(','),
  ]

  for (
    const transaction of transactions
  ) {
    rows.push(
      [
        transaction.date,
        transaction.kind ===
          'income'
          ? 'Money in'
          : 'Money out',
        transaction.category,
        formatChetrumForCsv(
          transaction.amountChetrum,
        ),
        transaction.note,
      ].map(csvCell).join(
        ',',
      ),
    )
  }

  return `${rows.join(
    '\r\n',
  )}\r\n`
}

export function getMonthlyTransactionsCsvFilename(
  monthKey: string,
): string {
  const match =
    /^(\d{4})-(\d{2})$/.exec(
      monthKey,
    )

  if (!match) {
    throw new Error(
      'Report month must use YYYY-MM.',
    )
  }

  const month =
    Number(
      match[2],
    )

  if (
    month <
      1 ||
    month >
      12
  ) {
    throw new Error(
      'Report month must be between 01 and 12.',
    )
  }

  return `money-saathi-${monthKey}-transactions.csv`
}
