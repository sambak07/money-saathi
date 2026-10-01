import type {
  BusinessReport,
} from './businessReport'
import {
  formatNu,
} from './money'

export interface BusinessMonthlyReportPdfInput {
  businessName: string
  month: string
  periodStart: string
  periodEnd: string
  today: string
  report: BusinessReport
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

function validateMonth(
  month: string,
): void {
  if (
    !/^\d{4}-(0[1-9]|1[0-2])$/.test(
      month,
    )
  ) {
    throw new Error(
      'Business report month must use a valid YYYY-MM.',
    )
  }
}

function monthLabel(
  month: string,
): string {
  validateMonth(
    month,
  )

  const [
    year,
    monthNumber,
  ] =
    month.split('-')

  return `${
    MONTH_NAMES[
      Number(
        monthNumber,
      ) -
        1
    ]
  } ${year}`
}

function safePdfText(
  value: string,
  maxLength = 140,
): string {
  const withoutControls =
    Array.from(
      value,
    )
      .map(
        (character) => {
          const code =
            character.charCodeAt(
              0,
            )

          return (
            code <= 31 ||
            code === 127
          )
            ? ' '
            : character
        },
      )
      .join('')

  return withoutControls
    .replace(
      /\s+/g,
      ' ',
    )
    .trim()
    .slice(
      0,
      maxLength,
    )
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

export function getBusinessMonthlyReportPdfFilename(
  businessName: string,
  month: string,
): string {
  validateMonth(
    month,
  )

  return `money-saathi-${slugifyBusinessName(
    businessName,
  )}-${month}-business-report.pdf`
}

export async function buildBusinessMonthlyReportPdf(
  input: BusinessMonthlyReportPdfInput,
): Promise<ArrayBuffer> {
  validateMonth(
    input.month,
  )

  const {
    jsPDF,
  } =
    await import(
      'jspdf'
    )

  const doc =
    new jsPDF({
      orientation:
        'portrait',
      unit:
        'mm',
      format:
        'a4',
      compress:
        false,
    })

  const report =
    input.report

  const pageWidth =
    doc.internal.pageSize.getWidth()

  const left = 14
  const right = 14
  const contentWidth =
    pageWidth -
    left -
    right

  const businessName =
    safePdfText(
      input.businessName,
      90,
    ) ||
    'Business'

  const reportMonth =
    monthLabel(
      input.month,
    )

  function text(
    value: string,
    x: number,
    y: number,
    options?: {
      align?:
        | 'left'
        | 'center'
        | 'right'
    },
  ) {
    doc.text(
      safePdfText(
        value,
        220,
      ),
      x,
      y,
      options,
    )
  }

  function divider(
    y: number,
  ) {
    doc.setDrawColor(
      205,
    )
    doc.line(
      left,
      y,
      pageWidth -
        right,
      y,
    )
  }

  function metricBox(
    label: string,
    value: string,
    x: number,
    y: number,
    width: number,
  ) {
    doc.setDrawColor(
      215,
    )

    doc.roundedRect(
      x,
      y,
      width,
      22,
      2,
      2,
    )

    doc.setFont(
      'helvetica',
      'normal',
    )

    doc.setFontSize(
      8,
    )

    text(
      label,
      x +
        3,
      y +
        7,
    )

    doc.setFont(
      'helvetica',
      'bold',
    )

    doc.setFontSize(
      11,
    )

    text(
      value,
      x +
        3,
      y +
        16,
    )
  }

  doc.setProperties({
    title:
      `Money Saathi Business Report - ${businessName} - ${reportMonth}`,
    subject:
      'Money Saathi monthly business report',
    author:
      'Money Saathi',
    creator:
      'Money Saathi',
  })

  doc.setFont(
    'helvetica',
    'bold',
  )

  doc.setFontSize(
    9,
  )

  text(
    'Money Saathi ? Business',
    left,
    17,
  )

  doc.setFontSize(
    20,
  )

  text(
    'Monthly Business Report',
    left,
    27,
  )

  doc.setFontSize(
    12,
  )

  text(
    businessName,
    left,
    35,
  )

  doc.setFont(
    'helvetica',
    'normal',
  )

  doc.setFontSize(
    9,
  )

  text(
    reportMonth,
    left,
    41,
  )

  text(
    `Period: ${input.periodStart} to ${input.periodEnd}`,
    pageWidth -
      right,
    41,
    {
      align:
        'right',
    },
  )

  divider(
    46,
  )

  const metricGap = 3
  const metricWidth =
    (
      contentWidth -
      metricGap *
        3
    ) /
    4

  let x = left

  metricBox(
    'Sales',
    formatNu(
      report.registeredSalesChetrum,
    ),
    x,
    52,
    metricWidth,
  )

  x +=
    metricWidth +
    metricGap

  metricBox(
    'Purchases',
    formatNu(
      report.registeredPurchasesChetrum,
    ),
    x,
    52,
    metricWidth,
  )

  x +=
    metricWidth +
    metricGap

  metricBox(
    'Cash in',
    formatNu(
      report.recordedCashInChetrum,
    ),
    x,
    52,
    metricWidth,
  )

  x +=
    metricWidth +
    metricGap

  metricBox(
    'Cash out',
    formatNu(
      report.recordedCashOutChetrum,
    ),
    x,
    52,
    metricWidth,
  )

  doc.setDrawColor(
    215,
  )

  doc.roundedRect(
    left,
    80,
    contentWidth,
    31,
    2,
    2,
  )

  doc.setFont(
    'helvetica',
    'normal',
  )

  doc.setFontSize(
    8,
  )

  text(
    'Verified gross margin before other expenses',
    left +
      4,
    88,
  )

  doc.setFont(
    'helvetica',
    'bold',
  )

  doc.setFontSize(
    13,
  )

  text(
    formatNu(
      report.verifiedGrossMarginBeforeOtherBusinessExpensesChetrum,
    ),
    left +
      4,
    97,
  )

  doc.setFontSize(
    8,
  )

  text(
    'This is not net profit.',
    left +
      4,
    105,
  )

  doc.setFont(
    'helvetica',
    'normal',
  )

  doc.setFontSize(
    8,
  )

  const coverage =
    report.grossMarginCoverageComplete
      ? 'Margin coverage is complete for recorded sales in this period.'
      : `Based only on verified sales. ${report.unverifiedSaleDocumentCount} ${
          report.unverifiedSaleDocumentCount ===
          1
            ? 'sale needs'
            : 'sales need'
        } item-line or COGS review.`

  const coverageLines =
    doc.splitTextToSize(
      safePdfText(
        coverage,
        220,
      ),
      82,
    )

  doc.text(
    coverageLines,
    pageWidth -
      right -
      4,
    88,
    {
      align:
        'right',
    },
  )

  doc.setFont(
    'helvetica',
    'bold',
  )

  doc.setFontSize(
    11,
  )

  text(
    'Current position',
    left,
    124,
  )

  doc.setFont(
    'helvetica',
    'normal',
  )

  doc.setFontSize(
    8,
  )

  text(
    `As of ${input.today}`,
    left,
    130,
  )

  text(
    'These are current balances, not historical month-end balances.',
    left,
    136,
  )

  const currentGap = 4
  const currentWidth =
    (
      contentWidth -
      currentGap *
        2
    ) /
    3

  metricBox(
    'To collect',
    formatNu(
      report.currentReceivablesChetrum,
    ),
    left,
    143,
    currentWidth,
  )

  metricBox(
    'To pay',
    formatNu(
      report.currentPayablesChetrum,
    ),
    left +
      currentWidth +
      currentGap,
    143,
    currentWidth,
  )

  metricBox(
    'Estimated stock value',
    formatNu(
      report.estimatedStockValueChetrum,
    ),
    left +
      (
        currentWidth +
        currentGap
      ) *
        2,
    143,
    currentWidth,
  )

  doc.setFont(
    'helvetica',
    'bold',
  )

  doc.setFontSize(
    11,
  )

  text(
    'Attention',
    left,
    180,
  )

  doc.setFont(
    'helvetica',
    'normal',
  )

  doc.setFontSize(
    9,
  )

  const attentionRows = [
    `Overdue to collect: ${formatNu(
      report.overdueReceivablesChetrum,
    )}`,
    `Overdue to pay: ${formatNu(
      report.overduePayablesChetrum,
    )}`,
    `Low-stock items: ${report.lowStockItemCount}`,
    `Negative-stock items: ${report.negativeStockItemCount}`,
  ]

  attentionRows.forEach(
    (
      row,
      index,
    ) => {
      text(
        row,
        left,
        188 +
          index *
            7,
      )
    },
  )

  divider(
    220,
  )

  doc.setFontSize(
    8,
  )

  text(
    'Sales, cash, current dues and stock remain separate.',
    left,
    228,
  )

  const disclaimer =
    'This is not an audited financial statement, tax return, GST/BST filing or full accounting ledger.'

  const disclaimerLines =
    doc.splitTextToSize(
      disclaimer,
      contentWidth,
    )

  doc.text(
    disclaimerLines,
    left,
    236,
  )

  doc.setFontSize(
    7,
  )

  text(
    'Generated locally on this device by Money Saathi.',
    left,
    255,
  )

  text(
    'No cloud PDF service is required.',
    left,
    261,
  )

  return doc.output(
    'arraybuffer',
  )
}
