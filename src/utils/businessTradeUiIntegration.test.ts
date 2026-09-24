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

const app =
  source('../App.tsx')

const page =
  source('../pages/BusinessTradePage.tsx')

const business =
  source('../pages/BusinessPage.tsx')

const inventory =
  source('../pages/BusinessInventoryPage.tsx')

const more =
  source('../pages/MorePage.tsx')

describe('business sales and purchases UI integration', () => {
  it('registers and exposes the trade route', () => {
    expect(app).toContain(
      "const BusinessTradePage = lazy(() => import('./pages/BusinessTradePage'))",
    )

    expect(app).toContain(
      'path="/app/business/trade"',
    )

    expect(business).toContain(
      'to="/app/business/trade"',
    )

    expect(inventory).toContain(
      'to="/app/business/trade"',
    )

    expect(more).toContain(
      "to: '/app/business/trade'",
    )
  })

  it('uses atomic local persistence for documents and lines', () => {
    expect(page).toContain(
      'saveBusinessTradeEntryWithLines(',
    )

    expect(page).toContain(
      'getBusinessTradeEntries(',
    )

    expect(page).toContain(
      'getBusinessTradeLines(',
    )

    expect(page).not.toContain(
      'fetch(',
    )
  })

  it('derives the document total from its item lines', () => {
    expect(page).toContain(
      'Calculated from item lines.',
    )

    expect(page).toContain(
      'summarizeBusinessTradeDocument(',
    )
  })

  it('keeps cash dues and register data explicitly separate', () => {
    expect(page).toContain(
      'Register, cash and dues remain separate.',
    )

    expect(page).toContain(
      'does not automatically',
    )

    expect(page).toContain(
      'create a Business cash transaction or a receivable/payable.',
    )
  })

  it('does not call gross margin profit', () => {
    expect(page).toContain(
      'Gross margin before other expenses',
    )

    expect(page).toContain(
      'Not profit.',
    )
  })
})