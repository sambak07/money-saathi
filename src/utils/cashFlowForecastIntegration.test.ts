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
  source('../pages/CashFlowForecastPage.tsx')

const more =
  source('../pages/MorePage.tsx')

const month =
  source('../pages/MyMonthPage.tsx')

const engine =
  source('./cashFlowForecast.ts')

describe('cash-flow forecast integration', () => {
  it('registers and exposes the forecast route', () => {
    expect(app).toContain(
      "const CashFlowForecastPage = lazy(() => import('./pages/CashFlowForecastPage'))",
    )

    expect(app).toContain(
      'path="/app/forecast"',
    )

    expect(more).toContain(
      "to: '/app/forecast'",
    )

    expect(month).toContain(
      'to="/app/forecast"',
    )
  })

  it('keeps the forecast explicitly separate from current cash', () => {
    expect(page).toContain(
      'This is a',
    )

    expect(page).toContain(
      'planning scenario, not a bank balance.',
    )

    expect(page).toContain(
      'Scheduled money is not guaranteed money.',
    )

    expect(page).toContain(
      'It is never added to today&apos;s Safe to',
    )
  })

  it('uses only deterministic local schedule and transaction data', () => {
    expect(engine).toContain(
      'buildMoneyTimeline(',
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

  it('does not silently pull loans or schemes into the forecast', () => {
    expect(page).toContain(
      'payments are represented in Regular Money.',
    )

    expect(engine).toContain(
      'transactions,',
    )

    expect(engine).toContain(
      '[],',
    )
  })
})