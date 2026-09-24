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

  it('keeps Business permanently visible before Home', () => {
    expect(shell).not.toContain(
      'showBusiness',
    )

    expect(shell).not.toContain(
      'getProfile()',
    )

    const business =
      shell.indexOf(
        'to="/app/business"',
      )

    const home =
      shell.indexOf(
        'to="/app"',
        business + 1,
      )

    expect(business).toBeGreaterThan(
      -1,
    )

    expect(home).toBeGreaterThan(
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