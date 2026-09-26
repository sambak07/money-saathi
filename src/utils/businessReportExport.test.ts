import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  BusinessReport,
} from './businessReport'
import {
  buildBusinessMonthlyReportCsv,
  getBusinessMonthlyReportCsvFilename,
} from './businessReportExport'

const report:
  BusinessReport = {
    startDate:
      '2026-09-01',
    endDate:
      '2026-09-26',
    registeredSalesChetrum:
      1_000_000,
    registeredPurchasesChetrum:
      400_000,
    recordedCashInChetrum:
      800_000,
    recordedCashOutChetrum:
      300_000,
    recordedCashNetChetrum:
      500_000,
    verifiedSalesWithCogsChetrum:
      800_000,
    explicitCogsChetrum:
      350_000,
    verifiedGrossMarginBeforeOtherBusinessExpensesChetrum:
      450_000,
    grossMarginCoverageComplete:
      false,
    unverifiedSaleDocumentCount:
      1,
    currentReceivablesChetrum:
      200_000,
    currentPayablesChetrum:
      125_000,
    currentOpenPositionChetrum:
      75_000,
    overdueReceivablesChetrum:
      50_000,
    overduePayablesChetrum:
      25_000,
    overdueOpenItemCount:
      2,
    estimatedStockValueChetrum:
      700_000,
    lowStockItemCount:
      3,
    negativeStockItemCount:
      1,
  }

describe('business monthly report CSV export', () => {
  it('keeps monthly activity and current position explicitly separate', () => {
    const csv =
      buildBusinessMonthlyReportCsv({
        businessName:
          'Karma General Shop',
        month:
          '2026-09',
        periodStart:
          '2026-09-01',
        periodEnd:
          '2026-09-26',
        today:
          '2026-09-26',
        report,
      })

    expect(csv).toContain(
      '"Monthly activity","Sales","10000.00","Nu."',
    )

    expect(csv).toContain(
      '"Current position","To collect","2000.00","Nu."',
    )

    expect(csv).toContain(
      'not historical month-end balances',
    )
  })

  it('does not call verified gross margin net profit', () => {
    const csv =
      buildBusinessMonthlyReportCsv({
        businessName:
          'Shop',
        month:
          '2026-09',
        periodStart:
          '2026-09-01',
        periodEnd:
          '2026-09-26',
        today:
          '2026-09-26',
        report,
      })

    expect(csv).toContain(
      'this is not net profit',
    )

    expect(csv).toContain(
      '"Gross margin coverage","Incomplete"',
    )
  })

  it('protects formula-like business names in CSV', () => {
    const csv =
      buildBusinessMonthlyReportCsv({
        businessName:
          '=BAD()',
        month:
          '2026-09',
        periodStart:
          '2026-09-01',
        periodEnd:
          '2026-09-26',
        today:
          '2026-09-26',
        report,
      })

    expect(csv).toContain(
      '"\'=BAD()"',
    )
  })

  it('creates a safe business-specific filename', () => {
    expect(
      getBusinessMonthlyReportCsvFilename(
        'Karma General Shop',
        '2026-09',
      ),
    ).toBe(
      'money-saathi-karma-general-shop-2026-09-business-report.csv',
    )

    expect(() =>
      getBusinessMonthlyReportCsvFilename(
        'Shop',
        '2026-13',
      ),
    ).toThrow()
  })
})
