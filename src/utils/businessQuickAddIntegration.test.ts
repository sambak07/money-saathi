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

const quickAdd =
  source('../pages/BusinessQuickAddPage.tsx')

const home =
  source('../pages/SimpleBusinessHomePage.tsx')

describe('business quick add integration', () => {
  it('registers a dedicated simple Add route', () => {
    expect(app).toContain(
      "const BusinessQuickAddPage = lazy(() => import('./pages/BusinessQuickAddPage'))",
    )

    expect(app).toContain(
      'path="/app/business/add"',
    )
  })

  it('makes Add the primary Business Home action', () => {
    expect(home).toContain(
      'to="/app/business/add"',
    )

    expect(home).toMatch(
      /className="simple-business-primary-action"[\s\S]*to="\/app\/business\/add"[\s\S]*>\s*Add\s*<\/Link>/,
    )
  })

  it('offers the five core small-business actions', () => {
    for (
      const marker of [
        "title: 'Sale'",
        "title: 'Purchase'",
        "title: 'Expense'",
        "title: 'Payment received'",
        "title: 'Payment made'",
      ]
    ) {
      expect(
        quickAdd,
      ).toContain(
        marker,
      )
    }
  })

  it('reuses existing detailed workflows instead of duplicating financial logic', () => {
    expect(quickAdd).toContain(
      "to: '/app/business/trade'",
    )

    expect(quickAdd).toContain(
      "to: '/app/business/cash'",
    )

    expect(quickAdd).toContain(
      "to: '/app/business/credit'",
    )
  })
})