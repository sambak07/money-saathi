/// <reference types="node" />

import {
  readFileSync,
} from 'node:fs'
import {
  describe,
  expect,
  it,
} from 'vitest'

const personal =
  readFileSync(
    new URL(
      '../styles/reports.css',
      import.meta.url,
    ),
    'utf8',
  )

const business =
  readFileSync(
    new URL(
      '../styles/business-reports.css',
      import.meta.url,
    ),
    'utf8',
  )

describe(
  'report print pagination',
  () => {
    it(
      'removes non-report personal content from print layout',
      () => {
        expect(
          personal,
        ).toContain(
          '.reports-page > :not(.reports-report-card)',
        )

        expect(
          personal,
        ).toContain(
          'display: none !important;',
        )

        expect(
          personal,
        ).toContain(
          'position: static !important;',
        )

        expect(
          personal,
        ).not.toContain(
          'body * {\n    visibility: hidden !important;',
        )
      },
    )

    it(
      'removes non-report business content from print layout',
      () => {
        expect(
          business,
        ).toContain(
          '> :not(.business-monthly-report-card)',
        )

        expect(
          business,
        ).toContain(
          'position: static !important;',
        )

        expect(
          business,
        ).not.toContain(
          'body * {\n    visibility: hidden !important;',
        )
      },
    )

    it(
      'hides application chrome while printing reports',
      () => {
        for (
          const stylesheet of
            [personal, business]
        ) {
          expect(
            stylesheet,
          ).toContain(
            '.app-sidebar,',
          )

          expect(
            stylesheet,
          ).toContain(
            '.mobile-nav,',
          )

          expect(
            stylesheet,
          ).toContain(
            '.saathi-floating-launcher',
          )
        }
      },
    )
  },
)
