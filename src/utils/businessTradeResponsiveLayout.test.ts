/// <reference types="node" />

import {
  readFileSync,
} from 'node:fs'
import {
  describe,
  expect,
  it,
} from 'vitest'

const css =
  readFileSync(
    new URL(
      '../styles/business-trade.css',
      import.meta.url,
    ),
    'utf8',
  )

describe('Business Trade responsive register layout', () => {
  it('allows the register grid columns to shrink inside the panel', () => {
    expect(css).toContain(
      'minmax(0, 1.2fr)',
    )

    expect(css).toContain(
      'minmax(0, 0.7fr)',
    )

    expect(css).toContain(
      'minmax(0, 1fr)',
    )

    expect(css).not.toContain(
      'minmax(170px, 1.2fr)',
    )

    expect(css).not.toContain(
      'minmax(130px, 0.7fr)',
    )

    expect(css).not.toContain(
      'minmax(180px, 1fr)',
    )
  })

  it('allows the panel and register children to shrink without page overflow', () => {
    expect(css).toMatch(
      /\.business-trade-panel\s*\{\s*min-width:\s*0;/,
    )

    expect(css).toMatch(
      /\.business-trade-register-row\s*\{\s*min-width:\s*0;/,
    )

    expect(css).toMatch(
      /\.business-trade-register-row > div\s*\{\s*min-width:\s*0;/,
    )
  })
})
