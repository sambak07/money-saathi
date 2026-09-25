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

const home =
  source('../pages/SimpleHomePage.tsx')

const business =
  source('../pages/SimpleBusinessHomePage.tsx')

describe('Stage 10C primary UX simplification', () => {
  it('keeps Home focused on three direct actions', () => {
    const match =
      home.match(
        /<nav[\s\S]*?className="simple-actions"[\s\S]*?<\/nav>/,
      )

    expect(match).not.toBeNull()

    const actions =
      match?.[0] ?? ''

    expect(actions).toContain(
      'to="/app/transactions/new"',
    )

    expect(actions).toContain(
      'to="/app/month"',
    )

    expect(actions).toContain(
      'to="/app/saathi/ask"',
    )

    expect(
      (
        actions.match(
          /<Link\b/g,
        ) ?? []
      ).length,
    ).toBe(3)
  })

  it('removes redundant Home setup and More cards from the primary flow', () => {
    expect(home).not.toContain(
      'Change Home view',
    )

    expect(home).not.toContain(
      'Need another tool?',
    )

    expect(home).toContain(
      'Safe to Spend',
    )

    expect(home).toContain(
      'Recent money',
    )
  })

  it('puts Business attention before secondary records and details', () => {
    const attention =
      business.indexOf(
        'What needs you?',
      )

    const records =
      business.indexOf(
        'Open what you need',
      )

    const details =
      business.indexOf(
        'More business details',
      )

    expect(attention).toBeGreaterThan(
      -1,
    )

    expect(records).toBeGreaterThan(
      attention,
    )

    expect(details).toBeGreaterThan(
      records,
    )
  })

  it('keeps advanced Business truth boundaries available but collapsed', () => {
    expect(business).toContain(
      '<details className="simple-business-details">',
    )

    expect(business).toContain(
      'This is not net profit.',
    )

    expect(business).toContain(
      'Sales are not automatically cash received.',
    )

    for (
      const route of [
        '/app/business/trade',
        '/app/business/credit',
        '/app/business/inventory',
        '/app/business/cash',
        '/app/business/reports',
      ]
    ) {
      expect(business).toContain(
        route,
      )
    }
  })

  it('does not introduce network calls into either primary screen', () => {
    expect(home).not.toContain(
      'fetch(',
    )

    expect(business).not.toContain(
      'fetch(',
    )
  })
})