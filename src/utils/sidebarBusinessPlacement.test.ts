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
      '../components/AppShell.tsx',
      import.meta.url,
    ),
    'utf8',
  )

describe('desktop sidebar Business placement', () => {
  it('removes the MONEY section label', () => {
    expect(shell).not.toContain(
      '<p className="sidebar-label">Money</p>',
    )
  })

  it('keeps Home first and Business directly available after it', () => {
    expect(shell).not.toContain(
      'showBusiness',
    )

    expect(shell).not.toContain(
      'getProfile()',
    )

    const home =
      shell.indexOf(
        'to="/app"',
      )

    const business =
      shell.indexOf(
        'to="/app/business"',
        home + 1,
      )

    const transactions =
      shell.indexOf(
        'to="/app/transactions"',
        business + 1,
      )

    expect(home).toBeGreaterThan(
      -1,
    )

    expect(business).toBeGreaterThan(
      home,
    )

    expect(transactions).toBeGreaterThan(
      business,
    )
  })

  it('keeps only one desktop Business navigation link', () => {
    const occurrences =
      shell.match(
        /to="\/app\/business"/g,
      ) ?? []

    expect(
      occurrences,
    ).toHaveLength(1)
  })

  it('does not make More active for Business routes', () => {
    const prefixBlock =
      shell.slice(
        shell.indexOf(
          'const sidebarMorePrefixes',
        ),
        shell.indexOf(
          'const planPrefixes',
        ),
      )

    expect(
      prefixBlock,
    ).not.toContain(
      "'/app/business'",
    )
  })
})