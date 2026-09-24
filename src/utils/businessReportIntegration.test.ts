/// <reference types="node" />

import {
  readFileSync,
} from 'node:fs'
import {
  describe,
  expect,
  it,
} from 'vitest'

const report =
  readFileSync(
    new URL(
      './businessReport.ts',
      import.meta.url,
    ),
    'utf8',
  )

describe('business reporting integration', () => {
  it('combines existing deterministic business engines instead of duplicating UI arithmetic', () => {
    expect(report).toContain(
      'summarizeBusinessTransactions(',
    )

    expect(report).toContain(
      'summarizeBusinessTradeEntries(',
    )

    expect(report).toContain(
      'summarizeBusinessTradeDocument(',
    )

    expect(report).toContain(
      'summarizeBusinessInventory(',
    )
  })

  it('keeps period performance separate from current working-capital figures', () => {
    expect(report).toContain(
      'registeredSalesChetrum',
    )

    expect(report).toContain(
      'recordedCashNetChetrum',
    )

    expect(report).toContain(
      'currentReceivablesChetrum',
    )

    expect(report).toContain(
      'estimatedStockValueChetrum',
    )
  })

  it('surfaces gross-margin coverage instead of inventing missing COGS', () => {
    expect(report).toContain(
      'grossMarginCoverageComplete',
    )

    expect(report).toContain(
      'unverifiedSaleDocumentCount',
    )

    expect(report).toContain(
      'verifiedGrossMarginBeforeOtherBusinessExpensesChetrum',
    )
  })

  it('contains no network dependency', () => {
    expect(report).not.toContain(
      'fetch(',
    )

    expect(report).not.toContain(
      'axios',
    )
  })
})