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

const tokens =
  readSource('../styles/tokens.css')

const shell =
  readSource('../components/AppShell.tsx')

const bhutanMark =
  readSource('../components/BhutanMark.tsx')

const landing =
  readSource('../styles/landing.css')

describe('Bhutan-first visual foundation', () => {
  it('defines the restrained local palette', () => {
    expect(tokens).toContain(
      '--color-saffron: #d6a13d',
    )

    expect(tokens).toContain(
      '--color-maroon: #7a3038',
    )

    expect(tokens).toContain(
      '--color-bg: #f7f2e8',
    )
  })

  it('keeps the visual language original and CSS-based', () => {
    expect(landing).toContain(
      'repeating-linear-gradient',
    )

    expect(landing).not.toContain(
      'url(',
    )
  })

  it('keeps Business as a direct core sidebar destination', () => {
    expect(shell).toContain(
      'to="/app/business"',
    )

    expect(shell).not.toContain(
      "'small-business'",
    )

    expect(shell).not.toContain(
      'showBusiness &&',
    )
  })

  it('keeps the Made in Bhutan strip calm rather than duplicating navigation', () => {
    expect(bhutanMark).toContain(
      '<AlertBadge />',
    )

    expect(bhutanMark).not.toContain(
      'Start here',
    )

    expect(bhutanMark).not.toContain(
      '>About<',
    )
  })
})