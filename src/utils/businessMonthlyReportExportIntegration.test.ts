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

const home =
  readFileSync(
    new URL(
      '../pages/SimpleBusinessHomePage.tsx',
      import.meta.url,
    ),
    'utf8',
  )

const styles =
  readFileSync(
    new URL(
      '../styles/business-reports.css',
      import.meta.url,
    ),
    'utf8',
  )

describe('business monthly report downloads', () => {
  it('offers local Print/Save PDF and CSV flows', () => {
    expect(page).toContain(
      'Print / Save PDF',
    )

    expect(page).toContain(
      'Download CSV',
    )

    expect(page).toContain(
      'window.print()',
    )

    expect(page).toContain(
      'URL.createObjectURL',
    )
  })

  it('preserves the selected business when opening reports', () => {
    expect(home).toContain(
      '/app/business/reports?businessId=',
    )

    expect(page).toMatch(
      /searchParams\.get\(\s*'businessId'/,
    )

    expect(page).toMatch(
      /records\.find\(\s*\(business\)\s*=>\s*business\.id ===\s*requestedBusinessId/,
    )
  })

  it('prints only a dedicated truthful business report card', () => {
    expect(page).toContain(
      'Monthly Business Report',
    )

    expect(page).toContain(
      'These are current balances, not historical month-end balances.',
    )

    expect(page).toContain(
      'This is not net profit.',
    )

    expect(styles).toContain(
      '@media print',
    )

    expect(styles).toContain(
      '.business-monthly-report-card',
    )

    expect(styles).toContain(
      'visibility: hidden !important',
    )
  })
})
