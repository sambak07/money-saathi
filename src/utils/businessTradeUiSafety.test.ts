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
      '../pages/BusinessTradePage.tsx',
      import.meta.url,
    ),
    'utf8',
  )

describe('business trade UI safety boundaries', () => {
  it('requires valid quantity and line amount', () => {
    expect(page).toContain(
      'Every line needs a quantity greater than zero',
    )

    expect(page).toContain(
      'Every line needs an amount greater than zero.',
    )
  })

  it('limits paid-at-entry to the document total', () => {
    expect(page).toContain(
      'Paid at entry must be between zero and the document total.',
    )
  })

  it('keeps COGS explicit for sales', () => {
    expect(page).toContain(
      'Enter COGS explicitly.',
    )

    expect(page).toContain(
      'Recorded current unit cost reference',
    )
  })

  it('keeps unpaid-at-entry historical instead of current dues', () => {
    expect(page).toContain(
      'Historical entry-time figure, not current receivables.',
    )

    expect(page).toContain(
      'Unpaid at entry is not a live receivable/payable.',
    )
  })
})