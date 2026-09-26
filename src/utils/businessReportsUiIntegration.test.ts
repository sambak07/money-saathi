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
  source('../pages/BusinessReportsPage.tsx')

const home =
  source('../pages/SimpleBusinessHomePage.tsx')

describe('simple business reports integration', () => {
  it('registers the reports route and links it from Business Home', () => {
    expect(app).toContain(
      "const BusinessReportsPage = lazy(() => import('./pages/BusinessReportsPage'))",
    )

    expect(app).toContain(
      'path="/app/business/reports"',
    )

    expect(home).toContain(
      '/app/business/reports?businessId=',
    )

    expect(home).toMatch(
      /encodeURIComponent\(\s*selectedBusinessId/,
    )
  })

  it('uses the deterministic Business reporting engine', () => {
    expect(page).toContain(
      'buildBusinessReport({',
    )

    expect(page).toContain(
      'getBusinessMonthRange(',
    )
  })

  it('shows a monthly activity view and a separately labelled current position', () => {
    expect(page).toContain(
      'Recorded sale documents in this month.',
    )

    expect(page).toContain(
      'Recorded business money received in this month.',
    )

    expect(page).toContain(
      'Current position',
    )

    expect(page).toContain(
      'These figures are current, not historical month-end balances.',
    )
  })

  it('contains no network call', () => {
    expect(page).not.toContain(
      'fetch(',
    )
  })
})