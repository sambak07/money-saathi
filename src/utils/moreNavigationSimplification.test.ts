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
      '../pages/MorePage.tsx',
      import.meta.url,
    ),
    'utf8',
  )

describe('simplified More navigation', () => {
  it('keeps a small visible quick-tools layer', () => {
    expect(page).toContain(
      'Quick tools',
    )

    for (
      const route of [
        '/app/month',
        '/app/forecast',
        '/app/alerts',
        '/app/saathi/ask',
        '/app/my-money',
        '/app/business',
      ]
    ) {
      expect(page).toContain(
        route,
      )
    }
  })

  it('keeps deeper tools available behind collapsible groups', () => {
    expect(page).toContain(
      '<details',
    )

    expect(page).toContain(
      'Plan and understand',
    )

    expect(page).toContain(
      'Money and commitments',
    )

    expect(page).toContain(
      'Privacy, data and setup',
    )
  })

  it('preserves access to important mobile-only supporting destinations', () => {
    for (
      const route of [
        '/app/regular-money',
        '/app/goals',
        '/app/reports',
        '/app/my-money/loans',
        '/app/my-money/schemes',
        '/app/vault',
        '/app/security',
        '/app/backup',
        '/app/data-export',
      ]
    ) {
      expect(page).toContain(
        route,
      )
    }
  })

  it('does not introduce network or financial logic into More', () => {
    expect(page).not.toContain(
      'fetch(',
    )

    expect(page).not.toContain(
      'amountChetrum',
    )
  })
})