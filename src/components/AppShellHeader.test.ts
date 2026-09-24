/// <reference types="node" />

import {
  readFileSync,
} from 'node:fs'
import {
  describe,
  expect,
  it,
} from 'vitest'

const shell =
  readFileSync(
    new URL(
      './AppShell.tsx',
      import.meta.url,
    ),
    'utf8',
  )

describe('app header simplification', () => {
  it('does not render the full-width BhutanMark card', () => {
    expect(shell).not.toContain(
      '<BhutanMark />',
    )

    expect(shell).not.toContain(
      "import BhutanMark",
    )
  })

  it('keeps Alerts available as the compact top utility', () => {
    expect(shell).toContain(
      "import AlertBadge",
    )

    expect(shell).toContain(
      '<AlertBadge />',
    )

    expect(shell).toContain(
      'app-utility-row',
    )
  })

  it('keeps the Made in Bhutan attribution beside the permanent desktop brand', () => {
    expect(shell).toContain(
      'Made in Bhutan',
    )

    expect(shell).toContain(
      'Ngultrum-first · Local-first',
    )

    expect(shell).toContain(
      'sidebar-origin',
    )
  })
})