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
      '../pages/BusinessReportsPage.tsx',
      import.meta.url,
    ),
    'utf8',
  )

describe('simple business reports safety boundaries', () => {
  it('does not call gross margin net profit', () => {
    expect(page).toContain(
      'This is not net profit.',
    )
  })

  it('surfaces incomplete verified-margin coverage', () => {
    expect(page).toContain(
      'Margin is based only on verified sales.',
    )

    expect(page).toContain(
      'item-line or COGS review.',
    )
  })

  it('states the reporting boundary clearly', () => {
    expect(page).toContain(
      'Sales, cash,',
    )

    expect(page).toContain(
      'current dues and stock remain separate.',
    )

    expect(page).toContain(
      'It is not an',
    )

    expect(page).toContain(
      'audited financial statement, tax return, GST/BST filing',
    )
  })
})