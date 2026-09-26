/// <reference types="node" />

import {
  readFileSync,
} from 'node:fs'
import {
  describe,
  expect,
  it,
} from 'vitest'

const quickAdd =
  readFileSync(
    new URL(
      '../pages/BusinessQuickAddPage.tsx',
      import.meta.url,
    ),
    'utf8',
  )

const cashPage =
  readFileSync(
    new URL(
      '../pages/BusinessPage.tsx',
      import.meta.url,
    ),
    'utf8',
  )

const creditPage =
  readFileSync(
    new URL(
      '../pages/BusinessCreditPage.tsx',
      import.meta.url,
    ),
    'utf8',
  )

const tradePage =
  readFileSync(
    new URL(
      '../pages/BusinessTradePage.tsx',
      import.meta.url,
    ),
    'utf8',
  )

describe('business payment-message handoff', () => {
  it('carries only structured amount/date/direction/intent context', () => {
    expect(quickAdd).toMatch(
      /params\.set\(\s*'amountChetrum'/,
    )

    expect(quickAdd).toMatch(
      /params\.set\(\s*'direction'/,
    )

    expect(quickAdd).toMatch(
      /params\.set\(\s*'intent'/,
    )

    expect(quickAdd).not.toMatch(
      /params\.set\(\s*'message'/,
    )
  })

  it('prefills only the direct cash-flow workspace', () => {
    expect(cashPage).toContain(
      'Payment-message details were brought here for review.',
    )

    expect(cashPage).toContain(
      'useState(\n      importedAmount,',
    )

    expect(cashPage).toContain(
      "importedCash\n        ? 'Other'",
    )
  })

  it('does not auto-settle customer or supplier dues', () => {
    expect(creditPage).toContain(
      'Money Saathi has not changed any due automatically.',
    )

    expect(creditPage).not.toContain(
      'setOutstandingAmount(\n      imported',
    )
  })

  it('does not invent trade totals, COGS or stock movements', () => {
    expect(tradePage).toContain(
      'The payment amount is not automatically the sale total.',
    )

    expect(tradePage).toContain(
      'The payment amount is not automatically the purchase total.',
    )

    expect(tradePage).toContain(
      'No trade or stock record has been created automatically.',
    )
  })
})
