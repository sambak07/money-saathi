import type {
  BusinessReport,
} from './businessReport'
import {
  formatChetrumForCsv,
} from './reportExport'

interface BusinessMonthlyReportCsvInput {
  businessName: string
  month: string
  periodStart: string
  periodEnd: string
  today: string
  report: BusinessReport
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
  const safe =
    protectSpreadsheetCell(
      value,
    )

  return `"${safe.replace(
    /"/g,
    '""',
  )}"`
}

function moneyRow(
  scope: string,
  metric: string,
  amountChetrum: number,
  note: string,
): string[] {
  return [
    scope,
    metric,
    formatChetrumForCsv(
      Math.abs(
        amountChetrum,
      ),
    ),
    amountChetrum <
      0
      ? 'Nu. (negative)'
      : 'Nu.',
    note,
  ]
}

export function buildBusinessMonthlyReportCsv(
  input: BusinessMonthlyReportCsvInput,
): string {
  const report =
    input.report

  const rows:
    string[][] = [
      [
        'Business',
        input.businessName,
        '',
        '',
        '',
      ],
      [
        'Report month',
        input.month,
        '',
        '',
        '',
      ],
      [
        'Period',
        `${input.periodStart} to ${input.periodEnd}`,
        '',
        '',
        '',
      ],
      [
        'Current position date',
        input.today,
        '',
        '',
        'Current dues and stock are current figures, not historical month-end balances.',
      ],
      [
        'Scope',
        'Metric',
        'Value',
        'Unit',
        'Note',
      ],
      moneyRow(
        'Monthly activity',
        'Sales',
        report.registeredSalesChetrum,
        'Recorded sale documents in the selected period.',
      ),
      moneyRow(
        'Monthly activity',
        'Purchases',
        report.registeredPurchasesChetrum,
        'Recorded purchase documents in the selected period.',
      ),
      moneyRow(
        'Monthly activity',
        'Cash in',
        report.recordedCashInChetrum,
        'Recorded business money received in the selected period.',
      ),
      moneyRow(
        'Monthly activity',
        'Cash out',
        report.recordedCashOutChetrum,
        'Recorded business money paid in the selected period.',
      ),
      moneyRow(
        'Monthly activity',
        'Net recorded cash movement',
        report.recordedCashNetChetrum,
        'Cash in minus cash out.',
      ),
      moneyRow(
        'Monthly activity',
        'Verified gross margin before other expenses',
        report.verifiedGrossMarginBeforeOtherBusinessExpensesChetrum,
        'Verified sale-line amounts minus explicit COGS; this is not net profit.',
      ),
      [
        'Monthly activity',
        'Gross margin coverage',
        report.grossMarginCoverageComplete
          ? 'Complete'
          : 'Incomplete',
        '',
        report.grossMarginCoverageComplete
          ? 'All recorded sales in the period have verifiable item lines and explicit COGS.'
          : `${report.unverifiedSaleDocumentCount} sale(s) need item-line or COGS review.`,
      ],
      moneyRow(
        'Current position',
        'To collect',
        report.currentReceivablesChetrum,
        `Current outstanding customer dues as of ${input.today}.`,
      ),
      moneyRow(
        'Current position',
        'To pay',
        report.currentPayablesChetrum,
        `Current outstanding supplier dues as of ${input.today}.`,
      ),
      moneyRow(
        'Current position',
        'Open position',
        report.currentOpenPositionChetrum,
        'Current receivables minus current payables.',
      ),
      moneyRow(
        'Current position',
        'Overdue to collect',
        report.overdueReceivablesChetrum,
        `Current overdue receivables as of ${input.today}.`,
      ),
      moneyRow(
        'Current position',
        'Overdue to pay',
        report.overduePayablesChetrum,
        `Current overdue payables as of ${input.today}.`,
      ),
      moneyRow(
        'Current position',
        'Estimated stock value',
        report.estimatedStockValueChetrum,
        'Current quantity multiplied by recorded current unit cost.',
      ),
      [
        'Current position',
        'Low-stock items',
        String(
          report.lowStockItemCount,
        ),
        'count',
        '',
      ],
      [
        'Current position',
        'Negative-stock items',
        String(
          report.negativeStockItemCount,
        ),
        'count',
        'Review negative recorded quantities.',
      ],
      [
        'Boundary',
        'Reporting basis',
        '',
        '',
        'Sales, cash, current dues and stock remain separate. This is not an audited financial statement, tax return, GST/BST filing or full accounting ledger.',
      ],
    ]

  return `${rows.map(
    (row) =>
      row.map(
        csvCell,
      ).join(','),
  ).join(
    '\r\n',
  )}\r\n`
}

function slugifyBusinessName(
  businessName: string,
): string {
  const slug =
    businessName
      .trim()
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        '-',
      )
      .replace(
        /^-+|-+$/g,
        '',
      )
      .slice(
        0,
        48,
      )

  return slug ||
    'business'
}

export function getBusinessMonthlyReportCsvFilename(
  businessName: string,
  month: string,
): string {
  if (
    !/^\d{4}-(0[1-9]|1[0-2])$/.test(
      month,
    )
  ) {
    throw new Error(
      'Business report month must use a valid YYYY-MM.',
    )
  }

  return `money-saathi-${slugifyBusinessName(
    businessName,
  )}-${month}-business-report.csv`
}
