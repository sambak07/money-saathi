/// <reference types="node" />

import {
  readFileSync,
} from 'node:fs'
import {
  describe,
  expect,
  it,
} from 'vitest'

const assistant =
  readFileSync(
    new URL(
      '../components/SaathiFloatingAssistant.tsx',
      import.meta.url,
    ),
    'utf8',
  )

const css =
  readFileSync(
    new URL(
      '../styles/saathi-floating.css',
      import.meta.url,
    ),
    'utf8',
  )

describe('floating Saathi visual polish', () => {
  it('hides the launcher while the panel is open', () => {
    expect(assistant).toContain(
      '{!open && (',
    )

    expect(assistant).toContain(
      'aria-label="Ask Saathi"',
    )
  })

  it('keeps the input label accessible but visually hidden', () => {
    expect(css).toContain(
      '.saathi-floating-form .visually-hidden',
    )

    expect(css).toContain(
      'clip-path: inset(50%)',
    )
  })

  it('wraps suggestion chips instead of creating a horizontal scrollbar', () => {
    expect(css).toContain(
      'flex-wrap: wrap;',
    )

    expect(css).toContain(
      'overflow: visible;',
    )
  })

  it('keeps the desktop panel compact', () => {
    expect(css).toContain(
      'width: min(364px, calc(100vw - 32px));',
    )

    expect(css).toContain(
      'max-height: min(570px, calc(100vh - 48px));',
    )
  })

  it('keeps the open mobile panel above the bottom navigation', () => {
    expect(css).toContain(
      'calc(96px + env(safe-area-inset-bottom))',
    )

    expect(css).toContain(
      'env(safe-area-inset-top)',
    )

    expect(css).toContain(
      'env(safe-area-inset-bottom)',
    )
  })

  it('retains local-only privacy language', () => {
    expect(assistant).toContain(
      'Everything stays on this device.',
    )

    expect(assistant).toContain(
      'Local only · Vault stays private',
    )
  })
})