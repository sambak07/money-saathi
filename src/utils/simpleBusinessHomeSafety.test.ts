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
      '../pages/SimpleBusinessHomePage.tsx',
      import.meta.url,
    ),
    'utf8',
  )

describe('simple business home safety boundaries', () => {
  it('does not call gross margin net profit', () => {
    expect(page).toContain(
      'This is not net profit.',
    )
  })

  it('surfaces incomplete margin coverage rather than guessing', () => {
    expect(page).toContain(
      'Based only on verified sales.',
    )

    expect(page).toContain(
      'not included yet.',
    )
  })

  it('keeps sales cash stock and dues conceptually separate', () => {
    expect(page).toContain(
      'Sales are not automatically cash received.',
    )

    expect(page).toContain(
      'Stock is not',
    )

    expect(page).toContain(
      'Customer dues are not cash in hand.',
    )
  })

  it('contains no network call', () => {
    expect(page).not.toContain(
      'fetch(',
    )
  })
})