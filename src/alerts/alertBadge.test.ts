import {
  describe,
  expect,
  it,
} from 'vitest'
import {
  readFileSync,
} from 'node:fs'
import {
  fileURLToPath,
} from 'node:url'

const badgePath =
  fileURLToPath(
    new URL(
      '../components/AlertBadge.tsx',
      import.meta.url,
    ),
  )

const preferencesPath =
  fileURLToPath(
    new URL(
      '../alerts/alertPreferences.ts',
      import.meta.url,
    ),
  )

const badgeSource =
  readFileSync(
    badgePath,
    'utf8',
  )

const preferenceSource =
  readFileSync(
    preferencesPath,
    'utf8',
  )

describe('live alert badge', () => {
  it('counts the same deterministic alert engine used by the Alert Centre', () => {
    expect(
      badgeSource,
    ).toContain(
      'buildMoneyAlerts({',
    )

    expect(
      badgeSource,
    ).toContain(
      'buildLoanReminderReferences(',
    )
  })

  it('respects alerts hidden for today', () => {
    expect(
      badgeSource,
    ).toContain(
      'getAcknowledgedAlertIds(',
    )
  })

  it('refreshes after alert acknowledgement changes', () => {
    expect(
      preferenceSource,
    ).toContain(
      "'money-saathi-alerts-change'",
    )

    expect(
      badgeSource,
    ).toContain(
      "'money-saathi-alerts-change'",
    )
  })

  it('does not create a separate alert scoring model', () => {
    expect(
      badgeSource,
    ).not.toContain(
      'score',
    )
  })
})
