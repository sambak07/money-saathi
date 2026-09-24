/// <reference types="node" />

import {
  readFileSync,
} from 'node:fs'
import {
  describe,
  expect,
  it,
} from 'vitest'

const page =
  readFileSync(
    new URL(
      '../pages/DataExportPage.tsx',
      import.meta.url,
    ),
    'utf8',
  )

describe('business data portability integration', () => {
  it('loads every current Business 3.0 collection', () => {
    for (
      const marker of [
        'getBusinessTransactions(',
        'getBusinessParties(',
        'getBusinessOpenItems(',
        'getBusinessTradeEntries(',
        'getBusinessTradeLines(',
        'getBusinessInventoryItems(',
      ]
    ) {
      expect(page).toContain(
        marker,
      )
    }
  })

  it('keeps the cash CSV while adding one complete structured export', () => {
    expect(page).toContain(
      'buildBusinessTransactionsCsv(',
    )

    expect(page).toContain(
      'buildBusinessPortableJson(',
    )

    expect(page).toContain(
      'Cash CSV',
    )

    expect(page).toContain(
      'Complete JSON',
    )
  })

  it('keeps plain export separate from encrypted restore', () => {
    expect(page).toContain(
      'They are plain readable files',
    )

    expect(page).toContain(
      'are not used as a',
    )

    expect(page).toContain(
      'restore path.',
    )

    expect(page).toContain(
      'encrypted Money Saathi backup',
    )
  })
})