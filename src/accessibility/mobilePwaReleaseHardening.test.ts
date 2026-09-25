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

const indexHtml =
  source('../../index.html')

const shell =
  source('../components/AppShell.tsx')

const dashboardCss =
  source('../styles/dashboard.css')

const accessibilityCss =
  source('../styles/accessibility.css')

const pwaCss =
  source('../styles/pwa-update.css')

const saathiCss =
  source('../styles/saathi-floating.css')

describe('Stage 12B mobile PWA accessibility hardening', () => {
  it('enables safe-area aware standalone layout', () => {
    expect(indexHtml).toContain(
      'viewport-fit=cover',
    )

    expect(dashboardCss).toContain(
      'env(safe-area-inset-bottom)',
    )

    expect(dashboardCss).toContain(
      'env(safe-area-inset-left)',
    )

    expect(dashboardCss).toContain(
      'env(safe-area-inset-right)',
    )
  })

  it('keeps PWA update controls clear of the bottom navigation', () => {
    expect(pwaCss).toContain(
      '@media (max-width: 850px)',
    )

    expect(pwaCss).toContain(
      'bottom: auto;',
    )

    expect(pwaCss).toContain(
      'safe-area-inset-top',
    )

    expect(pwaCss).toContain(
      'min-height: 44px;',
    )
  })

  it('keeps Saathi above mobile navigation and device safe areas', () => {
    expect(saathiCss).toContain(
      'calc(98px + env(safe-area-inset-bottom))',
    )

    expect(saathiCss).toContain(
      'calc(96px + env(safe-area-inset-bottom))',
    )

    expect(saathiCss).toContain(
      'min-height: 44px;',
    )
  })

  it('enforces a 44px mobile touch-target floor', () => {
    expect(accessibilityCss).toContain(
      'Stage 12B: mobile touch target floor',
    )

    expect(accessibilityCss).toContain(
      'min-height: var(--control-min-height) !important;',
    )
  })

  it('marks supporting planning destinations consistently', () => {
    expect(shell).toContain(
      "'/app/month'",
    )

    expect(shell).toContain(
      "'/app/forecast'",
    )

    expect(shell).toMatch(
      /const planPrefixes[\s\S]*'\/app\/debt-goals'/,
    )
  })
})