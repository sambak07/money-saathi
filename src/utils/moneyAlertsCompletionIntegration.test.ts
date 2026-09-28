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
      '../pages/AlertCentrePage.tsx',
      import.meta.url,
    ),
    'utf8',
  )

const engine =
  readFileSync(
    new URL(
      './moneyAlerts.ts',
      import.meta.url,
    ),
    'utf8',
  )

const universe =
  readFileSync(
    new URL(
      '../alerts/alertUniverse.ts',
      import.meta.url,
    ),
    'utf8',
  )

describe('alert due-date completion integration', () => {
  it('loads recorded deposit and business due data', () => {
    for (
      const marker of [
        'getFixedDeposits()',
        'getRecurringDeposits()',
        'getBusinessProfiles()',
        'getBusinessOpenItems(',
      ]
    ) {
      expect(universe).toContain(
        marker,
      )
    }
  })

  it('feeds the new references into the existing alert engine', () => {
    expect(universe).toContain(
      'fixedDeposits:',
    )

    expect(universe).toContain(
      'recurringDeposits:',
    )

    expect(universe).toContain(
      'businessDues:',
    )

    expect(page).toContain(
      'buildAlertUniverseView({',
    )
  })

  it('keeps loan dates user-verified while deposit maturity is deterministic', () => {
    expect(page).toContain(
      'does not guess loan due dates',
    )

    expect(engine).toContain(
      'addMonthsClampedIso(',
    )

    expect(engine).toContain(
      'does not assume the maturity payout amount',
    )
  })

  it('does not add a network dependency', () => {
    expect(page).not.toContain(
      'fetch(',
    )

    expect(engine).not.toContain(
      'fetch(',
    )
  })
})