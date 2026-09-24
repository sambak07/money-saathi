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
  source('../pages/MyMonthPage.tsx')

const more =
  source('../pages/MorePage.tsx')

const dashboard =
  source('../pages/DashboardPage.tsx')

const simple =
  source('../pages/SimpleHomePage.tsx')

describe('My Month product integration', () => {
  it('registers the My Month route', () => {
    expect(app).toContain(
      "const MyMonthPage = lazy(() => import('./pages/MyMonthPage'))",
    )

    expect(app).toContain(
      'path="/app/month"',
    )
  })

  it('is discoverable from More and both Home experiences', () => {
    expect(more).toContain(
      "to: '/app/month'",
    )

    expect(dashboard).toContain(
      'to="/app/month"',
    )

    expect(simple).toContain(
      'to="/app/month"',
    )
  })

  it('states the financial boundary around scheduled income', () => {
    expect(page).toContain(
      'Future income',
    )

    expect(page).toContain(
      'is never added to current cash.',
    )

    expect(page).toContain(
      'Scheduled only. It is not treated as current cash.',
    )

    expect(page).toContain(
      'Scheduled income may not arrive and Money',
    )

    expect(page).toContain(
      'Saathi does not count it inside current Safe to Spend.',
    )
  })

  it('keeps the monthly page connected to deterministic local records', () => {
    expect(page).toContain(
      'buildMonthPlan(',
    )

    expect(page).toContain(
      'getTransactions()',
    )

    expect(page).toContain(
      'getRegularMoney()',
    )

    expect(page).not.toContain(
      'fetch(',
    )
  })
})