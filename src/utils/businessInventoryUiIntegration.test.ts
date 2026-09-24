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
  source('../pages/BusinessInventoryPage.tsx')

const business =
  source('../pages/BusinessPage.tsx')

const more =
  source('../pages/MorePage.tsx')

describe('business inventory UI integration', () => {
  it('registers and exposes the inventory route', () => {
    expect(app).toContain(
      "const BusinessInventoryPage = lazy(() => import('./pages/BusinessInventoryPage'))",
    )

    expect(app).toContain(
      'path="/app/business/inventory"',
    )

    expect(business).toContain(
      'to="/app/business/inventory"',
    )

    expect(more).toContain(
      "to: '/app/business/inventory'",
    )
  })

  it('uses local inventory and trade-line data only', () => {
    expect(page).toContain(
      'getBusinessInventoryItems(',
    )

    expect(page).toContain(
      'getBusinessTradeLines(',
    )

    expect(page).toContain(
      'upsertBusinessInventoryItem(',
    )

    expect(page).not.toContain(
      'fetch(',
    )
  })

  it('keeps stock valuation boundaries explicit', () => {
    expect(page).toContain(
      'Stock value is an estimate, not cash or profit.',
    )

    expect(page).toContain(
      'recorded current unit cost',
    )

    expect(page).toContain(
      'Sale COGS remains a separate',
    )
  })

  it('archives inventory without deleting historical records', () => {
    expect(page).toContain(
      'Historical stock records remain.',
    )

    expect(page).toContain(
      'Archiving an item never deletes its historical records.',
    )
  })
})