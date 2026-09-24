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
  source('../pages/SimpleBusinessHomePage.tsx')

const cash =
  source('../pages/BusinessPage.tsx')

describe('simple business home integration', () => {
  it('makes the simple overview the Business landing page while preserving cash entry', () => {
    expect(app).toContain(
      "const SimpleBusinessHomePage = lazy(() => import('./pages/SimpleBusinessHomePage'))",
    )

    expect(app).toContain(
      'path="/app/business" element={<SimpleBusinessHomePage />}',
    )

    expect(app).toContain(
      'path="/app/business/cash" element={<BusinessPage />}',
    )

    expect(cash).toContain(
      'to="/app/business"',
    )
  })

  it('uses the deterministic Business reporting engine', () => {
    expect(page).toContain(
      'buildBusinessReport({',
    )

    expect(page).toContain(
      'getBusinessTransactions(',
    )

    expect(page).toContain(
      'getBusinessTradeEntries(',
    )

    expect(page).toContain(
      'getBusinessOpenItems(',
    )

    expect(page).toContain(
      'getBusinessInventoryItems(',
    )
  })

  it('answers the core small-business questions without exposing accounting jargon as the main workflow', () => {
    expect(page).toContain(
      'Sales this month',
    )

    expect(page).toContain(
      'Money in',
    )

    expect(page).toContain(
      'Money out',
    )

    expect(page).toContain(
      'To collect',
    )

    expect(page).toContain(
      'To pay',
    )

    expect(page).toContain(
      'What needs you?',
    )
  })

  it('keeps the detailed records available as secondary actions', () => {
    expect(page).toContain(
      'to="/app/business/trade"',
    )

    expect(page).toContain(
      'to="/app/business/cash"',
    )

    expect(page).toContain(
      'to="/app/business/credit"',
    )

    expect(page).toContain(
      'to="/app/business/inventory"',
    )
  })
})