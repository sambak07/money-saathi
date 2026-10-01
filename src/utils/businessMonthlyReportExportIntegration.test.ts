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
  it('offers local direct PDF and CSV downloads', () => {
    expect(page).toContain(
      'Download PDF',
    )

    expect(page).toContain(
      'Download CSV',
    )

    expect(page).toContain(
      'buildBusinessMonthlyReportPdf',
    )

    expect(page).toMatch(
      /type:\s*'application\/pdf'/,
    )

    expect(page).toContain(
      'URL.createObjectURL',
    )

    expect(page).not.toContain(
      'window.print()',
    )
  })

  it('preserves the selected business when opening reports', () => {
    expect(home).toContain(
      'businessWorkspaceRoute(',
    )

    expect(home).toContain(
      "'/app/business/reports'",
    )

    expect(page).toMatch(
      /searchParams\.get\(\s*'businessId'/,
    )

    expect(page).toContain(
      'resolveBusinessWorkspaceId(',
    )

    expect(page).toContain(
      'businessWorkspaceSearchParams(',
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
      '> :not(.business-monthly-report-card)',
    )

    expect(styles).toContain(
      'display: none !important',
    )

    expect(styles).toContain(
      'position: static !important',
    )

    expect(styles).not.toContain(
      'body * {\n    visibility: hidden !important;',
    )
  })
})
