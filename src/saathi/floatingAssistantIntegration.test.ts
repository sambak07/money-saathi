/// <reference types="node" />

import {
  readFileSync,
} from 'node:fs'
import {
  describe,
  expect,
  it,
} from 'vitest'

function readSource(
  relativePath: string,
): string {
  return readFileSync(
    new URL(
      relativePath,
      import.meta.url,
    ),
    'utf8',
  )
}

const shell =
  readSource('../components/AppShell.tsx')

const assistant =
  readSource('../components/SaathiFloatingAssistant.tsx')

const css =
  readSource('../styles/saathi-floating.css')

describe('persistent Saathi assistant integration', () => {
  it('mounts Saathi once in the shared app shell', () => {
    expect(shell).toContain(
      "import SaathiFloatingAssistant from './SaathiFloatingAssistant'",
    )

    expect(shell).toContain(
      '<SaathiFloatingAssistant />',
    )
  })

  it('is explicitly local-only and excludes Money Vault from its answers', () => {
    expect(assistant).toContain(
      'Everything here runs locally.',
    )

    expect(assistant).toContain(
      'Money Vault stays private',
    )

    expect(assistant).not.toContain(
      'getVault',
    )

    expect(assistant).not.toContain(
      'decryptVault',
    )
  })

  it('contains no network or model API integration', () => {
    expect(assistant).not.toContain(
      'fetch(',
    )

    expect(assistant).not.toContain(
      'axios',
    )

    expect(assistant).not.toContain(
      'openai',
    )

    expect(assistant).not.toContain(
      'apiKey',
    )
  })

  it('floats above the mobile navigation rather than covering it', () => {
    expect(css).toContain(
      'bottom: 98px;',
    )

    expect(css).toContain(
      'bottom: 154px;',
    )
  })

  it('has accessible open, close and keyboard escape controls', () => {
    expect(assistant).toContain(
      'aria-expanded={open}',
    )

    expect(assistant).toContain(
      'aria-label="Close Saathi"',
    )

    expect(assistant).toContain(
      "event.key ===\n        'Escape'",
    )
  })
})