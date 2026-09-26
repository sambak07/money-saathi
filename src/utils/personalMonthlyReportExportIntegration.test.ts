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
      '../pages/ReportsPage.tsx',
      import.meta.url,
    ),
    'utf8',
  )

const styles =
  readFileSync(
    new URL(
      '../styles/reports.css',
      import.meta.url,
    ),
    'utf8',
  )

describe('personal monthly report export integration', () => {
  it('offers local print-to-PDF and CSV flows', () => {
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

  it('renders a truthful monthly report card', () => {
    expect(page).toContain(
      'Monthly Money Report',
    )

    expect(page).toContain(
      'Based only on transactions recorded in Money Saathi.',
    )

    expect(page).toContain(
      'not a bank statement or audited financial statement',
    )
  })

  it('prints only the dedicated report card', () => {
    expect(styles).toContain(
      '@media print',
    )

    expect(styles).toContain(
      '.reports-report-card',
    )

    expect(styles).toContain(
      'visibility: hidden !important',
    )
  })
})
