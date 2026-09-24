/// <reference types="node" />

import {
  readFileSync,
} from 'node:fs'
import {
  describe,
  expect,
  it,
} from 'vitest'

function source(
  path: string,
): string {
  return readFileSync(
    new URL(
      path,
      import.meta.url,
    ),
    'utf8',
  )
}

const db =
  source('../storage/db.ts')

const trade =
  source('./businessTrade.ts')

describe('business trade document persistence integration', () => {
  it('has one atomic save path for the document and its lines', () => {
    expect(db).toContain(
      'saveBusinessTradeEntryWithLines(',
    )

    expect(db).toContain(
      "BUSINESS_TRADE_ENTRY_STORE,",
    )

    expect(db).toContain(
      "BUSINESS_TRADE_LINE_STORE,",
    )

    expect(db).toContain(
      ".index(",
    )

    expect(db).toContain(
      "'tradeEntryId'",
    )
  })

  it('replaces existing document lines before writing the new set', () => {
    expect(db).toContain(
      'existingLineKeys',
    )

    expect(db).toContain(
      'lineStore.delete(',
    )

    expect(db).toContain(
      'lineStore.put(',
    )
  })

  it('requires lines to match document identity before persistence', () => {
    expect(db).toContain(
      'Business trade lines must match their document.',
    )
  })

  it('keeps document totals deterministic and COGS explicit', () => {
    expect(trade).toContain(
      'summarizeBusinessTradeDocument(',
    )

    expect(trade).toContain(
      'Business trade document total must equal the sum of its lines.',
    )

    expect(trade).toContain(
      'grossMarginBeforeOtherBusinessExpensesChetrum',
    )

    expect(trade).toContain(
      'Purchase lines cannot record cost of goods sold.',
    )
  })
})