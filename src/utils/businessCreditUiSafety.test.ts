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
      '../pages/BusinessCreditPage.tsx',
      import.meta.url,
    ),
    'utf8',
  )

describe('Business credit UI safety boundaries', () => {
  it('prevents outstanding amount above original amount', () => {
    expect(page).toContain(
      'Outstanding amount must be between zero and the original amount.',
    )
  })

  it('prevents due date before the source record date', () => {
    expect(page).toContain(
      'Due date cannot be earlier than the record date.',
    )
  })

  it('protects party roles that already have incompatible credit records', () => {
    expect(page).toContain(
      'This party already has credit records that do not fit the selected role.',
    )
  })

  it('makes settlement semantics explicit', () => {
    expect(page).toContain(
      'This changes only the outstanding credit record.',
    )

    expect(page).toContain(
      'Record actual cash movement separately in Business',
    )
  })
})