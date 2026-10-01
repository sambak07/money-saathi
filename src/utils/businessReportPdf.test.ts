import {
  Buffer,
} from 'node:buffer'

import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  BusinessReport,
} from './businessReport'
import {
  buildBusinessMonthlyReportPdf,
  getBusinessMonthlyReportPdfFilename,
} from './businessReportPdf'

const report:
  BusinessReport = {
    startDate:
      '2026-10-01',
    endDate:
      '2026-10-01',
    registeredSalesChetrum:
      0,
    registeredPurchasesChetrum:
      0,
    recordedCashInChetrum:
      40_000,
    recordedCashOutChetrum:
      0,
    recordedCashNetChetrum:
      40_000,
    verifiedSalesWithCogsChetrum:
      0,
    explicitCogsChetrum:
      0,
    verifiedGrossMarginBeforeOtherBusinessExpensesChetrum:
      0,
    grossMarginCoverageComplete:
      true,
    unverifiedSaleDocumentCount:
      0,
    currentReceivablesChetrum:
      0,
    currentPayablesChetrum:
      0,
    currentOpenPositionChetrum:
      0,
    overdueReceivablesChetrum:
      0,
    overduePayablesChetrum:
      0,
    overdueOpenItemCount:
      0,
    estimatedStockValueChetrum:
      0,
    lowStockItemCount:
      0,
    negativeStockItemCount:
      0,
  }

describe(
  'business monthly report PDF export',
  () => {
    it(
      'creates a real one-page PDF locally',
      async () => {
        const pdf =
          await buildBusinessMonthlyReportPdf({
            businessName:
              'Backup Test Shop',
            month:
              '2026-10',
            periodStart:
              '2026-10-01',
            periodEnd:
              '2026-10-01',
            today:
              '2026-10-01',
            report,
          })

        const bytes =
          Buffer.from(
            pdf,
          )

        const source =
          bytes.toString(
            'latin1',
          )

        expect(
          bytes.subarray(
            0,
            5,
          ).toString(
            'ascii',
          ),
        ).toBe(
          '%PDF-',
        )

        expect(
          bytes.byteLength,
        ).toBeGreaterThan(
          2_000,
        )

        expect(
          source.match(
            /\/Type \/Page\b/g,
          )?.length,
        ).toBe(
          1,
        )

        expect(
          source,
        ).toContain(
          'Money Saathi - Business',
        )

        expect(
          source,
        ).toContain(
          'Backup Test Shop',
        )

        expect(
          source,
        ).toContain(
          'This is not net profit.',
        )

        expect(
          source,
        ).toContain(
          'not historical month-end balances.',
        )

        expect(
          source,
        ).toContain(
          'No cloud PDF service is required.',
        )
      },
    )

    it(
      'creates a safe business-specific PDF filename',
      () => {
        expect(
          getBusinessMonthlyReportPdfFilename(
            'Backup Test Shop',
            '2026-10',
          ),
        ).toBe(
          'money-saathi-backup-test-shop-2026-10-business-report.pdf',
        )

        expect(
          () =>
            getBusinessMonthlyReportPdfFilename(
              'Shop',
              '2026-13',
            ),
        ).toThrow()
      },
    )
  },
)
