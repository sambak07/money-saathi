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
      '../pages/BusinessQuickAddPage.tsx',
      import.meta.url,
    ),
    'utf8',
  )

describe('business quick add safety boundaries', () => {
  it('does not pretend one click silently creates multiple accounting records', () => {
    expect(page).toContain(
      'without mixing sales, cash and dues.',
    )

    expect(page).toContain(
      'Record the related cash movement separately',
    )
  })

  it('keeps sale cash stock and dues conceptually separate', () => {
    expect(page).toContain(
      'A sale is not automatically cash received.',
    )

    expect(page).toMatch(
      /A customer due is\s+not cash in hand\./,
    )

    expect(page).toMatch(
      /A stock purchase is not the same thing as\s+every business expense\./,
    )
  })

  it('contains no network call', () => {
    expect(page).not.toContain(
      'fetch(',
    )
  })
})